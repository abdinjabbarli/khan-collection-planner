# Colour Studio: feature plan and acceptance criteria

Adds a "Colour Studio" to the KHAN Collection Planner. Users pick a seed colour, generate a five-colour
palette from [The Color API](https://www.thecolorapi.com/docs) (`GET /scheme`), save it to a collection and
optionally apply one palette colour to a product in that collection.

## API facts (from the official docs)

- `GET https://www.thecolorapi.com/scheme?hex=0047AB&mode=analogic&count=5&format=json`
- No key, account or payment is documented. The docs say nothing about CORS, so browser access must be
  verified live (see `docs/COLOUR_STUDIO_VERIFICATION.md` and `scripts/verify-color-api.mjs`).
- Response: `{ mode, count, colors: [{ hex: { value, clean }, name: { value }, ... }], seed, _links }`.
  Errors: HTTP 400 with `{ code, message }`.
- Only `monochrome`, `analogic` and `complement` are offered.

## Design

- `src/domain/colorApi.ts`: pure logic. HEX validation, URL building, response validation, and
  `fetchPalette` (injectable `fetch`, 10 s timeout, caller-supplied abort signal). Typed failure kinds:
  `timeout`, `network`, `api` (non-2xx), `invalid-response`, `aborted`. There is no fallback palette.
- Storage stays at key `khan-planner:v1`, `version: 1`. `AppData` gains an optional-on-read
  `palettes: SavedPalette[]` (one per collection). Old data without the field loads as `palettes: []`.
  Invalid palette entries are dropped individually and never discard collections or products.
- Store: `savePalette`, `applyPaletteColour`. `deleteCollection`, `resetAll` and `clearDemoData` keep
  palettes consistent. Saving a palette adopts a demo collection (like rename) so "Remove demo data"
  cannot delete a collection holding the user's palette.
- UI: `ColourStudio` panel (after Collections), `SavedPalette` block in the collection details.
  Stale responses are discarded with a request counter plus `AbortController`.

## Acceptance criteria

1. Seed colour via `<input type="color">` and a text input accepting exactly six HEX digits (optional `#`),
   with an inline error and no request when invalid.
2. Three modes (monochrome, analogic, complement), each with a plain-language explanation.
3. Clicking "Generate palette" is the only thing that calls the API (never on input change); requests ask for `count=5`.
4. Five CSS swatches with name and HEX (no external images).
5. Save to a chosen collection; replacing an existing palette needs confirmation.
6. The saved palette appears in that collection's details.
7. "Apply" on a saved colour writes `Name #HEX` (name shortened to fit 40 characters, HEX kept) to one chosen
   product, after confirmation if the product already has a colour. Nothing is ever applied automatically.
8. Saved palettes survive refresh and render without any API request.
9. Loading, success, validation, timeout and API-error states; retry for failures; stale responses ignored.
10. No mock or local fallback palette when the API fails.
11. "Powered by The Color API" with a docs link; note that results are digital suggestions, not fabric/print matches.
12. Existing collections/products load unchanged; deleting a collection removes its palette; reset removes all palettes.
13. Keyboard operable, English only, responsive, existing KHAN palette, storage notice unchanged.
