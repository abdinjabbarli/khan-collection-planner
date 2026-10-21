import { beforeEach, describe, expect, it } from 'vitest';
import { countProductsByCollection, createPlannerStore, LIMITS } from './index';
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

const prod = (collectionId: string, name = 'Tee'): ProductInput => ({
  collectionId, name, type: 'T-shirt', colour: '', notes: '', status: 'Idea',
});
const mkCol = (name = 'Col') => {
  const r = store.addCollection({ name });
  if (!r.ok) throw new Error('fail');
  return r.value;
};

describe('collection names', () => {
  it('rejects duplicates case-insensitively', () => {
    mkCol('Winter');
    expect(store.addCollection({ name: 'WINTER' }).ok).toBe(false);
  });
  it('allows same-name and case-only rename', () => {
    const c = mkCol('Spring');
    expect(store.renameCollection(c.id, 'Spring').ok).toBe(true);
    const r = store.renameCollection(c.id, 'SPRING');
    expect(r.ok && r.value.name).toBe('SPRING');
    expect(store.getData().collections[0].name).toBe('SPRING');
  });
  it('rejects unknown id', () => {
    const r = store.renameCollection('nope', 'X');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toBeTruthy();
    expect(store.getData().collections).toHaveLength(0);
  });
  it('40 chars ok, 41 rejected (add and rename)', () => {
    const c = mkCol('a'.repeat(LIMITS.collectionName));
    expect(store.addCollection({ name: 'b'.repeat(41) }).ok).toBe(false);
    expect(store.renameCollection(c.id, 'c'.repeat(41)).ok).toBe(false);
    expect(store.renameCollection(c.id, 'c'.repeat(40)).ok).toBe(true);
  });
  it('rejects whitespace-only name on rename and keeps old name', () => {
    const c = mkCol('Keep');
    expect(store.renameCollection(c.id, '   ').ok).toBe(false);
    expect(store.getData().collections[0].name).toBe('Keep');
  });
});

describe('demo interaction', () => {
  it('renamed demo collection survives clearDemoData with its products as user data only', () => {
    store.loadDemoData();
    const demo = store.getData().collections.find((c) => c.isDemo)!;
    const demoProductCount = store.getData().products.filter((p) => p.collectionId === demo.id).length;
    expect(demoProductCount).toBeGreaterThan(0);
    const r = store.renameCollection(demo.id, 'My renamed');
    expect(r.ok && r.value.isDemo).toBe(false);
    store.clearDemoData();
    const d = store.getData();
    expect(d.collections.find((c) => c.id === demo.id)?.name).toBe('My renamed');
    expect(d.products.filter((p) => p.collectionId === demo.id)).toHaveLength(0);
    expect(d.collections.some((c) => c.isDemo)).toBe(false);
  });
  it('keeps user products in demo collections', () => {
    store.loadDemoData();
    const demo = store.getData().collections.find((c) => c.isDemo)!;
    const p = store.addProduct(prod(demo.id, 'Mine'));
    expect(p.ok).toBe(true);
    store.clearDemoData();
    expect(store.getData().collections.some((c) => c.id === demo.id)).toBe(true);
    expect(store.getData().products.map((x) => x.name)).toEqual(['Mine']);
  });
});

describe('deleteCollection', () => {
  it('cascades to products and counts are correct', () => {
    const a = mkCol('A');
    const b = mkCol('B');
    store.addProduct(prod(a.id, 'a1'));
    store.addProduct(prod(a.id, 'a2'));
    store.addProduct(prod(b.id, 'b1'));
    expect(countProductsByCollection(store.getData().products)).toEqual({ [a.id]: 2, [b.id]: 1 });
    store.deleteCollection(a.id);
    const d = store.getData();
    expect(d.collections.map((c) => c.id)).toEqual([b.id]);
    expect(d.products.map((p) => p.name)).toEqual(['b1']);
  });
  it('is a no-op for unknown id (no notification)', () => {
    mkCol('A');
    let n = 0;
    store.subscribe(() => n++);
    const before = store.getData();
    store.deleteCollection('nope');
    expect(store.getData()).toBe(before);
    expect(n).toBe(0);
  });
  it('persists across store re-creation', () => {
    const a = mkCol('A');
    mkCol('B');
    store.addProduct(prod(a.id));
    store.deleteCollection(a.id);
    const again = createPlannerStore(mem);
    expect(again.getData().collections.map((c) => c.name)).toEqual(['B']);
    expect(again.getData().products).toHaveLength(0);
    expect(again.getPersistence()).toBe('persistent');
  });
  it('persists add and rename across re-creation', () => {
    const c = mkCol('Old');
    store.renameCollection(c.id, 'New');
    expect(createPlannerStore(mem).getData().collections.map((x) => x.name)).toEqual(['New']);
  });
});

describe('persistence status on collection changes', () => {
  it.each(['add', 'rename', 'delete'] as const)('reports failed when setItem throws on %s', (op) => {
    const c = mkCol('A');
    expect(store.getPersistence()).toBe('persistent');
    mem.failSet = true;
    if (op === 'add') store.addCollection({ name: 'B' });
    if (op === 'rename') store.renameCollection(c.id, 'Z');
    if (op === 'delete') store.deleteCollection(c.id);
    expect(store.getPersistence()).toBe('failed');
    mem.failSet = false;
    store.addCollection({ name: 'Recovered' });
    expect(store.getPersistence()).toBe('persistent');
  });
  it('reports unavailable without storage', () => {
    const s = createPlannerStore(null);
    s.addCollection({ name: 'A' });
    expect(s.getPersistence()).toBe('unavailable');
    expect(s.getData().collections).toHaveLength(1);
  });
});

describe('countProductsByCollection', () => {
  it('returns empty object for no products', () => {
    expect(countProductsByCollection([])).toEqual({});
  });
});
