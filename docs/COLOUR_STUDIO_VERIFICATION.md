# Colour Studio: verification record

Mocked and live checks are kept separate on purpose.

## Live API verification: NOT yet done from the build sandbox

The build sandbox's network policy denies `www.thecolorapi.com` (HTTP 403 from the egress proxy on CONNECT),
so no live request or browser CORS check could be made there. The docs (https://www.thecolorapi.com/docs) were
read and describe a keyless, free `GET /scheme`, but say nothing about CORS. **Run this once from any normal
network before relying on the feature:**

```bash
node scripts/verify-color-api.mjs https://timely-sunflower-ea28d3.netlify.app
```

It prints the HTTP status, the `Access-Control-Allow-Origin` header and the five returned colours, and ends with
`RESULT: OK` only if the status is 2xx, five colours came back and the origin is allowed. Then, on the live
site, open Colour Studio, press "Generate palette" and confirm five swatches appear (DevTools Network tab: one
`scheme?hex=...&count=5` request, no CORS error). If the browser reports a CORS error, a small Netlify proxy
redirect would be the fallback (`/api/color/*` -> `https://www.thecolorapi.com/:splat`), but do not add it
unless the live check fails.

## Mocked / automated checks (no live API traffic)

- `src/domain/colorApi.test.ts`: HEX validation, URL, response parsing, HTTP error, bad JSON, network failure,
  timeout vs abort, no fetch on invalid seed, product-colour formatting. `fetch` is stubbed.
- `src/domain/palettes.test.ts`: save/replace, persistence across reload, old data without `palettes`, dropping
  only invalid palette entries, collection delete, reset, demo-data safeguards, apply-colour rules.
- `src/components/ColourStudio.test.tsx`: no request on input change, validation, swatches, error + retry with
  no fallback palette, stale-response guard, save to collection, source label and disclaimer.
- Browser (Chromium via Playwright against `vite preview`): with the real API unreachable, one request is
  attempted on Generate, the error state with Retry shows and no swatches appear. With the API **mocked by
  Playwright routing**: generate, save, replace-with-confirmation (cancel keeps the old palette), refresh keeps
  the palette with zero new requests, apply to a product with confirmation, long names shortened to 40 chars.
