import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS, PRODUCT_TYPES, STATUSES, countProductsByStatus, createPlannerStore,
  filterProducts, hasActiveFilters, normalizeFilters,
} from './index';
import type { Product, ProductFilters, ProductInput, PlannerStore } from './index';

class MemStorage implements Storage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

let store: PlannerStore;
beforeEach(() => { store = createPlannerStore(new MemStorage()); });

const col = (name: string) => {
  const r = store.addCollection({ name });
  if (!r.ok) throw new Error('fail');
  return r.value;
};
const prod = (collectionId: string, name: string, type: ProductInput['type'], status: ProductInput['status']) => {
  const r = store.addProduct({ collectionId, name, type, colour: '', notes: '', status });
  if (!r.ok) throw new Error('fail');
  return r.value;
};

const mk = (id: string, collectionId: string, type: Product['type'], status: Product['status']): Product => ({
  id, collectionId, name: id, type, colour: '', notes: '', status,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', isDemo: false,
});

const colIds = ['c1', 'c2'];
const types = ['T-shirt', 'Hoodie'] as const;
const sts = ['Idea', 'Ready'] as const;
// one product per (collection,type,status) combination, in a deliberately non-sorted order
const products: Product[] = [];
let n = 0;
for (const s of [...sts].reverse()) for (const t of [...types].reverse()) for (const c of [...colIds].reverse())
  products.push(mk(`p${n++}`, c, t, s));

describe('filterProducts', () => {
  it('all-all returns everything in the same order', () => {
    expect(filterProducts(products, DEFAULT_FILTERS)).toEqual(products);
  });

  it('every combination behaves as AND', () => {
    for (const c of ['all', ...colIds, 'nope']) for (const t of ['all', ...types]) for (const s of ['all', ...sts]) {
      const f = { collectionId: c, type: t, status: s } as ProductFilters;
      const expected = products.filter(
        (p) => (c === 'all' || p.collectionId === c) && (t === 'all' || p.type === t) && (s === 'all' || p.status === s),
      );
      expect(filterProducts(products, f)).toEqual(expected);
    }
  });

  it('fully specified filter matches exactly one product', () => {
    const r = filterProducts(products, { collectionId: 'c1', type: 'Hoodie', status: 'Ready' });
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ collectionId: 'c1', type: 'Hoodie', status: 'Ready' });
  });

  it('impossible combinations return []', () => {
    expect(filterProducts(products, { collectionId: 'c1', type: 'Jacket', status: 'all' })).toEqual([]);
    expect(filterProducts(products, { collectionId: 'c1', type: 'Hoodie', status: 'Design' })).toEqual([]);
    expect(filterProducts(products, { collectionId: 'gone', type: 'all', status: 'all' })).toEqual([]);
  });

  it('keeps input order and does not mutate', () => {
    const copy = [...products];
    const r = filterProducts(products, { collectionId: 'all', type: 'all', status: 'Idea' });
    expect(r.map((p) => p.id)).toEqual(copy.filter((p) => p.status === 'Idea').map((p) => p.id));
    expect(products).toEqual(copy);
    expect(r).not.toBe(products);
  });

  it('handles an empty list', () => {
    expect(filterProducts([], DEFAULT_FILTERS)).toEqual([]);
    expect(filterProducts([], { collectionId: 'c1', type: 'Hoodie', status: 'Idea' })).toEqual([]);
  });

  it('works with store data in store order', () => {
    const a = col('A');
    const p1 = prod(a.id, 'one', 'Hoodie', 'Idea');
    prod(a.id, 'two', 'Pants', 'Idea');
    const p3 = prod(a.id, 'three', 'Hoodie', 'Idea');
    const r = filterProducts(store.getData().products, { collectionId: a.id, type: 'Hoodie', status: 'Idea' });
    expect(r.map((p) => p.id)).toEqual([p1.id, p3.id]);
  });
});

describe('DEFAULT_FILTERS / hasActiveFilters', () => {
  it('default is all-all and inactive', () => {
    expect(DEFAULT_FILTERS).toEqual({ collectionId: 'all', type: 'all', status: 'all' });
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
  });
  it('any single non-all value is active', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, collectionId: 'c1' })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, type: 'Hoodie' })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, status: 'Idea' })).toBe(true);
  });
});

describe('normalizeFilters', () => {
  it('preserves valid values', () => {
    const a = col('A');
    const f: ProductFilters = { collectionId: a.id, type: 'Jacket', status: 'Sample' };
    expect(normalizeFilters(f, store.getData().collections)).toEqual(f);
  });
  it('resets a deleted collection to all', () => {
    const a = col('A');
    const f: ProductFilters = { collectionId: a.id, type: 'Hoodie', status: 'Idea' };
    store.deleteCollection(a.id);
    expect(normalizeFilters(f, store.getData().collections)).toEqual({ collectionId: 'all', type: 'Hoodie', status: 'Idea' });
  });
  it('resets garbage type/status to all', () => {
    const f = { collectionId: 'all', type: 'Socks', status: 'Done' } as unknown as ProductFilters;
    expect(normalizeFilters(f, [])).toEqual(DEFAULT_FILTERS);
    const g = { collectionId: 'x', type: 42, status: null } as unknown as ProductFilters;
    expect(normalizeFilters(g, [])).toEqual(DEFAULT_FILTERS);
  });
  it('accepts every real type and status', () => {
    for (const t of PRODUCT_TYPES) expect(normalizeFilters({ ...DEFAULT_FILTERS, type: t }, []).type).toBe(t);
    for (const s of STATUSES) expect(normalizeFilters({ ...DEFAULT_FILTERS, status: s }, []).status).toBe(s);
  });
  it('does not mutate input and returns a new object', () => {
    const f = { collectionId: 'gone', type: 'bad', status: 'bad' } as unknown as ProductFilters;
    const copy = { ...f };
    const r = normalizeFilters(f, []);
    expect(f).toEqual(copy);
    expect(r).not.toBe(f);
  });
  it('does not mutate DEFAULT_FILTERS', () => {
    const r = normalizeFilters(DEFAULT_FILTERS, []);
    expect(r).not.toBe(DEFAULT_FILTERS);
    expect(DEFAULT_FILTERS).toEqual({ collectionId: 'all', type: 'all', status: 'all' });
  });
});

describe('countProductsByStatus', () => {
  it('has all four keys at 0 when empty', () => {
    expect(countProductsByStatus([])).toEqual({ Idea: 0, Design: 0, Sample: 0, Ready: 0 });
  });
  it('counts correctly', () => {
    const ps = [mk('a', 'c', 'Hoodie', 'Idea'), mk('b', 'c', 'Hoodie', 'Idea'), mk('c', 'c', 'Pants', 'Ready')];
    expect(countProductsByStatus(ps)).toEqual({ Idea: 2, Design: 0, Sample: 0, Ready: 1 });
  });
  it('reflects status changes through the store', () => {
    const a = col('A');
    const p = prod(a.id, 'one', 'Hoodie', 'Idea');
    prod(a.id, 'two', 'Hoodie', 'Design');
    expect(countProductsByStatus(store.getData().products)).toEqual({ Idea: 1, Design: 1, Sample: 0, Ready: 0 });
    expect(store.setProductStatus(p.id, 'Ready').ok).toBe(true);
    expect(countProductsByStatus(store.getData().products)).toEqual({ Idea: 0, Design: 1, Sample: 0, Ready: 1 });
  });
});
