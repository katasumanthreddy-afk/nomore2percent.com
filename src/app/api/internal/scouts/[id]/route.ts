import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { randomBytes } from 'crypto';
import { newExpiry } from '@/lib/scout-links';

// PATCH { action: 'revoke' | 'renew' | 'new_link' }
//  revoke   – link stops working immediately
//  renew    – link works again for another 90 days (same URL)
//  new_link – fresh URL valid for 90 days; the old URL stops working
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const { action } = await req.json();
  const update =
    action === 'revoke' ? { revoked_at: new Date().toISOString() }
    : action === 'renew' ? { revoked_at: null, expires_at: newExpiry() }
    : action === 'new_link' ? { revoked_at: null, expires_at: newExpiry(), access_token: randomBytes(16).toString('hex') }
    : null;
  if (!update) return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  const { data, error } = await supabaseInternalAdmin.from('external_scouts').update(update).eq('id', id).select().single();
  if (error || !data) return NextResponse.json({ success: false, message: error?.message || 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, scout: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabaseInternalAdmin.from('external_scouts').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
