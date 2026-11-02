import { PALETTE_MODES } from './types';
import type { PaletteColour, PaletteMode } from './types';

export const COLOR_API_BASE = 'https://www.thecolorapi.com';
export const COLOR_API_DOCS = 'https://www.thecolorapi.com/docs';
export const PALETTE_SIZE = 5;
export const REQUEST_TIMEOUT_MS = 10_000;
const NAME_MAX = 40;

export const MODE_INFO: Record<PaletteMode, { label: string; description: string }> = {
  monochrome: {
    label: 'Monochrome',
    description: 'Lighter and darker shades of your seed colour. Calm and cohesive.',
  },
  analogic: {
    label: 'Analogic',
    description: 'Neighbouring colours on the colour wheel. Harmonious, with gentle variety.',
  },
  complement: {
    label: 'Complement',
    description: 'Your seed colour with its opposite on the colour wheel. Bold contrast.',
  },
};

export type HexResult = { ok: true; hex: string } | { ok: false; error: string };

/** Accepts exactly six hex digits with an optional leading "#". Returns upper-case "#RRGGBB". */
export function normalizeHex(input: string): HexResult {
  const v = (input ?? '').trim();
  if (!v) return { ok: false, error: 'Enter a six-digit HEX colour, for example #0047AB.' };
  const m = /^#?([0-9a-fA-F]{6})$/.exec(v);
  if (!m) return { ok: false, error: 'HEX colours need exactly six digits (0-9, A-F), for example #0047AB.' };
  return { ok: true, hex: `#${m[1].toUpperCase()}` };
}

export function buildSchemeUrl(hex: string, mode: PaletteMode, count = PALETTE_SIZE): string {
  const clean = hex.replace('#', '');
  return `${COLOR_API_BASE}/scheme?hex=${clean}&mode=${mode}&count=${count}&format=json`;
}

export type PaletteErrorKind = 'timeout' | 'network' | 'api' | 'invalid-response' | 'aborted';
export interface PaletteError {
  kind: PaletteErrorKind;
  message: string;
  status?: number;
}
export type PaletteFetchResult = { ok: true; colours: PaletteColour[] } | { ok: false; error: PaletteError };

const fail = (kind: PaletteErrorKind, message: string, status?: number): PaletteFetchResult => ({
  ok: false,
  error: { kind, message, status },
});

/** Validates an API /scheme body. Returns null if it is not exactly `count` usable colours. */
export function parseSchemeResponse(body: unknown, count = PALETTE_SIZE): PaletteColour[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const colors = (body as { colors?: unknown }).colors;
  if (!Array.isArray(colors) || colors.length !== count) return null;
  const out: PaletteColour[] = [];
  for (const c of colors) {
    const hexObj = (c as { hex?: { clean?: unknown; value?: unknown } } | null)?.hex;
    const raw = typeof hexObj?.clean === 'string' ? hexObj.clean : typeof hexObj?.value === 'string' ? hexObj.value : '';
    const m = /^#?([0-9a-fA-F]{6})$/.exec(raw);
    const nameRaw = (c as { name?: { value?: unknown } } | null)?.name?.value;
    if (!m || typeof nameRaw !== 'string' || !nameRaw.trim()) return null;
    out.push({ name: nameRaw.trim().slice(0, NAME_MAX), hex: `#${m[1].toUpperCase()}` });
  }
  return out;
}

export interface FetchPaletteOptions {
  hex: string;
  mode: PaletteMode;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** One explicit request to The Color API. Never substitutes data on failure. */
export async function fetchPalette(opts: FetchPaletteOptions): Promise<PaletteFetchResult> {
  const { hex, mode, signal, timeoutMs = REQUEST_TIMEOUT_MS } = opts;
  const doFetch = opts.fetchImpl ?? fetch;
  if (!(PALETTE_MODES as readonly string[]).includes(mode)) return fail('api', 'Unsupported palette mode.');
  const norm = normalizeHex(hex);
  if (!norm.ok) return fail('api', norm.error);

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const res = await doFetch(buildSchemeUrl(norm.hex, mode), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = '';
      try {
        const j = (await res.json()) as { message?: unknown };
        if (typeof j?.message === 'string') detail = ` ${j.message}`;
      } catch {
        /* body not JSON */
      }
      return fail('api', `The Color API returned an error (HTTP ${res.status}).${detail}`.slice(0, 300), res.status);
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return fail('invalid-response', 'The Color API sent a response that could not be read.');
    }
    const colours = parseSchemeResponse(body);
    if (!colours) return fail('invalid-response', 'The Color API response did not contain five valid colours.');
    return { ok: true, colours };
  } catch (e) {
    if (timedOut) return fail('timeout', 'The Color API took too long to respond.');
    if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) return fail('aborted', 'Request cancelled.');
    return fail('network', 'Could not reach The Color API. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** "Name #HEX" within `max` characters: the name is shortened first, the HEX is always kept. */
export function formatColourForProduct(colour: PaletteColour, max: number): string {
  const full = `${colour.name} ${colour.hex}`;
  if (full.length <= max) return full;
  const room = max - colour.hex.length - 2; // space + ellipsis
  if (room < 1) return colour.hex.slice(0, max);
  return `${colour.name.slice(0, room).trimEnd()}… ${colour.hex}`;
}
