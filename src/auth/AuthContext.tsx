import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { callbackContext, supabase } from './supabaseClient';
import { messageForReason, reasonFromInit, stripCallbackParams } from './callback';
import type { FailureReason } from './callback';
import { fetchProfile, saveProfile, toAuthUser } from './profile';
import type { AuthUser, Profile } from './profile';

export type AuthStatus = 'unconfigured' | 'loading' | 'signedOut' | 'signedIn';
export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Sign-in / sign-out / session error, in plain language. */
  error: string | null;
  busy: 'signingIn' | 'signingOut' | null;
  profile: Profile | null;
  profileStatus: ProfileStatus;
  profileError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => void;
  updateProfile: (profile: Profile) => Promise<void>;
  dismissError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children, client = supabase }: { children: ReactNode; client?: SupabaseClient | null }) {
  const [status, setStatus] = useState<AuthStatus>(client ? 'loading' : 'unconfigured');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(callbackContext.urlReason ? messageForReason(callbackContext.urlReason) : null);
  const [busy, setBusy] = useState<AuthContextValue['busy']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileTick, setProfileTick] = useState(0);
  const userId = user?.id ?? null;
  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;

  // Restore the session on load / after the OAuth redirect, then follow auth changes.
  useEffect(() => {
    if (!client) return;
    let active = true;
    const apply = (session: { user: Parameters<typeof toAuthUser>[0] } | null) => {
      if (!active) return;
      if (session) {
        setUser(toAuthUser(session.user));
        setStatus('signedIn');
        setError(null); // a working session is never reported as a sign-in failure
      } else {
        setUser(null);
        setStatus('signedOut');
      }
    };
    (async () => {
      // supabase-js exchanges the ?code= itself (detectSessionInUrl). initialize() returns its cached result,
      // so repeated calls (StrictMode, remounts) never trigger a second exchange.
      let initError: { name?: string; status?: number } | null = null;
      try {
        initError = (await client.auth.initialize()).error;
      } catch {
        initError = { name: 'AuthRetryableFetchError' };
      }
      let session = null;
      try {
        session = (await client.auth.getSession()).data.session;
      } catch {
        initError = initError ?? { name: 'AuthRetryableFetchError' };
      }
      stripCallbackParams(); // only now that the exchange has settled
      if (!active) return;
      if (!session) {
        const reason: FailureReason | null =
          callbackContext.urlReason ?? reasonFromInit(initError, callbackContext);
        if (reason) {
          setError(messageForReason(reason));
          console.warn(`[auth] sign-in did not complete (reason: ${reason})`);
        }
      }
      apply(session);
    })();
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return; // handled by the initialization above
      apply(session);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  // Load the profile row for the signed-in user.
  useEffect(() => {
    if (!client || !userId) {
      setProfile(null);
      setProfileStatus('idle');
      setProfileError(null);
      return;
    }
    let active = true;
    setProfileStatus('loading');
    setProfileError(null);
    (async () => {
      try {
        let p = await fetchProfile(client, userId);
        if (!p) p = await saveProfile(client, userId, { displayName: userRef.current?.name ?? '', brandName: '' });
        if (!active) return;
        setProfile(p);
        setProfileStatus('ready');
      } catch {
        if (!active) return;
        setProfileStatus('error');
        setProfileError('We could not load your profile. Your planner data in this browser is not affected.');
      }
    })();
    return () => {
      active = false;
    };
  }, [client, userId, profileTick]);

  const signInWithGoogle = useCallback(async () => {
    if (!client) return;
    setError(null);
    setBusy('signingIn');
    try {
      const { error: err } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'openid email profile', // basic identity only
        },
      });
      if (err) throw err;
      // On success the browser is redirected to Google; keep the "busy" state until it leaves.
    } catch {
      setBusy(null);
      setError('We could not start Google sign-in. Please try again.');
    }
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) return;
    setError(null);
    setBusy('signingOut');
    try {
      const { error: err } = await client.auth.signOut({ scope: 'local' });
      if (err) throw err;
    } catch {
      setError('We could not sign you out cleanly. Please try again.');
    } finally {
      setBusy(null);
    }
  }, [client]);

  const updateProfile = useCallback(
    async (next: Profile) => {
      if (!client || !userRef.current) throw new Error('Not signed in');
      const saved = await saveProfile(client, userRef.current.id, next);
      setProfile(saved);
      setProfileStatus('ready');
    },
    [client],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      busy,
      profile,
      profileStatus,
      profileError,
      signInWithGoogle,
      signOut,
      reloadProfile: () => setProfileTick((n) => n + 1),
      updateProfile,
      dismissError: () => setError(null),
    }),
    [status, user, error, busy, profile, profileStatus, profileError, signInWithGoogle, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
