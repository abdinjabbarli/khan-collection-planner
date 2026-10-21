# Manual test checklist

Run this against the deployed site (or `npm run preview` locally). Tick each item. Use a fresh browser profile or clear site data between sections when noted.

## 1. First visit
- [ ] With no stored data, a "Get started" section offers "Load demo data" and "Start empty".
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
- [ ] The status summary matches the products shown.
- [ ] A combination with no matches shows "No products match these filters" and a way to clear filters.

## 7. Empty states
- [ ] No collections: message prompting to create one.
- [ ] Collection with no products: message prompting to add the first one.
- [ ] No products at all: overview shows an empty message.

## 8. Demo flows
- [ ] "Load demo data" adds two labelled demo collections with products.
- [ ] Add your own collection and product, then "Remove demo data": demo items disappear and your own items stay.
- [ ] "Load demo data" again adds demo content back without changing your items or duplicating existing demo collections.
- [ ] "Start empty" on a fresh profile creates no demo content.

## 9. Reset
- [ ] "Reset all data" opens a confirmation showing counts; Cancel changes nothing.
- [ ] Confirm deletes everything and the app returns to a clean state.

## 10. Persistence after reload
- [ ] Reload the page: collections, products, statuses and the demo/own distinction are unchanged.
- [ ] Open the site in a different browser: your data is not there (expected, no sync).

## 11. Blocked storage
How to simulate:
- Chromium: Settings > Privacy and security > Cookies and other site data > "Block all cookies" (or add the site to "Not allowed to save data"), then reload.
- Or use a private window with third-party/all storage blocked.
- [ ] A warning says storage is blocked and changes may be lost when the page closes.
- [ ] The app still works in memory during the session.
- [ ] Restore the setting afterwards.

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
