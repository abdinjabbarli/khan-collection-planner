// MOCKED TESTS: fetch is a stub. These verify our handling of API responses, not the live API.
import { describe, expect, it, vi } from 'vitest';
import { buildSchemeUrl, fetchPalette, formatColourForProduct, normalizeHex, parseSchemeResponse } from './colorApi';

const color = (clean: string, name: string) => ({ hex: { value: `#${clean}`, clean }, name: { value: name } });
const body = (n = 5) => ({
  mode: 'analogic',
  count: String(n),
  colors: ['0047AB', '0A5BD1', '2E7DEB', '1A3F8C', '4A90E2'].slice(0, n).map((h, i) => color(h, `Name ${i}`)),
});
const jsonRes = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
const stub = (impl: (url: string, init?: RequestInit) => Promise<Response>) => vi.fn(impl) as unknown as typeof fetch;

describe('normalizeHex', () => {
  it('accepts six digits with or without #, any case', () => {
    expect(normalizeHex('0047ab')).toEqual({ ok: true, hex: '#0047AB' });
    expect(normalizeHex(' #0047AB ')).toEqual({ ok: true, hex: '#0047AB' });
  });
  it.each(['', '#FFF', '12345', '1234567', '#GGGGGG', '00 47AB', '##0047AB'])('rejects %j', (v) => {
    expect(normalizeHex(v).ok).toBe(false);
  });
});

describe('request building', () => {
  it('uses /scheme with hex, mode, count=5 and json', () => {
    expect(buildSchemeUrl('#0047AB', 'complement')).toBe('https://www.thecolorapi.com/scheme?hex=0047AB&mode=complement&count=5&format=json');
  });
});

describe('response handling', () => {
  it('maps five colours to name + upper-case HEX', async () => {
    const f = stub(async () => jsonRes(body()));
    const r = await fetchPalette({ hex: '#0047ab', mode: 'analogic', fetchImpl: f });
    expect(r.ok && r.colours).toHaveLength(5);
    expect(r.ok && r.colours[0]).toEqual({ name: 'Name 0', hex: '#0047AB' });
    expect((f as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('hex=0047AB&mode=analogic&count=5');
  });
  it('rejects wrong count, bad hex and missing names as invalid-response', () => {
    expect(parseSchemeResponse(body(4))).toBeNull();
    expect(parseSchemeResponse({ colors: [] })).toBeNull();
    expect(parseSchemeResponse(null)).toBeNull();
    const bad = body();
    bad.colors[2] = color('ZZZZZZ', 'x');
    expect(parseSchemeResponse(bad)).toBeNull();
    const noName = body();
    (noName.colors[1] as { name: { value: string } }).name.value = ' ';
    expect(parseSchemeResponse(noName)).toBeNull();
  });
  it('reports HTTP errors as api errors with status', async () => {
    const r = await fetchPalette({ hex: '#0047AB', mode: 'monochrome', fetchImpl: stub(async () => jsonRes({ code: 400, message: 'nope' }, 400)) });
    expect(r).toMatchObject({ ok: false, error: { kind: 'api', status: 400 } });
  });
  it('reports malformed JSON and bad shape as invalid-response', async () => {
    const r1 = await fetchPalette({ hex: '#0047AB', mode: 'monochrome', fetchImpl: stub(async () => new Response('<html>', { status: 200 })) });
    const r2 = await fetchPalette({ hex: '#0047AB', mode: 'monochrome', fetchImpl: stub(async () => jsonRes({ colors: [1, 2] })) });
    expect(r1).toMatchObject({ ok: false, error: { kind: 'invalid-response' } });
    expect(r2).toMatchObject({ ok: false, error: { kind: 'invalid-response' } });
  });
  it('reports network failure (e.g. CORS or offline) as network, without fallback colours', async () => {
    const r = await fetchPalette({ hex: '#0047AB', mode: 'monochrome', fetchImpl: stub(async () => { throw new TypeError('Failed to fetch'); }) });
    expect(r).toMatchObject({ ok: false, error: { kind: 'network' } });
    expect('colours' in r).toBe(false);
  });
  it('times out', async () => {
    const f = stub((_u, init) => new Promise((_res, rej) => init!.signal!.addEventListener('abort', () => rej(new DOMException('x', 'AbortError')))));
    const r = await fetchPalette({ hex: '#0047AB', mode: 'monochrome', fetchImpl: f, timeoutMs: 20 });
    expect(r).toMatchObject({ ok: false, error: { kind: 'timeout' } });
  });
  it('distinguishes caller abort from timeout', async () => {
    const ctl = new AbortController();
    const f = stub((_u, init) => new Promise((_res, rej) => init!.signal!.addEventListener('abort', () => rej(new DOMException('x', 'AbortError')))));
    const p = fetchPalette({ hex: '#0047AB', mode: 'monochrome', fetchImpl: f, signal: ctl.signal });
    ctl.abort();
    expect(await p).toMatchObject({ ok: false, error: { kind: 'aborted' } });
  });
  it('does not call fetch for an invalid seed', async () => {
    const f = stub(async () => jsonRes(body()));
    const r = await fetchPalette({ hex: 'nope', mode: 'monochrome', fetchImpl: f });
    expect(r.ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('formatColourForProduct', () => {
  it('uses "Name #HEX" when it fits', () => {
    expect(formatColourForProduct({ name: 'Cobalt', hex: '#0047AB' }, 40)).toBe('Cobalt #0047AB');
  });
  it('shortens the name but always keeps the HEX within the limit', () => {
    const out = formatColourForProduct({ name: 'A very long colour name that exceeds the field', hex: '#0047AB' }, 40);
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out.endsWith(' #0047AB')).toBe(true);
    expect(out).toContain('…');
  });
});
