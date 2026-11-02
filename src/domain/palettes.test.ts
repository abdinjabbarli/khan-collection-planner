import { beforeEach, describe, expect, it } from 'vitest';
import { LIMITS, STORAGE_KEY, createPlannerStore } from './index';
import type { PaletteInput, PlannerStore } from './index';

class MemStorage implements Storage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

let mem: MemStorage;
let store: PlannerStore;
beforeEach(() => {
  mem = new MemStorage();
  store = createPlannerStore(mem);
});

const colours = [
  { name: 'Cobalt', hex: '#0047AB' },
  { name: 'Midnight', hex: '#01122A' },
  { name: 'Azure', hex: '#0A5BD1' },
  { name: 'Sky', hex: '#2E7DEB' },
  { name: 'A very long colour name that exceeds the field limit', hex: '#4A90E2' },
];
const col = (name = 'Winter') => {
  const r = store.addCollection({ name });
  if (!r.ok) throw new Error('x');
  return r.value;
};
const palette = (collectionId: string): PaletteInput => ({ collectionId, seedHex: '#0047ab', mode: 'analogic', colours });
const prod = (collectionId: string, colour = '') => {
  const r = store.addProduct({ collectionId, name: 'Tee', type: 'T-shirt', colour, notes: '', status: 'Idea' });
  if (!r.ok) throw new Error('x');
  return r.value;
};

describe('saving palettes', () => {
  it('saves one palette per collection and replaces on a second save', () => {
    const c = col();
    expect(store.savePalette(palette(c.id)).ok).toBe(true);
    expect(store.getData().palettes).toHaveLength(1);
    store.savePalette({ ...palette(c.id), mode: 'complement' });
    expect(store.getData().palettes).toHaveLength(1);
    expect(store.getData().palettes[0].mode).toBe('complement');
    expect(store.getData().palettes[0].seedHex).toBe('#0047AB');
  });
  it('rejects unknown collections and invalid palettes without changing data', () => {
    const c = col();
    expect(store.savePalette(palette('missing')).ok).toBe(false);
    expect(store.savePalette({ ...palette(c.id), colours: [{ name: 'x', hex: 'red' }] }).ok).toBe(false);
    expect(store.savePalette({ ...palette(c.id), colours: [] }).ok).toBe(false);
    expect(store.getData().palettes).toHaveLength(0);
  });
  it('survives a reload and needs no network (read from storage)', () => {
    const c = col();
    store.savePalette(palette(c.id));
    const again = createPlannerStore(mem);
    expect(again.getData().palettes).toEqual(store.getData().palettes);
    expect(again.getPersistence()).toBe('persistent');
  });
});

describe('existing-data compatibility', () => {
  it('loads data saved before palettes existed, unchanged, with palettes = []', () => {
    const old = {
      version: 1,
      onboarded: true,
      collections: [{ id: 'c1', name: 'Old', createdAt: '2025-01-01T00:00:00.000Z', isDemo: false }],
      products: [{ id: 'p1', collectionId: 'c1', name: 'Hoodie', type: 'Hoodie', colour: 'Charcoal', notes: 'n', status: 'Ready', createdAt: 'a', updatedAt: 'b', isDemo: false }],
    };
    mem.setItem(STORAGE_KEY, JSON.stringify(old));
    const s = createPlannerStore(mem);
    expect(s.getPersistence()).toBe('persistent');
    expect(s.getData().collections).toEqual(old.collections);
    expect(s.getData().products).toEqual(old.products);
    expect(s.getData().palettes).toEqual([]);
  });
  it('drops only invalid palette entries, never collections or products', () => {
    const data = {
      version: 1, onboarded: true,
      collections: [{ id: 'c1', name: 'A', createdAt: 'a', isDemo: false }],
      products: [],
      palettes: [
        { collectionId: 'c1', seedHex: '#0047AB', mode: 'analogic', colours: [{ name: 'Cobalt', hex: '#0047AB' }], savedAt: 'x' },
        { collectionId: 'c1', seedHex: '#0047AB', mode: 'analogic', colours: [{ name: 'Dup', hex: '#0047AB' }], savedAt: 'x' },
        { collectionId: 'gone', seedHex: '#0047AB', mode: 'analogic', colours: [{ name: 'x', hex: '#0047AB' }], savedAt: 'x' },
        { collectionId: 'c1', seedHex: 'bad', mode: 'triad', colours: [], savedAt: 1 },
      ],
    };
    mem.setItem(STORAGE_KEY, JSON.stringify(data));
    const s = createPlannerStore(mem);
    expect(s.getPersistence()).toBe('persistent');
    expect(s.getData().collections).toHaveLength(1);
    expect(s.getData().palettes).toHaveLength(1);
    expect(s.getData().palettes[0].colours[0].name).toBe('Cobalt');
  });
  it('treats a non-array palettes field as empty', () => {
    mem.setItem(STORAGE_KEY, JSON.stringify({ version: 1, onboarded: true, collections: [], products: [], palettes: 'x' }));
    expect(createPlannerStore(mem).getData().palettes).toEqual([]);
  });
});

