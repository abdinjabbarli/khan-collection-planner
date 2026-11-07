import { useEffect } from 'react';
import { COLOR_API_DOCS } from '../domain';

export const PRIVACY_PATH = '/privacy';
export const PRIVACY_CONTACT = 'cabbarliabdin@gmail.com';
const LAST_UPDATED = '7 November 2026';

/** True for /privacy and /privacy/ (Netlify serves index.html for both). */
export function isPrivacyPath(pathname: string): boolean {
  return pathname.replace(/\/+$/, '') === PRIVACY_PATH;
}

export function PrivacyPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Privacy Notice | KHAN Collection Planner';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="container">
          <p className="app-header__wordmark">KHAN Collection Planner</p>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="container stack">
        <p>
          <a href="/">&larr; Back to the planner</a>
        </p>
        <h1>Privacy Notice</h1>
        <p>Last updated: {LAST_UPDATED}</p>
        <p>
          KHAN Collection Planner is a personal planning tool. This notice describes how the app works today. You can
          use the planner and the Colour Studio without signing in. Signing in with Google is optional and only adds a
          small cloud-saved profile.
        </p>

        <section className="stack" aria-labelledby="p-stored">
          <h2 id="p-stored">Information you enter</h2>
          <p>
            The collections, products and saved colour palettes you create are stored in your browser&rsquo;s
            localStorage on the device you are using, whether or not you are signed in. The app does not send this data
            to a server operated by us, and it is not automatically synced between devices or browsers. Because of this, data created
            in one browser is not visible in another.
          </p>
        </section>

        <section className="stack" aria-labelledby="p-signin">
          <h2 id="p-signin">Signing in with Google (optional)</h2>
          <p>
            If you choose &ldquo;Continue with Google&rdquo;, sign-in is handled by Google and by Supabase, the
            service we use for authentication and to store your profile. We ask Google only for basic identity
            information (the standard <code>openid</code>, <code>email</code> and <code>profile</code> scopes). The
            app does not request access to your Gmail, Google Drive or other Google data.
          </p>
          <p>Through that sign-in, the following information is received and held in our Supabase project:</p>
          <ul>
            <li>your Google account email address, name and profile image link, as provided by Google;</li>
            <li>
              a profile record containing the <strong>display name</strong> and optional <strong>brand name</strong> you
              enter in the app (a display name is pre-filled from your Google name when available).
            </li>
          </ul>
          <p>
            Each profile can be read and edited only by its own signed-in user. Your Google name and profile image are
            shown in the app while you are signed in. To stay signed in, Supabase also keeps a session token in this
            browser&rsquo;s storage. Google and Supabase process data under their own terms and privacy policies.
          </p>
          <p>
            <strong>Your planner data is not part of the profile.</strong> Signing in does not upload, sync, back up or
            make private your collections, products or palettes. They stay in this browser, as described below, and are
            visible to anyone who uses this browser.
          </p>
        </section>

        <section className="stack" aria-labelledby="p-colour">
          <h2 id="p-colour">Colour palette generation</h2>
          <p>
            When you generate a palette in the Colour Studio, your browser sends a request to{' '}
            <a href={COLOR_API_DOCS} rel="noopener noreferrer">
              The Color API
            </a>{' '}
            (thecolorapi.com), a third-party service. The request contains the seed colour (a HEX value) and
            the palette parameters (the palette mode and the number of colours). As with any web request, that
            service can also receive technical information such as your IP address and browser details. Your
            collection and product names, notes and other planner data are not included in this request. Its
            handling of data is governed by its own policies, not this notice.
          </p>
        </section>

        <section className="stack" aria-labelledby="p-hosting">
          <h2 id="p-hosting">Hosting</h2>
          <p>
            This site is hosted on Netlify. When you load the site, Netlify and other service providers involved
            in delivering it may process technical request information, such as your IP address, browser and
            device details, and the pages requested. If you sign in, Google and Supabase can likewise receive technical
            request information when your browser contacts them. We do not control how those providers handle this
            information; please refer to their own privacy policies.
          </p>
        </section>

        <section className="stack" aria-labelledby="p-clearing">
          <h2 id="p-clearing">Deleting your data</h2>
          <ul>
            <li>
              <strong>Remove demo data</strong> deletes only the sample content, and keeps your own items.
            </li>
            <li>
              <strong>Reset all data</strong> (after confirmation) deletes all collections, products and saved
              palettes in the app and returns it to its first-visit state. It affects only this browser and does not
              change your cloud profile or sign you out.
            </li>
            <li>
              <strong>Sign out</strong> ends your session in this browser. It does not delete your planner data or
              your cloud profile.
            </li>
            <li>
              You can also clear this site&rsquo;s data in your browser settings, which removes the stored
              planner data and sign-in session for this site in that browser. It does not delete your cloud profile.
            </li>
          </ul>
          <p>
            Planner data deleted or cleared in your browser cannot be recovered by us, because we do not hold a copy.
            Clearing browser data does not affect anything held by the third-party services described above. There is
            not yet a button to delete your cloud profile; to ask about your profile data, email the contact address
            below.
          </p>
        </section>

        <section className="stack" aria-labelledby="p-changes">
          <h2 id="p-changes">Changes to this notice</h2>
          <p>
            If the app changes, for example if more data is stored in the cloud, this notice will be updated
            to describe it before or when that change is released.
          </p>
        </section>

        <section className="stack" aria-labelledby="p-contact">
          <h2 id="p-contact">Contact</h2>
          <p>
            Questions about this notice: <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>
          </p>
        </section>
      </main>
      <footer className="app-footer container">
        <p>KHAN Collection Planner</p>
      </footer>
    </>
  );
}
