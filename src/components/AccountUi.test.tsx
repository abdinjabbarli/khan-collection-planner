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

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

function makeClient(session: unknown, row: { display_name: string; brand_name: string | null } | null = { display_name: 'Ada', brand_name: null }) {
  const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });
  const signOut = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: () => ({ select: () => Promise.resolve({ data: [{ display_name: 'x' }], error: null }) }) }));
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithOAuth,
      signOut,
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: row, error: null }) }) }),
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
afterEach(() => { act(() => root?.unmount()); host?.remove(); });

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
});
