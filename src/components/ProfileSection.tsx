import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { PROFILE_LIMITS, validateProfile } from '../auth/profile';
import type { ProfileErrors } from '../auth/profile';

export function ProfileSection() {
  const { status, user, profile, profileStatus, profileError, reloadProfile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const loadedFor = useRef<string | null>(null);

  // Fill the form from the stored profile once per sign-in (not on every save).
  useEffect(() => {
    if (profile && user && loadedFor.current !== user.id) {
      loadedFor.current = user.id;
      setDisplayName(profile.displayName || user.name || '');
      setBrandName(profile.brandName);
    }
    if (!user) loadedFor.current = null;
  }, [profile, user]);

  if (status !== 'signedIn' || !user) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSaveError('');
    const result = validateProfile({ displayName, brandName });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await updateProfile(result.value);
      setDisplayName(result.value.displayName);
      setBrandName(result.value.brandName);
      setMessage('Profile saved to your account.');
    } catch {
      setSaveError('We could not save your profile. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card stack" aria-labelledby="profile-title">
      <h2 id="profile-title">Profile</h2>
      <p>
        Signed in{user.email ? <> as <strong>{user.email}</strong></> : null}. These two details are saved to your
        account in the cloud (Supabase), not in this browser.
      </p>

      {profileStatus === 'loading' && <p role="status">Loading your profile&hellip;</p>}
      {profileStatus === 'error' && (
        <div className="stack">
          <p role="alert" className="field__error">{profileError}</p>
          <button type="button" className="btn btn--secondary" onClick={reloadProfile}>
            Try again
          </button>
        </div>
      )}

      {profileStatus === 'ready' && (
        <form className="stack" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="profile-display-name">Display name</label>
            <input
              id="profile-display-name"
              className="field__control"
              type="text"
              value={displayName}
              maxLength={PROFILE_LIMITS.displayName + 20}
              autoComplete="nickname"
              aria-invalid={errors.displayName ? 'true' : undefined}
              aria-describedby={errors.displayName ? 'profile-display-name-error' : undefined}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            {errors.displayName && (
              <p id="profile-display-name-error" className="field__error">{errors.displayName}</p>
            )}
          </div>
          <div className="field">
            <label className="field__label" htmlFor="profile-brand-name">Brand name (optional)</label>
            <input
              id="profile-brand-name"
              className="field__control"
              type="text"
              value={brandName}
              maxLength={PROFILE_LIMITS.brandName + 20}
              autoComplete="organization"
              aria-invalid={errors.brandName ? 'true' : undefined}
              aria-describedby={errors.brandName ? 'profile-brand-name-error' : undefined}
              onChange={(e) => setBrandName(e.target.value)}
            />
            {errors.brandName && <p id="profile-brand-name-error" className="field__error">{errors.brandName}</p>}
          </div>
          <div className="cluster">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
          <p role="status">{message}</p>
          {saveError && <p role="alert" className="field__error">{saveError}</p>}
        </form>
      )}
    </section>
  );
}
