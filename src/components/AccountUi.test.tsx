// SIMULATED AUTH: a fake Supabase client; no network and no real Google OAuth.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/AuthContext';
import { AccountBar } from './AccountBar';
import { ProfileSection } from './ProfileSection';
import { DataScopeNotice } from './DataScopeNotice';

const ctx = vi.hoisted(() => ({ urlReason: null as string | null, hadCode: false, hadVerifier: true }));
vi.mock('../auth/supabaseClient', () => ({ supabase: null, callbackContext: ctx }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

function makeClient(
  session: unknown,
  row: { display_name: string; brand_name: string | null } | null = { display_name: 'Ada', brand_name: null },
  opts: { initError?: unknown; profileError?: boolean } = {},
) {
  const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
  const signOut = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: () => ({ select: () => Promise.resolve({ data: [{ display_name: 'x' }], error: null }) }) }));
  const client = {
    auth: {
      initialize: vi.fn().mockResolvedValue({ error: opts.initError ?? null }),
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithOAuth,
      signOut,
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(opts.profileError ? { data: null, error: { message: 'relation "profiles" does not exist' } } : { data: row, error: null }) }) }),
      update,
    }),
  } as unknown as SupabaseClient;
  return { client, signInWithOAuth, signOut, update };
}

let root: Root | undefined;
let host: HTMLDivElement | undefined;
function mount(client: SupabaseClient | null) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(<AuthProvider client={client}><AccountBar /><ProfileSection /><DataScopeNotice /></AuthProvider>));
  return host;
}
afterEach(() => {
  ctx.urlReason = null; ctx.hadCode = false; ctx.hadVerifier = true; window.history.replaceState(null, '', '/'); act(() => root?.unmount()); host?.remove(); });

const session = { user: { id: 'u1', email: 'ada@example.com', user_metadata: { full_name: 'Ada Lovelace', avatar_url: 'https://lh3.googleusercontent.com/a/x' } } };

describe('account UI (simulated auth)', () => {
  it('guest: shows Continue with Google, and requests identity-only scopes with a same-origin redirect', async () => {
    const { client, signInWithOAuth } = makeClient(null);
    const el = mount(client);
    await flush();
    const btn = [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Continue with Google'))!;
    expect(btn).toBeTruthy();
    expect(el.textContent).not.toMatch(/Profile\s*Signed in/);
    await act(async () => btn.click());
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/`, scopes: 'openid email profile' },
    });
  });

  it('signed in: greeting, avatar, profile form, sign out (local scope)', async () => {
    const { client, signOut } = makeClient(session);
    const el = mount(client);
    await flush();
    expect(el.textContent).toContain('Hello, Ada');
    expect(el.querySelector('img.avatar')?.getAttribute('src')).toContain('googleusercontent.com');
    expect((el.querySelector('#profile-display-name') as HTMLInputElement).value).toBe('Ada');
    expect(el.textContent).toContain('ada@example.com');
    await act(async () => [...el.querySelectorAll('button')].find((b) => b.textContent === 'Sign out')!.click());
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('validates the display name before saving', async () => {
    const { client, update } = makeClient(session);
    const el = mount(client);
    await flush();
    const input = el.querySelector('#profile-display-name') as HTMLInputElement;
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      set.call(input, '   ');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => (el.querySelector('form') as HTMLFormElement).requestSubmit());
    expect(el.textContent).toContain('Enter a display name.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(update).not.toHaveBeenCalled();
  });

  it('unconfigured: app still renders, no sign-in button, scope explainer present', async () => {
    const el = mount(null);
    await flush();
    expect(el.textContent).toContain('Sign-in is not available');
    expect(el.textContent).not.toContain('Continue with Google');
    expect(el.textContent).toMatch(/does not\s+sync, back up or move them/);
  });

  // Regression: a ?code= return whose exchange succeeded (or whose profile call fails) must never be
  // reported as "Google sign-in did not complete".
  it('callback with ?code= and a valid session: signed in, no failure message, URL cleaned', async () => {
    ctx.hadCode = true;
    window.history.replaceState(null, '', '/?code=SECRET123&sb_flow_id=abc');
    const { client } = makeClient(session);
    const el = mount(client);
    await flush();
    expect(el.textContent).toContain('Hello, Ada');
    expect(el.textContent).not.toContain('did not complete');
    expect(window.location.search).toBe('');
  });

  it('profile fetch failure is reported as a profile problem, not a sign-in failure', async () => {
    ctx.hadCode = true;
    const { client } = makeClient(session, null, { profileError: true });
    const el = mount(client);
    await flush();
    expect(el.textContent).toContain('Hello, Ada Lovelace');
    expect(el.textContent).toContain('We could not load your profile');
    expect(el.textContent).not.toContain('did not complete');
    expect(el.textContent).not.toContain('relation');
  });

  it('exchange failure shows a sanitized, specific message and never echoes the code', async () => {
    ctx.hadCode = true;
    window.history.replaceState(null, '', '/?code=SECRET123');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { client } = makeClient(null, null, { initError: { name: 'AuthApiError', status: 400, message: 'flow state SECRET123 not found' } });
    const el = mount(client);
    await flush();
    expect(el.textContent).toContain('already been used or has expired');
    expect(el.textContent).not.toContain('SECRET123');
    expect(el.textContent).toContain('Continue with Google');
    expect(window.location.search).toBe('');
    expect(warn.mock.calls.flat().join(' ')).toBe('[auth] sign-in did not complete (reason: invalid_code)');
    warn.mockRestore();
  });

  it('?code= with no stored PKCE verifier explains the browser mismatch', async () => {
    ctx.hadCode = true;
    ctx.hadVerifier = false;
    const { client } = makeClient(null);
    const el = mount(client);
    await flush();
    expect(el.textContent).toContain('could not be matched to this browser');
  });

  it('initialize() is awaited once per mount and the app never exchanges the code itself', async () => {
    const { client } = makeClient(session);
    mount(client);
    await flush();
    expect((client.auth.initialize as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    expect((client.auth as unknown as Record<string, unknown>).exchangeCodeForSession).toBeUndefined();
  });
});
