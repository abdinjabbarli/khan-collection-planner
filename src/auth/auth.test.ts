import { describe, expect, it } from 'vitest';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { readSupabaseConfig } from './config';
import { reasonFromInit, reasonFromUrl } from './callback';
import { fetchProfile, greetingName, initialsOf, sanitizeAvatarUrl, saveProfile, toAuthUser, validateProfile } from './profile';

describe('config', () => {
  it('requires both values, https, and rejects secret keys', () => {
    expect(readSupabaseConfig({})).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: 'http://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_a' })).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_a' })).toBeNull();
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co/', VITE_SUPABASE_PUBLISHABLE_KEY: ' sb_publishable_a ' })).toEqual({
      url: 'https://x.supabase.co',
      publishableKey: 'sb_publishable_a',
    });
  });
});

describe('callback diagnostics', () => {
  it('maps URL errors to allow-listed reasons', () => {
    expect(reasonFromUrl({ search: '', hash: '' })).toBeNull();
    expect(reasonFromUrl({ search: '?error=access_denied&error_description=User+denied', hash: '' })).toBe('cancelled');
    expect(reasonFromUrl({ search: '?error=server_error&error_code=unexpected_failure', hash: '' })).toBe('provider');
    expect(reasonFromUrl({ search: '', hash: '#error=weird&error_code=x' })).toBe('unknown');
  });
  it('classifies init failures without needing codes or tokens', () => {
    const c = { hadCode: true, hadVerifier: true };
    expect(reasonFromInit({ name: 'AuthPKCECodeVerifierMissingError' }, c)).toBe('verifier_missing');
    expect(reasonFromInit({ name: 'AuthRetryableFetchError', status: 0 }, c)).toBe('network');
    expect(reasonFromInit({ name: 'AuthApiError', status: 400 }, c)).toBe('invalid_code');
    expect(reasonFromInit({ name: 'AuthApiError', status: 500 }, c)).toBe('provider');
    expect(reasonFromInit(null, { hadCode: true, hadVerifier: false })).toBe('verifier_missing');
    expect(reasonFromInit(null, { hadCode: true, hadVerifier: true })).toBe('unknown');
    expect(reasonFromInit(null, { hadCode: false, hadVerifier: false })).toBeNull();
  });
});

describe('profile helpers', () => {
  it('only accepts https Google avatar hosts', () => {
    expect(sanitizeAvatarUrl('https://lh3.googleusercontent.com/a/abc=s96-c')).toContain('lh3.googleusercontent.com');
    expect(sanitizeAvatarUrl('http://lh3.googleusercontent.com/a')).toBeNull();
    expect(sanitizeAvatarUrl('https://evil.example/googleusercontent.com')).toBeNull();
    expect(sanitizeAvatarUrl('https://googleusercontent.com.evil.example/a')).toBeNull();
    expect(sanitizeAvatarUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeAvatarUrl(42)).toBeNull();
  });
  it('derives a safe user and greeting', () => {
    const u = toAuthUser({ id: '1', email: 'a@b.c', user_metadata: { full_name: ' Ada Lovelace ', picture: 'https://x.googleusercontent.com/p' } } as unknown as User);
    expect(u).toMatchObject({ id: '1', name: 'Ada Lovelace', avatarUrl: 'https://x.googleusercontent.com/p' });
    expect(greetingName(u, { displayName: 'Ada L', brandName: '' })).toBe('Ada L');
    expect(greetingName(u, null)).toBe('Ada Lovelace');
    const bare = toAuthUser({ id: '2', email: null, user_metadata: {} } as unknown as User);
    expect(greetingName(bare, null)).toBe('there');
    expect(bare.avatarUrl).toBeNull();
    expect(initialsOf('Ada Lovelace')).toBe('AL');
    expect(initialsOf('   ')).toBe('?');
  });
  it('validates profile fields', () => {
    expect(validateProfile({ displayName: '  ', brandName: '' })).toMatchObject({ ok: false });
    expect(validateProfile({ displayName: 'x'.repeat(61), brandName: '' })).toMatchObject({ ok: false });
    expect(validateProfile({ displayName: 'A', brandName: 'y'.repeat(61) })).toMatchObject({ ok: false });
    expect(validateProfile({ displayName: ' A ', brandName: ' Khan ' })).toEqual({ ok: true, value: { displayName: 'A', brandName: 'Khan' } });
  });
});

/** Minimal chainable fake of the PostgREST calls the app makes. */
function fakeClient(opts: { rows: unknown[]; insertError?: { code: string; message: string } }) {
  const calls: { op: string; payload?: unknown }[] = [];
  const builder = (op: string, payload?: unknown) => {
    calls.push({ op, payload });
    const result = op === 'update' ? { data: opts.rows, error: null } : op === 'insert' ? { data: null, error: opts.insertError ?? null } : { data: opts.rows[0] ?? null, error: null };
    const b: Record<string, unknown> = {
      eq: () => b,
      select: () => b,
      maybeSingle: () => Promise.resolve(result),
      then: (res: (v: unknown) => unknown) => Promise.resolve(result).then(res),
    };
    return b;
  };
  const client = {
    from: () => ({
      select: () => builder('select'),
      update: (p: unknown) => builder('update', p),
      insert: (p: unknown) => builder('insert', p),
    }),
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe('profile persistence', () => {
  it('reads null when no row exists', async () => {
    expect(await fetchProfile(fakeClient({ rows: [] }).client, 'u1')).toBeNull();
  });
  it('updates without ever sending id; inserts only when no row was updated', async () => {
    const a = fakeClient({ rows: [{ display_name: 'A', brand_name: null }] });
    await saveProfile(a.client, 'u1', { displayName: 'A', brandName: '' });
    expect(a.calls.map((c) => c.op)).toEqual(['update']);
    expect(a.calls[0].payload).toEqual({ display_name: 'A', brand_name: null });
    const b = fakeClient({ rows: [] });
    await saveProfile(b.client, 'u1', { displayName: 'A', brandName: 'K' });
    expect(b.calls.map((c) => c.op)).toEqual(['update', 'insert']);
    expect(b.calls[1].payload).toEqual({ id: 'u1', display_name: 'A', brand_name: 'K' });
  });
  it('surfaces insert failures', async () => {
    const c = fakeClient({ rows: [], insertError: { code: '42501', message: 'denied' } });
    await expect(saveProfile(c.client, 'u1', { displayName: 'A', brandName: '' })).rejects.toThrow('denied');
  });
});
