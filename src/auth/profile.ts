import type { SupabaseClient, User } from '@supabase/supabase-js';

export const PROFILE_LIMITS = { displayName: 60, brandName: 60 } as const;

export interface Profile {
  displayName: string;
  brandName: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  /** Name supplied by Google, or null. */
  name: string | null;
  /** Only ever an https Google-hosted image URL, otherwise null. */
  avatarUrl: string | null;
}

/** Accepts only https images served from Google's avatar hosts (matches the CSP img-src). */
export function sanitizeAvatarUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return null;
    if (u.hostname !== 'googleusercontent.com' && !u.hostname.endsWith('.googleusercontent.com')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

const clean = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 100) : null);

export function toAuthUser(user: User): AuthUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? null,
    name: clean(meta.full_name) ?? clean(meta.name),
    avatarUrl: sanitizeAvatarUrl(meta.avatar_url) ?? sanitizeAvatarUrl(meta.picture),
  };
}

/** Name used in the greeting: saved display name, then Google name, then a neutral fallback. */
export function greetingName(user: AuthUser, profile: Profile | null): string {
  return clean(profile?.displayName) ?? user.name ?? 'there';
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = Array.from(parts[0])[0] ?? '?';
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export type ProfileErrors = { displayName?: string; brandName?: string };
export type ProfileValidation = { ok: true; value: Profile } | { ok: false; errors: ProfileErrors };

export function validateProfile(input: Profile): ProfileValidation {
  const displayName = input.displayName.trim();
  const brandName = input.brandName.trim();
  const errors: ProfileErrors = {};
  if (!displayName) errors.displayName = 'Enter a display name.';
  else if (displayName.length > PROFILE_LIMITS.displayName)
    errors.displayName = `Display name can be at most ${PROFILE_LIMITS.displayName} characters.`;
  if (brandName.length > PROFILE_LIMITS.brandName)
    errors.brandName = `Brand name can be at most ${PROFILE_LIMITS.brandName} characters.`;
  if (errors.displayName || errors.brandName) return { ok: false, errors };
  return { ok: true, value: { displayName, brandName } };
}

type Row = { display_name: string | null; brand_name: string | null };
const fromRow = (r: Row): Profile => ({ displayName: r.display_name ?? '', brandName: r.brand_name ?? '' });

/** Loads the signed-in user's profile row; null if none exists yet. Throws on failure. */
export async function fetchProfile(client: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await client
    .from('profiles')
    .select('display_name, brand_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data as Row) : null;
}

/** Updates the user's own row, creating it if it does not exist yet. Ownership (id) is never updated. */
export async function saveProfile(client: SupabaseClient, userId: string, profile: Profile): Promise<Profile> {
  const values = { display_name: profile.displayName, brand_name: profile.brandName || null };
  const update = () => client.from('profiles').update(values).eq('id', userId).select('display_name, brand_name');

  let res = await update();
  if (res.error) throw new Error(res.error.message);
  if (!res.data || res.data.length === 0) {
    const ins = await client.from('profiles').insert({ id: userId, ...values });
    if (ins.error) {
      if (ins.error.code !== '23505') throw new Error(ins.error.message);
      res = await update(); // created concurrently (e.g. by the signup trigger)
      if (res.error) throw new Error(res.error.message);
    }
  }
  return { displayName: profile.displayName, brandName: profile.brandName };
}
