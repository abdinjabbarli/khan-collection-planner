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

/** Pulls an OAuth error out of the callback URL (query or hash), if there is one. */
export function readCallbackError(location: Pick<Location, 'search' | 'hash'>): string | null {
  const sources = [location.search, location.hash.startsWith('#') ? location.hash.slice(1) : location.hash];
  for (const raw of sources) {
    const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
    if (params.get('error') || params.get('error_code')) {
      const code = params.get('error_code') ?? params.get('error') ?? '';
      const description = params.get('error_description') ?? '';
      if (code === 'access_denied' || /denied|cancel/i.test(description)) {
        return 'Sign-in was cancelled. You can try again whenever you like.';
      }
      return 'Google sign-in did not complete. Please try again.';
    }
  }
  return null;
}
