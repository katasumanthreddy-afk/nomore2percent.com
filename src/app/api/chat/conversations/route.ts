import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/chat/conversations — start a new chat conversation for a visitor
export async function POST(req: NextRequest) {
  try {
    const { visitor_name, visitor_phone } = await req.json();

    const { data, error } = await supabaseAdmin
      .from('chat_conversations')
      .insert([{ visitor_name: visitor_name || 'Anonymous Visitor', visitor_phone: visitor_phone || null }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, conversation: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// GET /api/chat/conversations — list all conversations (admin inbox view)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_conversations')
      .select('*, chat_messages(count)')
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, conversations: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
