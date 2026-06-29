import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/leads — submit a new lead (used by enquiry forms, WhatsApp CTAs, etc.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, area, budget, property_type, message, source } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, message: 'Name and phone are required' }, { status: 400 });
    }

    // Basic Indian mobile number validation
    const cleanPhone = phone.replace(/[\s+\-]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone.slice(-10))) {
      return NextResponse.json({ success: false, message: 'Please enter a valid Indian mobile number' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert([{ name, phone, email, area, budget, property_type, message, source: source || 'website' }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Lead saved successfully', lead: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Something went wrong' }, { status: 500 });
  }
}

// GET /api/leads — list all leads (used by admin dashboard)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, leads: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
