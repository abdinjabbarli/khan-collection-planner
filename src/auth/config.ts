export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

/** Reads the public Vite variables. Returns null when sign-in is not configured. */
export function readSupabaseConfig(env: Record<string, unknown>): SupabaseConfig | null {
  const url = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : '';
  const publishableKey =
    typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string' ? env.VITE_SUPABASE_PUBLISHABLE_KEY.trim() : '';
  if (!url || !publishableKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') return null;
  } catch {
    return null;
  }
  // Defence in depth: never accept a secret key in the browser bundle.
  if (publishableKey.startsWith('sb_secret_')) return null;
  return { url: url.replace(/\/+$/, ''), publishableKey };
}
