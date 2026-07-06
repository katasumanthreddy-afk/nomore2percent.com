import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/chat/messages/[conversationId] — fetch message history
// (used when a widget/inbox first loads a conversation, before live updates take over)
export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const { data: convo } = await supabaseAdmin
      .from('chat_conversations')
      .select('mode, handoff_requested')
      .eq('id', conversationId)
      .single();

    return NextResponse.json({ success: true, messages: data, mode: convo?.mode || 'ai', handoff_requested: convo?.handoff_requested || false });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
