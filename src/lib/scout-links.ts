// Scout links: an unguessable token is the only access control for external
// scouts, so each link also has an expiry date and can be revoked.

export const SCOUT_LINK_DAYS = 90;

export function scoutLinkState(s: { expires_at?: string | null; revoked_at?: string | null }, now = Date.now()) {
  if (s.revoked_at) return 'revoked' as const;
  if (s.expires_at && Date.parse(s.expires_at) < now) return 'expired' as const;
  return 'active' as const;
}

export function newExpiry(days = SCOUT_LINK_DAYS) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}
