import { beforeEach, describe, expect, it } from 'vitest';
import { createPlannerStore, filterProducts, STORAGE_KEY, LIMITS } from './index';
import type { PlannerStore, ProductInput } from './index';

class MemStorage implements Storage {
  m = new Map<string, string>();
  failSet = false;
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) {
    if (this.failSet) throw new Error('quota');
    this.m.set(k, v);
  }
}

let mem: MemStorage;
let store: PlannerStore;
beforeEach(() => {
  mem = new MemStorage();
  store = createPlannerStore(mem);
});

const prod = (collectionId: string, over: Partial<ProductInput> = {}): ProductInput => ({
  collectionId, name: 'Tee', type: 'T-shirt', colour: '', notes: '', status: 'Idea', ...over,
});
const mkCol = (name = 'Col') => {
  const r = store.addCollection({ name });
  if (!r.ok) throw new Error('fail');
  return r.value;
};

describe('collection validation', () => {
  it('requires a name and trims', () => {
    expect(store.addCollection({ name: '   ' }).ok).toBe(false);
    const r = store.addCollection({ name: '  Autumn  ' });
    expect(r.ok && r.value.name).toBe('Autumn');
  });
  it('enforces max length', () => {
    expect(store.addCollection({ name: 'a'.repeat(LIMITS.collectionName) }).ok).toBe(true);
    const r = store.addCollection({ name: 'b'.repeat(LIMITS.collectionName + 1) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toMatch(/40/);
  });
  it('rejects duplicates case-insensitively, also on rename', () => {
    mkCol('Winter');
    const other = mkCol('Spring');
    expect(store.addCollection({ name: ' winter ' }).ok).toBe(false);
    expect(store.renameCollection(other.id, 'WINTER').ok).toBe(false);
    expect(store.renameCollection(other.id, 'SPRING').ok).toBe(true);
  });
});

describe('product validation', () => {
  it('accepts a valid product and trims', () => {
    const c = mkCol();
    const r = store.addProduct(prod(c.id, { name: ' Hoodie ', colour: ' red ', notes: ' n ' }));
    expect(r.ok && [r.value.name, r.value.colour, r.value.notes]).toEqual(['Hoodie', 'red', 'n']);
  });
  it('enforces limits and enums', () => {
    const c = mkCol();
    const bad = store.addProduct(prod(c.id, {
      name: '', type: 'Cape', status: 'Done', colour: 'c'.repeat(41), notes: 'n'.repeat(501),
    }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(['colour', 'name', 'notes', 'status', 'type']);
    expect(store.addProduct(prod(c.id, { name: 'x'.repeat(61) })).ok).toBe(false);
    expect(store.addProduct(prod(c.id, { name: 'x'.repeat(60), colour: 'c'.repeat(40), notes: 'n'.repeat(500) })).ok).toBe(true);
  });
  it('requires an existing collection', () => {
    const r = store.addProduct(prod('nope'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.collectionId).toBeTruthy();
  });
  it('updates a product', () => {
    const c = mkCol();
    const p = store.addProduct(prod(c.id));
    if (!p.ok) throw new Error();
    const u = store.updateProduct(p.value.id, prod(c.id, { name: 'New', status: 'Ready' }));
    expect(u.ok && u.value.status).toBe('Ready');
    expect(store.updateProduct(p.value.id, prod(c.id, { name: '' })).ok).toBe(false);
  });
});

describe('deletes, demo and reset', () => {
  it('deleteCollection cascades to products', () => {
    const a = mkCol('A');
    const b = mkCol('B');
    store.addProduct(prod(a.id));
    store.addProduct(prod(b.id));
    store.deleteCollection(a.id);
    expect(store.getData().collections.map((c) => c.id)).toEqual([b.id]);
    expect(store.getData().products).toHaveLength(1);
  });
  it('loadDemoData adds only demo records, marks onboarded, no duplicates', () => {
    store.loadDemoData();
    store.loadDemoData();
    const d = store.getData();
    expect(d.onboarded).toBe(true);
    expect(d.collections.map((c) => c.name)).toEqual(['Winter Drop (demo)', 'Spring Capsule (demo)']);
    expect(d.products.length).toBeGreaterThanOrEqual(6);
    expect([...d.collections, ...d.products].every((r) => r.isDemo)).toBe(true);
    expect(new Set(d.products.map((p) => p.status)).size).toBe(4);
    expect(new Set(d.products.map((p) => p.type)).size).toBe(8);
  });
  it('clearDemoData keeps user records, incl. user products in demo collections', () => {
    const user = mkCol('Mine');
    store.addProduct(prod(user.id, { name: 'Mine P' }));
    store.loadDemoData();
    const winter = store.getData().collections.find((c) => c.name === 'Winter Drop (demo)')!;
    store.addProduct(prod(winter.id, { name: 'User in demo' }));
    store.clearDemoData();
    const d = store.getData();
    expect(d.collections.map((c) => c.name).sort()).toEqual(['Mine', 'Winter Drop (demo)']);
    expect(d.collections.every((c) => !c.isDemo)).toBe(true);
    expect(d.products.map((p) => p.name).sort()).toEqual(['Mine P', 'User in demo']);
  });
  it('clearDemoData with only demo data empties it', () => {
    store.loadDemoData();
    store.clearDemoData();
    expect(store.getData().collections).toEqual([]);
    expect(store.getData().products).toEqual([]);
  });
  it('startEmpty marks onboarded; resetAll wipes everything', () => {
    store.startEmpty();
    expect(store.getData().onboarded).toBe(true);
    mkCol();
    store.resetAll();
    expect(store.getData()).toEqual({ version: 1, collections: [], products: [], onboarded: false });
  });
  it('notifies subscribers and supports unsubscribe', () => {
    let n = 0;
    const off = store.subscribe(() => n++);
    mkCol('A');
    off();
    mkCol('B');
    expect(n).toBe(1);
  });
});

describe('filterProducts', () => {
  it('uses AND semantics', () => {
    const a = mkCol('A');
    const b = mkCol('B');
    store.addProduct(prod(a.id, { name: '1', type: 'Hoodie', status: 'Idea' }));
    store.addProduct(prod(a.id, { name: '2', type: 'Hoodie', status: 'Ready' }));
    store.addProduct(prod(b.id, { name: '3', type: 'Hoodie', status: 'Ready' }));
    store.addProduct(prod(a.id, { name: '4', type: 'Pants', status: 'Ready' }));
    const all = store.getData().products;
    const names = (f: Parameters<typeof filterProducts>[1]) => filterProducts(all, f).map((p) => p.name);
    expect(names({ collectionId: 'all', type: 'all', status: 'all' })).toEqual(['1', '2', '3', '4']);
    expect(names({ collectionId: a.id, type: 'Hoodie', status: 'Ready' })).toEqual(['2']);
    expect(names({ collectionId: 'all', type: 'Hoodie', status: 'Ready' })).toEqual(['2', '3']);
    expect(names({ collectionId: b.id, type: 'Pants', status: 'all' })).toEqual([]);
  });
});

describe('persistence', () => {
  it('is persistent after a successful write and reloads data', () => {
    expect(store.getPersistence()).toBe('persistent');
    mkCol('Saved');
    expect(store.getPersistence()).toBe('persistent');
    expect(createPlannerStore(mem).getData().collections[0].name).toBe('Saved');
  });
  it('recovers from corrupt JSON', () => {
    mem.setItem(STORAGE_KEY, '{not json');
    const s = createPlannerStore(mem);
    expect(s.getPersistence()).toBe('recovered');
    expect(s.getData().collections).toEqual([]);
  });
  it('recovers from wrong shape', () => {
    for (const bad of [
      '[]', '{"version":2}', '{"version":1,"collections":{},"products":[],"onboarded":false}',
      JSON.stringify({ version: 1, collections: [], onboarded: false, products: [{ id: 'x' }] }),
    ]) {
      mem.setItem(STORAGE_KEY, bad);
      expect(createPlannerStore(mem).getPersistence()).toBe('recovered');
    }
  });
  it('is unavailable when storage is null', () => {
    const s = createPlannerStore(null);
    expect(s.getPersistence()).toBe('unavailable');
    s.addCollection({ name: 'Mem' });
    expect(s.getData().collections).toHaveLength(1);
    expect(s.getPersistence()).toBe('unavailable');
  });
  it('is unavailable when access throws', () => {
    const throwing = {
      getItem() { throw new Error('denied'); },
      setItem() { throw new Error('denied'); },
      removeItem() { throw new Error('denied'); },
    } as unknown as Storage;
    const s = createPlannerStore(throwing);
    expect(s.getPersistence()).toBe('unavailable');
    s.addCollection({ name: 'Mem' });
    expect(s.getData().collections).toHaveLength(1);
    expect(s.getPersistence()).not.toBe('persistent');
  });
  it('is unavailable when the probe write fails at startup', () => {
    mem.failSet = true;
    const s = createPlannerStore(mem);
    expect(s.getPersistence()).toBe('unavailable');
  });
  it('reports failed when a later write throws, and recovers after a good write', () => {
    mem.failSet = true;
    mkCol('Lost');
    expect(store.getPersistence()).toBe('failed');
    expect(store.getData().collections).toHaveLength(1);
    mem.failSet = false;
    mkCol('Ok');
    expect(store.getPersistence()).toBe('persistent');
  });
});
