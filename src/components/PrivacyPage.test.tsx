import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { PrivacyPage, isPrivacyPath } from './PrivacyPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('privacy page', () => {
  it('matches /privacy with or without trailing slash only', () => {
    expect(isPrivacyPath('/privacy')).toBe(true);
    expect(isPrivacyPath('/privacy/')).toBe(true);
    expect(isPrivacyPath('/')).toBe(false);
    expect(isPrivacyPath('/privacy-policy')).toBe(false);
  });

  it('renders the notice, contact link, and accurate sign-in disclosures', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(<PrivacyPage />));
    expect(host.querySelector('h1')?.textContent).toBe('Privacy Notice');
    expect((host.querySelector('a[href^="mailto:"]') as HTMLAnchorElement).href).toBe('mailto:cabbarliabdin@gmail.com');
    expect(host.textContent).toMatch(/localStorage/);
    expect(host.textContent).toMatch(/Netlify/);
    expect(host.textContent).toMatch(/Continue with Google/);
    expect(host.textContent).toMatch(/Supabase/);
    expect(host.textContent).toMatch(/Gmail, Google Drive/);
    expect(host.textContent).toMatch(/Your planner data is not part of the profile/);
    expect(host.textContent).not.toMatch(/analytics|no user accounts|no account/i);
    act(() => root.unmount());
    host.remove();
  });
});
