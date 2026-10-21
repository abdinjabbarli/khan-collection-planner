# Manual test checklist

Run this against the deployed site (or `npm run preview` locally). Tick each item. Use a fresh browser profile or clear site data between sections when noted.

## 1. First visit
- [ ] With no stored data, a "Get started" section offers two buttons: "Load demo data (clearly labelled sample content)" and "Start empty".
- [ ] A storage notice at the top says data is stored in this browser only.
- [ ] No collections or products are shown before you choose.

## 2. Collections
- [ ] Create a collection; it appears in the list and is selected.
- [ ] Empty name shows an error; a name over 40 characters is rejected; a duplicate name is rejected.
- [ ] Rename a collection; the new name shows everywhere.
- [ ] Select another collection; its details show.
- [ ] Delete shows a confirmation naming the collection and its product count; Cancel keeps it; Confirm removes it and its products.

## 3. Products
- [ ] Add a product with name, type, colour, notes and status.
- [ ] Empty name, name over 60, colour over 40, notes over 500 are rejected with a message next to the field.
- [ ] Edit a product and save; changes appear.
- [ ] Delete a product: confirmation appears; Cancel keeps it; Confirm removes it.

## 4. Moving products
- [ ] Edit a product and choose a different collection; it leaves the old collection and appears in the new one.

## 5. Status
- [ ] Change status with the quick selector on a card; it updates immediately and persists after reload.
- [ ] Each status is readable as text, not only by colour.

## 6. Filters (All products overview)
- [ ] Filter by collection, by type and by status separately.
- [ ] Combine all three; the result count and list agree.
- [ ] The status summary pills (Idea, Design, Sample, Ready) show totals across ALL products, not only the filtered ones. They do not change when you change filters; they change only when products are added, removed or have their status changed. The "Showing X of Y products" count is the one that follows the filters.
- [ ] A combination with no matches shows "No products match these filters" and a way to clear filters.

## 7. Empty states
- [ ] No collections: message prompting to create one.
- [ ] Collection with no products: message prompting to add the first one.
- [ ] No products at all: overview shows an empty message.

## 8. Demo flows
- [ ] On the first-visit screen, "Load demo data (clearly labelled sample content)" adds two labelled demo collections with products.
- [ ] Add your own collection and product, then use "Remove demo data" in the "Your data" panel: demo items disappear and your own items stay.
- [ ] After that, the "Your data" panel shows a "Load demo data" button. It appears only when no demo content is present, so demo data cannot be loaded twice from the UI. Click it: demo content comes back without changing your items, and there are no duplicate demo collections (the check is meaningful only after Remove demo data then Load demo data; if you created a collection with the same name as a demo one, it is skipped rather than duplicated).
- [ ] While demo content is present, no "Load demo data" button is shown in the "Your data" panel.
- [ ] "Start empty" on a fresh profile creates no demo content.

## 9. Reset
- [ ] "Reset all data" opens a confirmation showing counts; Cancel changes nothing.
- [ ] Confirm deletes everything and the app returns to the first-visit "Get started" screen (not an empty planner), with no collections or products shown.

## 10. Persistence after reload
- [ ] Reload the page: collections, products, statuses and the demo/own distinction are unchanged.
- [ ] Open the site in a different browser: your data is not there (expected, no sync).

## 11. Blocked storage
Browser settings for blocking storage vary by browser and version, so the warning may not appear with every method. Try one of these:
- Chromium (Chrome, Edge) DevTools: open Application > Storage and use "Clear site data" to start clean. Then block storage for the site: lock icon in the address bar > Site settings > "Cookies and site data" set to Block (wording varies), or Settings > Privacy and security > Third-party cookies / Cookies and other site data > "Block all cookies" (or add the site under "Not allowed to save data"). Reload the page.
- Alternative: Firefox and Chrome private windows usually still allow localStorage for the session, so the warning may NOT appear there. That is not a bug; use one of the other methods.
- [ ] A warning says storage is blocked and that "changes are NOT saved and may be lost when the page closes".
- [ ] The app still works in memory during the session.
- [ ] If you could not get your browser to block storage, note that this check was not performed (the behaviour is also covered by unit tests of the persistence module).
- [ ] Restore the browser setting afterwards.

## 12. Responsive check (phone width)
Use browser dev tools at about 360 to 390 px wide.
- [ ] No horizontal scrolling of the page.
- [ ] Forms, filters and buttons are usable and not cut off.
- [ ] Dialogs fit on screen.
- [ ] Also check a tablet and a desktop width.

## 13. Keyboard-only walkthrough
- [ ] Tab reaches every button, field and filter in a logical order; focus is always visible.
- [ ] Create a collection and a product using only the keyboard.
- [ ] Open a delete confirmation: focus starts on Cancel, Esc closes it, focus returns to the button that opened it.
- [ ] After confirming a delete or reset, focus lands on a heading rather than being lost.
- [ ] Change a status and a filter using only the keyboard.
- [ ] On the first Tab press after page load, a "Skip to main content" link appears; activating it moves focus to the main content.
- [ ] Activating "Clear filters" returns focus to the Collection filter.
- [ ] In the All products list, screen readers announce the Edit and Delete buttons with the collection name, for example "Edit Hoodie in Winter Drop".
