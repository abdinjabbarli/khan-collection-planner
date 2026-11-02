// MOCKED TESTS: global fetch is a stub; no live API traffic.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlannerStore } from '../domain';
import type { PlannerStore } from '../domain';
import { ColourStudio } from './ColourStudio';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class Mem implements Storage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

const apiBody = (prefix: string) => ({
  colors: ['111111', '222222', '333333', '444444', '555555'].map((h, i) => ({ hex: { value: `#${h}`, clean: h }, name: { value: `${prefix}${i}` } })),
});
const res = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });

let host: HTMLDivElement;
let root: Root;
let store: PlannerStore;
let fetchMock: ReturnType<typeof vi.fn>;

const render = () => act(async () => {
  root.render(<ColourStudio store={store} data={store.getData()} />);
});
const button = (text: string) => [...host.querySelectorAll('button')].find((b) => b.textContent?.includes(text)) as HTMLButtonElement;
const hexInput = () => host.querySelector('input[type="text"]') as HTMLInputElement;
const setValue = async (el: HTMLInputElement, v: string) => {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
const click = (el: HTMLElement) => act(async () => { el.click(); });

beforeEach(() => {
  store = createPlannerStore(new Mem());
  store.startEmpty();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe('Colour Studio (mocked API)', () => {
  it('makes no request until Generate is pressed, even after input and mode changes', async () => {
    await render();
    await setValue(hexInput(), '#123456');
    await click(host.querySelector('input[type="radio"][value="monochrome"]') as HTMLElement);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows a validation error and sends no request for a bad HEX', async () => {
    await render();
    await setValue(hexInput(), '#12');
    await click(button('Generate palette'));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(host.textContent).toContain('exactly six digits');
    expect(hexInput().getAttribute('aria-invalid')).toBe('true');
  });

  it('renders five CSS swatches with names and HEX on success', async () => {
    fetchMock.mockResolvedValue(res(apiBody('Ok')));
    await render();
    await click(button('Generate palette'));
    expect(host.querySelectorAll('.swatch')).toHaveLength(5);
    expect(host.textContent).toContain('Ok0');
    expect(host.textContent).toContain('#111111');
    expect(host.querySelector('img')).toBeNull();
    expect((host.querySelector('.swatch__chip') as HTMLElement).style.backgroundColor).not.toBe('');
  });

  it('shows an API error with Retry, no fallback palette, and retry succeeds', async () => {
    fetchMock.mockResolvedValueOnce(res({ code: 500, message: 'boom' }, 500)).mockResolvedValueOnce(res(apiBody('Retry')));
    await render();
    await click(button('Generate palette'));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('HTTP 500');
    expect(host.querySelectorAll('.swatch')).toHaveLength(0);
    await click(button('Retry'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain('Retry0');
  });

  it('ignores a stale response that resolves after a newer request', async () => {
    let resolveFirst!: (r: Response) => void;
    fetchMock
      .mockImplementationOnce(() => new Promise<Response>((r) => { resolveFirst = r; }))
      .mockResolvedValueOnce(res(apiBody('New')));
    await render();
    await click(button('Generate palette'));
    // First request is still pending, so the button is disabled; change inputs and issue a second request via form submit.
    await setValue(hexInput(), '#abcdef');
    await act(async () => { host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(host.textContent).toContain('New0');
    await act(async () => { resolveFirst(res(apiBody('Old'))); });
    expect(host.textContent).toContain('New0');
    expect(host.textContent).not.toContain('Old0');
  });

  it('saves a generated palette to the chosen collection', async () => {
    const c = store.addCollection({ name: 'Winter' });
    if (!c.ok) throw new Error('x');
    fetchMock.mockResolvedValue(res(apiBody('Save')));
    await render();
    await click(button('Generate palette'));
    await act(async () => { root.render(<ColourStudio store={store} data={store.getData()} />); });
    await click(button('Save palette'));
    expect(store.getData().palettes).toHaveLength(1);
    expect(store.getData().palettes[0].colours[0].name).toBe('Save0');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('labels the source and the not-a-fabric-match disclaimer', async () => {
    await render();
    const link = [...host.querySelectorAll('a')].find((a) => a.textContent === 'The Color API') as HTMLAnchorElement;
    expect(host.textContent).toContain('Powered by');
    expect(link.href).toBe('https://www.thecolorapi.com/docs');
    expect(host.textContent).toContain('not verified fabric or print matches');
  });
});
