// pg ≥ 8.13 deprecates the `sslmode=prefer|require|verify-ca` aliases for
// `verify-full`. They keep working today but emit a security warning, and
// pg v9 will adopt looser libpq semantics. Rewrite to explicit `verify-full`
// so the warning goes away and behavior is locked in.
//
// Neon / Supabase / Vercel Postgres ship trusted certs, so `verify-full` is
// the right default. Self-signed setups should use `?uselibpqcompat=true`.
export function normalizeDatabaseUrl(url: string): string {
  const u = new URL(url);
  u.searchParams.set('sslmode', 'verify-full');
  return u.toString();
}
