# KHAN Collection Planner

A small single-page web app for planning clothing collections and tracking product ideas from first idea to ready. It runs entirely in the browser: no account, no server, nothing is sent anywhere.

## Features

**Collections**
- Create, rename, select and delete collections.
- Deleting asks for confirmation and also removes the products in that collection.

**Products** (inside a selected collection)
- Fields: name, type, colour, design notes and status (Idea, Design, Sample, Ready).
- Add, edit and delete (delete asks for confirmation).
- Move a product to another collection from the edit form.
- Quick status change directly on each product card.

**All products overview**
- Shows products from every collection.
- Combined filters for collection, type and status.
- Shows a result count and a status summary, with a clear message when no product matches.

**Demo data**
- Optional, clearly labelled sample content (collections and products are marked "Demo").
- "Remove demo data" deletes only the sample content; your own items are kept.
- "Load demo data" can add it again at any time without touching your own items.

**Reset**
- "Reset all data" deletes everything after a confirmation dialog.

### Validation limits

| Field | Limit |
| --- | --- |
| Collection name | 40 characters |
| Product name | 60 characters |
| Colour | 40 characters |
| Design notes | 500 characters |

Product types: T-shirt, Hoodie, Sweatshirt, Jacket, Pants, Shorts, Accessory, Other (defined in `src/domain/types.ts`).

## Data and privacy

- All data is stored in this browser's `localStorage` only.
- It is not synced across devices or browsers.
- It is cleared when you clear site data for this site.
- In private browsing, or when storage is blocked, changes live only in memory and may be lost when the page closes. The app shows a notice saying so.
- There is no server and no account.

## Accessibility notes

- Everything can be used with the keyboard alone; form fields and filters have visible labels, and errors are linked to their fields.
- Confirmations (delete collection, delete product, reset) use native dialogs. Cancel receives focus first, Esc cancels, and focus returns to the control that opened the dialog.
- When an action removes the control you were using, focus moves to a sensible heading so you do not lose your place.
- Status changes, counts and saved/removed messages are announced through status regions.
- Colour is never the only status cue: every status is also shown as text.

## Tech stack

- React 18 and TypeScript
- Vite for dev server and build
- Vitest and jsdom for tests
- Plain CSS with design tokens
- Netlify for static hosting

## Project structure

```
src/domain/      data types, validation, store, filters, demo data, localStorage persistence, unit tests
src/components/  React components (collections, products, overview, data panel, dialogs, storage notice)
src/styles/      design tokens, base/layout/component CSS, CONVENTIONS.md (shared styling contract)
src/App.tsx      page composition
docs/            DEPLOY.md and TESTING.md
.claude/agents/  specialist agent definitions
netlify.toml     Netlify build and header configuration
```

## Scripts

```bash
npm install         # install dependencies
npm run dev         # start the dev server
npm run build       # type-check and create the production build in dist/
npm run preview     # serve the production build locally
npm test            # run unit tests once (vitest)
npm run typecheck   # TypeScript check only
```

Node 22 is recommended (it is what Netlify uses).

## Testing

`npm test` runs the unit tests in `src/domain/`. They cover collection and product validation, name and limit rules, create/update/delete, moving products, status changes, deleting a collection together with its products, demo data ownership (loading, removing and reloading without touching your own items), reset, filters and status counts, and persistence including storage failure states.

The user interface is not covered by automated tests. Use the manual checklist in [docs/TESTING.md](docs/TESTING.md).

## Deployment

The site is built from the repository by Netlify (`npm run build`, publish `dist`, Node 22; configured in `netlify.toml`). Step-by-step instructions for the GitHub pull request workflow and the first-time Netlify setup are in [docs/DEPLOY.md](docs/DEPLOY.md). Connecting Netlify is something only the repository owner can do.

## Milestones

- [x] **M0 - App shell**: project setup, design tokens, layout shell, storage notice, demo load/remove, confirmed reset, Netlify configuration
- [x] **M1 - Collections**: create, rename, select and delete collections with validation and persistence
- [x] **M2 - Products**: add, edit, move, change status and delete products
- [x] **M3 - Filters, demo data and empty states**: combined filters, result count, status summary, demo flows
- [ ] **M4 - Polish and QA**: documentation, responsive and accessibility pass, final checks

## Built with specialist sub-agents

The project was built with Claude Code. The main agent coordinated five specialist agents defined in [`.claude/agents/`](.claude/agents/). They worked on separate sets of files in parallel, and a read-only QA agent reviewed each milestone in a real browser.

- `data-logic`: owns `src/domain` (store, validation, filters, demo data, persistence) and its unit tests.
- `ui-builder`: owns `src/components` and `src/App.tsx` (screens and behaviour).
- `design-system`: owns `src/styles` (tokens, responsive layout, component styles).
- `qa-accessibility`: read-only reviewer for acceptance criteria, accessibility, responsiveness and build health; reports findings and does not edit source.
- `deploy-docs`: owns `netlify.toml`, this README and `docs/`.

## Known limitations

- Data lives in a single browser on a single device.
- No sync, export or import.
- No authentication or multiple users.
- `localStorage` has a size limit (typically a few MB); very large amounts of data could fail to save.
- No undo; deletes and reset are permanent after confirmation.
- Demo data is in English only.
- Tested mainly in Chromium; other browsers have not been checked thoroughly.
