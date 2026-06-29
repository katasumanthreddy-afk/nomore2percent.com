import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { pusherServer } from '@/lib/pusher-server';

// POST /api/chat/send — sends a message and broadcasts it to the conversation's
// Pusher channel so both the visitor's browser and Sumanth's admin inbox update
// instantly, with no polling or page refresh.
export async function POST(req: NextRequest) {
  try {
    const { conversation_id, sender, message } = await req.json();

    if (!conversation_id || !sender || !message?.trim()) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    if (!['visitor', 'admin'].includes(sender)) {
      return NextResponse.json({ success: false, message: 'Invalid sender' }, { status: 400 });
    }

    // 1. Save message to database
    const { data: msg, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([{ conversation_id, sender, message: message.trim() }])
      .select()
      .single();

    if (error) throw error;

    // 2. Update conversation's last_message_at (for sorting the admin inbox)
    await supabaseAdmin
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation_id);

    // 3. Broadcast in real-time to anyone listening on this conversation's channel.
    // The visitor's widget AND the admin inbox both subscribe to `chat-${conversation_id}`,
    // so both sides see the message the instant it's sent — no refresh, no polling.
    await pusherServer.trigger(`chat-${conversation_id}`, 'new-message', msg);

    // 4. Also notify the admin's global inbox channel, so Sumanth gets a live
    // notification badge even if he's not currently viewing this specific conversation.
    if (sender === 'visitor') {
      await pusherServer.trigger('admin-inbox', 'new-lead-message', {
        conversation_id,
        message: message.trim(),
      });
    }

    return NextResponse.json({ success: true, data: msg });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
