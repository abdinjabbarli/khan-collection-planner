/**
 * OAuth callback diagnostics. Callback strategy (single, library-driven):
 *   supabase-js is created with flowType 'pkce' + detectSessionInUrl: true, so it exchanges the ?code=
 *   exactly once during client initialization. The app NEVER calls exchangeCodeForSession itself; it only
 *   awaits `auth.initialize()` (which returns the same cached promise every time) and then reads the session.
 *
 * Everything here is sanitized: user-facing text and logs contain only an allow-listed reason, never the
 * code, tokens, URLs, error descriptions or personal data.
 */
export type FailureReason = 'cancelled' | 'provider' | 'verifier_missing' | 'invalid_code' | 'network' | 'unknown';

const MESSAGES: Record<FailureReason, string> = {
  cancelled: 'Sign-in was cancelled. You can try again whenever you like.',
  provider: 'Google or the sign-in service reported a problem. Please try again in a moment.',
  verifier_missing:
    'This sign-in attempt could not be matched to this browser. Please start again with “Continue with Google” in the same browser window.',
  invalid_code: 'That sign-in attempt had already been used or has expired. Please try again.',
  network: 'We could not reach the sign-in service to finish signing you in. Check your connection and try again.',
  unknown: 'Google sign-in did not complete. Please try again.',
};

export const messageForReason = (reason: FailureReason): string => MESSAGES[reason];

/** Reads an OAuth error from the callback URL (query or hash) and maps it to an allow-listed reason. */
export function reasonFromUrl(location: Pick<Location, 'search' | 'hash'>): FailureReason | null {
  const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  for (const raw of [location.search, hash]) {
    const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw);
    const code = params.get('error') ?? params.get('error_code');
    if (!code && !params.get('error_code')) continue;
    const description = params.get('error_description') ?? '';
    if (code === 'access_denied' || /denied|cancel/i.test(description)) return 'cancelled';
    if (/^(server_error|temporarily_unavailable|unexpected_failure)$/.test(params.get('error') ?? '') ||
        /^(unexpected_failure|provider_|oauth_)/.test(params.get('error_code') ?? '')) return 'provider';
    return 'unknown';
  }
  return null;
}

export interface InitErrorLike {
  name?: string;
  status?: number;
}

/** Maps the error returned by `auth.initialize()` (or a missing session after a ?code= return) to a reason. */
export function reasonFromInit(
  error: InitErrorLike | null | undefined,
  ctx: { hadCode: boolean; hadVerifier: boolean },
): FailureReason | null {
  if (error) {
    if (error.name === 'AuthPKCECodeVerifierMissingError') return 'verifier_missing';
    if (error.name === 'AuthRetryableFetchError' || error.status === 0) return 'network';
    if (error.name === 'AuthPKCEGrantCodeExchangeError' || (typeof error.status === 'number' && error.status >= 400 && error.status < 500))
      return 'invalid_code';
    if (typeof error.status === 'number' && error.status >= 500) return 'provider';
    return 'unknown';
  }
  // No error and no session although we came back with ?code=: supabase-js skips the exchange
  // when the PKCE verifier saved before the redirect is not in this browser's storage.
  if (ctx.hadCode) return ctx.hadVerifier ? 'unknown' : 'verifier_missing';
  return null;
}

const CALLBACK_PARAMS = ['code', 'sb_flow_id', 'error', 'error_code', 'error_description'];

/** Removes callback parameters from the address bar. Only call after initialization has settled. */
export function stripCallbackParams(loc: Location = window.location): void {
  const url = new URL(loc.href);
  let changed = false;
  for (const p of CALLBACK_PARAMS) {
    if (url.searchParams.has(p)) {
      url.searchParams.delete(p);
      changed = true;
    }
  }
  if (/(^|[#&])(error|error_code|error_description|access_token|refresh_token)=/.test(url.hash)) {
    url.hash = '';
    changed = true;
  }
  if (changed) window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}