describe('collection deletion, reset and demo safeguards', () => {
  it('deleting a collection removes only its palette', () => {
    const a = col('A');
    const b = col('B');
    store.savePalette(palette(a.id));
    store.savePalette(palette(b.id));
    store.deleteCollection(a.id);
    expect(store.getData().palettes.map((p) => p.collectionId)).toEqual([b.id]);
  });
  it('reset removes all palettes', () => {
    store.savePalette(palette(col().id));
    store.resetAll();
    expect(store.getData().palettes).toEqual([]);
  });
  it('a demo collection that received a palette is adopted and survives "Remove demo data"', () => {
    store.loadDemoData();
    const demo = store.getData().collections[0];
    store.savePalette(palette(demo.id));
    store.clearDemoData();
    const d = store.getData();
    expect(d.collections.some((c) => c.id === demo.id && !c.isDemo)).toBe(true);
    expect(d.palettes).toHaveLength(1);
    expect(d.products.some((p) => p.collectionId === demo.id)).toBe(true);
  });
  it('removing demo data leaves palettes of user collections and drops none wrongly', () => {
    store.loadDemoData();
    const mine = col('Mine');
    store.savePalette(palette(mine.id));
    store.clearDemoData();
    expect(store.getData().palettes).toHaveLength(1);
    expect(store.getData().collections.map((c) => c.id)).toEqual([mine.id]);
  });
});

describe('applying a palette colour to a product', () => {
  it('never changes products on save; only an explicit apply sets colour', () => {
    const c = col();
    const p = prod(c.id, 'Charcoal');
    store.savePalette(palette(c.id));
    expect(store.getData().products.find((x) => x.id === p.id)!.colour).toBe('Charcoal');
    const r = store.applyPaletteColour(p.id, colours[0]);
    expect(r.ok && r.value.colour).toBe('Cobalt #0047AB');
    expect(store.getData().products.find((x) => x.id === p.id)!.colour).toBe('Cobalt #0047AB');
  });
  it('respects the colour length limit and keeps the HEX', () => {
    const c = col();
    const p = prod(c.id);
    store.savePalette(palette(c.id));
    const r = store.applyPaletteColour(p.id, colours[4]);
    expect(r.ok).toBe(true);
    const v = store.getData().products[0].colour;
    expect(v.length).toBeLessThanOrEqual(LIMITS.colour);
    expect(v.endsWith('#4A90E2')).toBe(true);
  });
  it('rejects colours not in the product’s collection palette and unknown products', () => {
    const a = col('A');
    const b = col('B');
    const p = prod(b.id);
    store.savePalette(palette(a.id));
    expect(store.applyPaletteColour(p.id, colours[0]).ok).toBe(false); // B has no palette
    expect(store.applyPaletteColour('nope', colours[0]).ok).toBe(false);
    expect(store.getData().products[0].colour).toBe('');
  });
  it('persists the applied colour', () => {
    const c = col();
    const p = prod(c.id);
    store.savePalette(palette(c.id));
    store.applyPaletteColour(p.id, colours[1]);
    expect(createPlannerStore(mem).getData().products[0].colour).toBe('Midnight #01122A');
  });
});
