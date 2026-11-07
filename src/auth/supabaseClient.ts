import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readSupabaseConfig } from './config';
import { reasonFromUrl } from './callback';
import type { FailureReason } from './callback';

/**
 * What the page looked like when it loaded, captured BEFORE supabase-js starts and rewrites the URL.
 * Contains only booleans and an allow-listed reason, never the code itself.
 */
function captureCallbackContext(): { urlReason: FailureReason | null; hadCode: boolean; hadVerifier: boolean } {
  if (typeof window === 'undefined') return { urlReason: null, hadCode: false, hadVerifier: false };
  let hadVerifier = false;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      if (window.localStorage.key(i)?.includes('-code-verifier')) hadVerifier = true;
    }
  } catch {
    /* storage blocked */
  }
  return {
    urlReason: reasonFromUrl(window.location),
    hadCode: new URLSearchParams(window.location.search).has('code'),
    hadVerifier,
  };
}

export const callbackContext = captureCallbackContext();

const config = readSupabaseConfig(import.meta.env);

/**
 * The one and only Supabase client (module singleton). null when VITE_SUPABASE_URL /
 * VITE_SUPABASE_PUBLISHABLE_KEY are not set: the app then runs as guest-only.
 * detectSessionInUrl makes supabase-js exchange the PKCE ?code= once during initialization.
 */
export const supabase: SupabaseClient | null = config
  ? createClient(config.url, config.publishableKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
