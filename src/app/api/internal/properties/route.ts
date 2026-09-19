import { NextRequest, NextResponse } from 'next/server';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';
import { getRequestingTeamMember } from '@/lib/get-internal-team-member';
import { getCached, invalidateCache } from '@/lib/simple-cache';

export async function GET() {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  // 30s cache: several people browsing Properties/Requirements/Matches at
  // once previously meant each of them triggered this same query
  // independently. This lets concurrent requests within the window share
  // one result instead.
  const properties = await getCached('internal:properties', 30_000, async () => {
    const { data, error } = await supabaseInternalAdmin
      .from('commercial_properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  });

  return NextResponse.json({ success: true, properties });
}

export async function POST(req: NextRequest) {
  const member = await getRequestingTeamMember();
  if (!member || member.status !== 'active') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  const body = await req.json();
  if (!body.title) {
    return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
  }

  const { data, error } = await supabaseInternalAdmin
    .from('commercial_properties')
    .insert([{ ...body, created_by: member.id }])
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  // The person who just added this should see it immediately, not wait out
  // the cache window.
  invalidateCache('internal:properties');
  invalidateCache('internal:requirements:matches');

  return NextResponse.json({ success: true, property: data });
}
