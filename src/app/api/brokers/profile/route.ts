import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// PATCH /api/brokers/profile — broker updates their own phone/RERA number.
// Deliberately restricted: status, mou_signed, rera_verified, email, and
// name all stay admin-controlled — a broker can't self-activate or
// self-verify. Changing the RERA number resets verification, since the old
// verification no longer applies to a different registration number.
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    const { data: broker } = await supabaseAdmin
      .from('brokers')
      .select('id, rera_agent_number')
      .ilike('email', user.email)
      .maybeSingle();

    if (!broker) {
      return NextResponse.json({ success: false, message: 'Not registered as a broker' }, { status: 403 });
    }

    const body = await req.json();
    const { phone, rera_agent_number } = body;

    if (!phone || !String(phone).trim()) {
      return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });
    }

    const reraChanged = (rera_agent_number || null) !== (broker.rera_agent_number || null);

    const { error } = await supabaseAdmin
      .from('brokers')
      .update({
        phone,
        rera_agent_number: rera_agent_number || null,
        ...(reraChanged ? { rera_verified: false } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', broker.id);

    if (error) throw error;

    return NextResponse.json({ success: true, rera_reset: reraChanged });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
