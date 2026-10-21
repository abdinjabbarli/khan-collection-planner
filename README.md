# KHAN Collection Planner

A small single-page web app for planning clothing collections and tracking product ideas from first idea to ready. It runs entirely in the browser.

## Features

Planned by milestone. Only the shell is done so far.

- [x] **M0 - App shell**: project setup, design tokens, layout shell, storage notice, demo load/remove, confirmed reset, and Netlify configuration
- [x] **M1 - Collections**: create, rename, select and delete collections (deleting asks for confirmation and removes the collection's products), with validation and localStorage persistence
- [ ] **M2 - Products**: add and edit product ideas (name, type, colour, design notes, status), delete with confirmation
- [ ] **M3 - Filters, demo data and empty states**: filter by collection, type and status
- [ ] **M4 - Polish and QA**: responsive and accessibility pass, final checks

## Tech stack

- React 18 and TypeScript
- Vite for dev server and build
- Vitest and jsdom for tests
- Netlify for static hosting (see [docs/DEPLOY.md](docs/DEPLOY.md))

## Local development

```bash
npm install     # install dependencies
npm run dev     # start the dev server
npm test        # run the tests
npm run build   # type-check and create the production build in dist/
```

Node 22 is recommended (it is what Netlify uses).

## Data and privacy

- All data is stored in this browser's `localStorage`.
- It is not synced across devices or browsers.
- There is no server and no account; nothing is sent anywhere.
- Clearing site data for this site erases your data.
- Private browsing may block or discard storage, so data may not be saved there.

## Project agents

Specialist agent definitions live in [`.claude/agents/`](.claude/agents/):

- `data-logic`
- `ui-builder`
- `design-system`
- `qa-accessibility`
- `deploy-docs`

The main agent coordinates these specialists.
