import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

// For route handlers: returns a 401 response when the caller is not the
// admin, or null when they are. Usage:
//   const denied = await requireAdmin(); if (denied) return denied;
export async function requireAdmin(): Promise<NextResponse | null> {
  const store = await cookies();
  const ok = await verifyAdminSessionToken(store.get(ADMIN_COOKIE)?.value);
  if (ok) return null;
  return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
}
