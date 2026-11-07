import { PRIVACY_PATH } from './PrivacyPage';

/** Explains what lives in the cloud profile versus in this browser. Shown to guests and signed-in users. */
export function DataScopeNotice() {
  return (
    <section className="card stack" aria-labelledby="data-scope-title">
      <h2 id="data-scope-title">Where your information is kept</h2>
      <div className="scope-grid">
        <div className="stack">
          <h3>Account profile (cloud)</h3>
          <p>
            Only if you choose to sign in with Google: your display name and optional brand name, stored with your
            account in Supabase.
          </p>
        </div>
        <div className="stack">
          <h3>Planner data (this browser only)</h3>
          <p>
            Collections, products and saved palettes stay in this browser&rsquo;s localStorage. Signing in does not
            sync, back up or move them, and does not make them private to your account: anyone using this browser
            can see them, whether or not you are signed in. Signing out does not delete them.
          </p>
        </div>
      </div>
      <p>
        You can use the planner and Colour Studio without signing in. See the <a href={PRIVACY_PATH}>privacy notice</a>.
      </p>
    </section>
  );
}
