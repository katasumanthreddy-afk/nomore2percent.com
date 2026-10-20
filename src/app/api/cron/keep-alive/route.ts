import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabaseInternalAdmin } from '@/lib/supabase-internal-admin';

// GET /api/cron/keep-alive — run daily by Vercel Cron (see vercel.json).
//
// Supabase's free tier pauses a project after about 7 days without
// activity, which is what took the internal portal's login down before.
// One tiny read against each project every day counts as activity.
//
// When CRON_SECRET is set in Vercel, Vercel sends it as a Bearer token and
// anything else is refused.
export const dynamic = 'force-dynamic';

async function ping(name: string, run: () => PromiseLike<{ error: { message: string } | null }>) {
  const started = Date.now();
  try {
    const { error } = await run();
    return { name, ok: !error, ms: Date.now() - started, error: error?.message };
  } catch (e) {
    return { name, ok: false, ms: Date.now() - started, error: e instanceof Error ? e.message : 'unknown error' };
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const results = await Promise.all([
    ping('public', () => supabaseAdmin.from('properties').select('id', { head: true, count: 'exact' }).limit(1)),
    ping('internal', () => supabaseInternalAdmin.from('team_members').select('id', { head: true, count: 'exact' }).limit(1)),
  ]);

  const ok = results.every((r) => r.ok);
  if (!ok) console.error('keep-alive: a Supabase project did not answer', results);
  return NextResponse.json({ ok, at: new Date().toISOString(), results }, { status: ok ? 200 : 503 });
}
