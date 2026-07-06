import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { pusherServer } from '@/lib/pusher-server';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are the AI assistant for nomore2percent, a Hyderabad real estate marketplace.

Key facts about nomore2percent:
- We charge just 1% brokerage on property deals, vs the 2% industry standard in Hyderabad. This is always guaranteed, non-negotiable.
- We cover 12+ localities across Hyderabad including Gachibowli, Madhapur, Banjara Hills, Kondapur, Kokapet, and more.
- Every deal gets a dedicated broker. Typical response time from enquiry to visit is under 24 hours.
- The founder/lead broker is Sumanth, reachable on WhatsApp at +91 70132 24895.
- We also have a Market Survey where visitors can share info about their area (pricing, infrastructure) — link is /market-survey.

Your job:
1. Answer questions about the brokerage model, process, and coverage areas naturally and briefly.
2. When a visitor describes what they're looking for (area, budget, BHK, buy vs rent), use the search_properties tool to find real matching listings and mention them — don't invent property details.
3. If a visitor shows genuine interest (asking to be contacted, wants a site visit, or shares urgency) and you have their name and phone number, use the capture_lead tool to save it. Ask for name and phone naturally if you don't have them yet, but don't be pushy — only ask once you sense real interest.
4. If a visitor explicitly asks to speak to a human, to Sumanth, or seems frustrated / needs something you can't help with, use the request_human_handoff tool immediately.
5. Keep replies short — 2-4 sentences max, conversational, no walls of text. This is a chat widget, not an essay.
6. Never make up property details, prices, or availability that didn't come from the search_properties tool results.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_properties',
      description: 'Search active property listings by area, BHK, listing type, or max budget. Use whenever the visitor describes what kind of property they want.',
      parameters: {
        type: 'object',
        properties: {
          area: { type: 'string', description: 'Locality name, e.g. Gachibowli, Madhapur' },
          bhk: { type: 'number', description: 'Number of bedrooms desired' },
          listing_type: { type: 'string', enum: ['sale', 'rent'] },
          max_price: { type: 'number', description: 'Maximum budget in rupees, e.g. 10000000 for 1 crore' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'capture_lead',
      description: "Save the visitor's contact info as a lead once they've shown real interest and shared their name and phone number.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string', description: '10-digit Indian mobile number' },
          area: { type: 'string' },
          budget: { type: 'string' },
          property_type: { type: 'string' },
        },
        required: ['name', 'phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_human_handoff',
      description: "Escalate the conversation to Sumanth directly. Use when the visitor asks for a human, asks for Sumanth by name, or when you genuinely can't help further.",
      parameters: { type: 'object', properties: {} },
    },
  },
];

async function searchProperties(args: any) {
  let query = supabaseAdmin
    .from('properties')
    .select('id, title, area, price, bedrooms, listing_type, property_type, property_images(storage_path, is_primary)')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3);

  if (args.area) query = query.ilike('area', `%${args.area}%`);
  if (args.bhk) query = query.eq('bedrooms', args.bhk);
  if (args.listing_type) query = query.eq('listing_type', args.listing_type);
  if (args.max_price) query = query.lte('price_num', args.max_price);

  const { data, error } = await query;
  if (error || !data) return { results: [] };

  return {
    results: data.map((p: any) => ({
      id: p.id,
      title: p.title,
      area: p.area,
      price: p.price,
      bedrooms: p.bedrooms,
      listing_type: p.listing_type,
      url: `/properties/${p.id}`,
      image: (p.property_images || []).find((i: any) => i.is_primary)?.storage_path || p.property_images?.[0]?.storage_path || null,
    })),
  };
}

async function captureLead(args: any, conversationId: number) {
  const cleanPhone = String(args.phone || '').replace(/[\s+\-]/g, '');
  if (!/^[6-9]\d{9}$/.test(cleanPhone.slice(-10))) {
    return { saved: false, reason: 'invalid_phone' };
  }

  await supabaseAdmin.from('leads').insert([{
    name: args.name, phone: args.phone, area: args.area || null,
    budget: args.budget || null, property_type: args.property_type || null,
    source: 'ai-chat',
  }]);

  // Backfill the conversation record so the admin inbox shows a real name/number
  // instead of "Anonymous Visitor" once this hands off to a human.
  await supabaseAdmin
    .from('chat_conversations')
    .update({ visitor_name: args.name, visitor_phone: args.phone })
    .eq('id', conversationId);

  return { saved: true };
}

async function requestHandoff(conversationId: number) {
  await supabaseAdmin
    .from('chat_conversations')
    .update({ mode: 'human', handoff_requested: true })
    .eq('id', conversationId);

  await pusherServer.trigger('admin-inbox', 'handoff-requested', { conversation_id: conversationId });

  return { handed_off: true };
}

export async function POST(req: NextRequest) {
  try {
    const { conversation_id, message } = await req.json();

    if (!conversation_id || !message?.trim()) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, message: 'AI assistant is not configured yet.' }, { status: 500 });
    }

    // 1. Save the visitor's message
    const { data: visitorMsg } = await supabaseAdmin
      .from('chat_messages')
      .insert([{ conversation_id, sender: 'visitor', message: message.trim() }])
      .select()
      .single();

    if (visitorMsg) {
      await pusherServer.trigger(`chat-${conversation_id}`, 'new-message', visitorMsg);
    }
    await supabaseAdmin.from('chat_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation_id);

    // 2. Build conversation history for the model (last 20 messages)
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('sender, message')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20);

    const chatMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).map((m) => ({
        role: m.sender === 'ai' ? 'assistant' : m.sender === 'admin' ? 'assistant' : 'user',
        content: m.message,
      })),
    ];

    let propertyResults: any[] = [];
    let handoff = false;

    // 3. Tool-calling loop (max 3 rounds to avoid runaway calls)
    for (let round = 0; round < 3; round++) {
      const res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: chatMessages,
          tools: TOOLS,
          temperature: 0.4,
        }),
      });

      const data = await res.json();
      const choice = data.choices?.[0];
      const assistantMsg = choice?.message;

      if (!assistantMsg) break;

      if (assistantMsg.tool_calls?.length) {
        chatMessages.push(assistantMsg);

        for (const call of assistantMsg.tool_calls) {
          const args = JSON.parse(call.function.arguments || '{}');
          let result: any = {};

          if (call.function.name === 'search_properties') {
            result = await searchProperties(args);
            propertyResults = result.results;
          } else if (call.function.name === 'capture_lead') {
            result = await captureLead(args, conversation_id);
          } else if (call.function.name === 'request_human_handoff') {
            result = await requestHandoff(conversation_id);
            handoff = true;
          }

          chatMessages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        }
        continue; // loop again so the model can respond to tool results
      }

      // Final text reply
      const replyText = assistantMsg.content?.trim() || "Sorry, I didn't quite catch that — could you rephrase?";

      const { data: aiMsg } = await supabaseAdmin
        .from('chat_messages')
        .insert([{ conversation_id, sender: 'ai', message: replyText }])
        .select()
        .single();

      if (aiMsg) {
        await pusherServer.trigger(`chat-${conversation_id}`, 'new-message', aiMsg);
      }
      await supabaseAdmin.from('chat_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversation_id);

      return NextResponse.json({ success: true, reply: replyText, properties: propertyResults, handoff });
    }

    return NextResponse.json({ success: true, reply: "Let me get Sumanth to help with that directly.", properties: propertyResults, handoff: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Something went wrong' }, { status: 500 });
  }
}
