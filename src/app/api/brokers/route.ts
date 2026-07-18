import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/brokers — admin only, lists all brokers with their submission counts
export async function GET() {
  try {
    const { data: brokers, error } = await supabaseAdmin
      .from('brokers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: submissions } = await supabaseAdmin
      .from('property_submissions')
      .select('broker_id, status')
      .not('broker_id', 'is', null);

    const withCounts = (brokers || []).map((b) => ({
      ...b,
      submission_count: (submissions || []).filter((s) => s.broker_id === b.id).length,
      approved_count: (submissions || []).filter((s) => s.broker_id === b.id && s.status === 'approved').length,
    }));

    return NextResponse.json({ success: true, brokers: withCounts });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/brokers — admin only, adds/invites a new broker
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, rera_agent_number, notes } = body;

    if (!name || !phone || !email) {
      return NextResponse.json({ success: false, message: 'Name, phone, and email are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('brokers')
      .insert([{
        name, phone, email: email.toLowerCase().trim(),
        rera_agent_number: rera_agent_number || null,
        notes: notes || null,
        status: 'invited',
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, message: 'A broker with this email already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, broker: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
