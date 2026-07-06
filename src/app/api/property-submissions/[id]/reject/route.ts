import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/property-submissions/[id]/reject — admin only.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { admin_notes } = await req.json().catch(() => ({ admin_notes: null }));

    const { error } = await supabaseAdmin
      .from('property_submissions')
      .update({ status: 'rejected', admin_notes: admin_notes || null, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Something went wrong' }, { status: 500 });
  }
}
