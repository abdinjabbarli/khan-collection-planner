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
          KHAN Collection Planner is a personal planning tool. This notice describes how the app works today.
          It currently has no user accounts and no sign-in.
        </p>

        <section className="stack" aria-labelledby="p-stored">
          <h2 id="p-stored">Information you enter</h2>
          <p>
            The collections, products and saved colour palettes you create are stored in your browser&rsquo;s
            localStorage on the device you are using. The app does not send this data to a server operated by
            us, and it is not automatically synced between devices or browsers. Because of this, data created
            in one browser is not visible in another.
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
            device details, and the pages requested. We do not control how those providers handle this
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
              palettes in the app and returns it to its first-visit state. It affects only this browser.
            </li>
            <li>
              You can also clear this site&rsquo;s data in your browser settings, which removes the stored
              planner data for this site in that browser.
            </li>
          </ul>
          <p>
            Deleted or cleared data cannot be recovered by us, because we do not hold a copy. Clearing browser
            data does not affect anything held by the third-party services described above.
          </p>
        </section>

        <section className="stack" aria-labelledby="p-changes">
          <h2 id="p-changes">Changes to this notice</h2>
          <p>
            If the app changes, for example if sign-in or cloud storage is added, this notice will be updated
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
