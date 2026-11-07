import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readCallbackError, readSupabaseConfig } from './config';

// Captured at import time, before supabase-js processes (and cleans) the callback URL.
export const initialCallbackError: string | null =
  typeof window === 'undefined' ? null : readCallbackError(window.location);

/** True when the page was opened with an OAuth ?code= (PKCE callback), before supabase-js strips it. */
export const hadAuthCode: boolean =
  typeof window === 'undefined' ? false : new URLSearchParams(window.location.search).has('code');

const config = readSupabaseConfig(import.meta.env);

/** null when VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not set: the app then runs as guest-only. */
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
