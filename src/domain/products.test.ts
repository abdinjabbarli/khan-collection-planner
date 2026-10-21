import { beforeEach, describe, expect, it, vi } from 'vitest';
import { countProductsByCollection, createPlannerStore, LIMITS, STATUSES } from './index';
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

const input = (collectionId: string, over: Partial<ProductInput> = {}): ProductInput => ({
  collectionId, name: 'Tee', type: 'T-shirt', colour: 'Red', notes: 'n', status: 'Idea', ...over,
});
const mkCol = (name = 'Col') => {
  const r = store.addCollection({ name });
  if (!r.ok) throw new Error('fail');
  return r.value;
};
const mkProd = (collectionId: string, over: Partial<ProductInput> = {}) => {
  const r = store.addProduct(input(collectionId, over));
  if (!r.ok) throw new Error('fail ' + JSON.stringify(r.errors));
  return r.value;
};
const snapshot = () => JSON.stringify(store.getData());

describe('updateProduct', () => {
  it('trims fields and updates updatedAt', async () => {
    const c = mkCol();
    const p = mkProd(c.id);
    await new Promise((r) => setTimeout(r, 3));
    const r = store.updateProduct(p.id, input(c.id, { name: '  New  ', colour: ' Blue ', notes: ' hi ', type: 'Hoodie', status: 'Ready' }));
    expect(r.ok).toBe(true);
    const got = store.getData().products[0];
    expect(got).toMatchObject({ name: 'New', colour: 'Blue', notes: 'hi', type: 'Hoodie', status: 'Ready', createdAt: p.createdAt });
    expect(got.updatedAt).not.toBe(p.updatedAt);
  });

  it('moves to another collection; unknown collection is rejected', () => {
    const a = mkCol('A');
    const b = mkCol('B');
    const p = mkProd(a.id);
    const bad = store.updateProduct(p.id, input('ghost'));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.collectionId).toBeTruthy();
    expect(store.getData().products[0].collectionId).toBe(a.id);
    expect(store.updateProduct(p.id, input(b.id)).ok).toBe(true);
    expect(store.getData().products[0].collectionId).toBe(b.id);
  });

  it('enforces limits at the boundary', () => {
    const c = mkCol();
    const p = mkProd(c.id);
    const ok = (o: Partial<ProductInput>) => store.updateProduct(p.id, input(c.id, o)).ok;
    expect(ok({ name: 'a'.repeat(LIMITS.productName) })).toBe(true);
    expect(ok({ name: 'a'.repeat(LIMITS.productName + 1) })).toBe(false);
    expect(ok({ colour: 'a'.repeat(LIMITS.colour) })).toBe(true);
    expect(ok({ colour: 'a'.repeat(LIMITS.colour + 1) })).toBe(false);
    expect(ok({ notes: 'a'.repeat(LIMITS.notes) })).toBe(true);
    expect(ok({ notes: 'a'.repeat(LIMITS.notes + 1) })).toBe(false);
  });

  it('rejects empty name, invalid type and invalid status, keyed correctly', () => {
    const c = mkCol();
    const p = mkProd(c.id);
    const e1 = store.updateProduct(p.id, input(c.id, { name: '   ' }));
    const e2 = store.updateProduct(p.id, input(c.id, { type: 'Cape' }));
    const e3 = store.updateProduct(p.id, input(c.id, { status: 'Done' }));
    expect(!e1.ok && e1.errors.name).toBeTruthy();
    expect(!e2.ok && e2.errors.type).toBeTruthy();
    expect(!e3.ok && e3.errors.status).toBeTruthy();
  });

  it('never mutates data or notifies on failed validation or unknown id', () => {
    const c = mkCol();
    const p = mkProd(c.id);
    const before = snapshot();
    const listener = vi.fn();
    store.subscribe(listener);
    const stored = mem.getItem('khan-planner:v1');
    expect(store.updateProduct(p.id, input(c.id, { name: '', type: 'x', status: 'y', colour: 'c'.repeat(99) })).ok).toBe(false);
    expect(store.updateProduct('nope', input(c.id)).ok).toBe(false);
    expect(snapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
    expect(mem.getItem('khan-planner:v1')).toBe(stored);
  });
});

describe('setProductStatus', () => {
  it('updates status and updatedAt, and persists', async () => {
    const c = mkCol();
    const p = mkProd(c.id);
    await new Promise((r) => setTimeout(r, 3));
    for (const s of STATUSES) {
      const r = store.setProductStatus(p.id, s);
      expect(r.ok && r.value.status).toBe(s);
    }
    const got = store.getData().products[0];
    expect(got.status).toBe('Ready');
    expect(got.updatedAt).not.toBe(p.updatedAt);
    expect(createPlannerStore(mem).getData().products[0].status).toBe('Ready');
  });

  it('rejects invalid status keyed status, without mutation', () => {
    const c = mkCol();
    const p = mkProd(c.id);
    const before = snapshot();
    const listener = vi.fn();
    store.subscribe(listener);
    const r = store.setProductStatus(p.id, 'Done');
    expect(!r.ok && r.errors.status).toBeTruthy();
    expect(snapshot()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it('unknown id returns the "no longer exists" error', () => {
    const r = store.setProductStatus('nope', 'Idea');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.status).toBe('That product no longer exists.');
  });
});

describe('demo ownership and clearDemoData', () => {
  const demoSetup = () => {
    store.loadDemoData();
    const { collections, products } = store.getData();
    const winter = collections.find((c) => c.name.startsWith('Winter'))!;
    const spring = collections.find((c) => c.name.startsWith('Spring'))!;
    const inWinter = products.filter((p) => p.collectionId === winter.id);
    const inSpring = products.filter((p) => p.collectionId === spring.id);
    return { winter, spring, inWinter, inSpring };
  };
  const ids = () => store.getData().products.map((p) => p.id);

  it('updateProduct and setProductStatus mark a demo product as user-owned', () => {
    const { winter, inWinter } = demoSetup();
    const r1 = store.updateProduct(inWinter[0].id, input(winter.id, { name: 'Mine' }));
    expect(r1.ok && r1.value.isDemo).toBe(false);
    const r2 = store.setProductStatus(inWinter[1].id, 'Ready');
    expect(r2.ok && r2.value.isDemo).toBe(false);
    expect(store.getData().products.find((p) => p.id === inWinter[2].id)!.isDemo).toBe(true);
  });

  it('failed edits leave demo flag alone', () => {
    const { winter, inWinter } = demoSetup();
    store.updateProduct(inWinter[0].id, input(winter.id, { name: '' }));
    store.setProductStatus(inWinter[0].id, 'bogus');
    expect(store.getData().products.find((p) => p.id === inWinter[0].id)!.isDemo).toBe(true);
  });

  it('keeps every touched product and its collection, removes untouched demo data', () => {
    const { winter, spring, inWinter, inSpring } = demoSetup();
    const userCol = mkCol('Mine');
    const userProd = mkProd(userCol.id, { name: 'User item' });

    store.updateProduct(inWinter[0].id, input(winter.id, { name: 'Edited' })); // edited
    store.setProductStatus(inWinter[1].id, 'Ready'); // status changed
    store.updateProduct(inSpring[0].id, input(userCol.id, { name: 'Moved out' })); // demo -> user collection
    store.updateProduct(userProd.id, input(spring.id, { name: 'User item' })); // user -> demo collection

    store.clearDemoData();
    const d = store.getData();
    const keep = [inWinter[0].id, inWinter[1].id, inSpring[0].id, userProd.id];
    expect(ids().sort()).toEqual([...keep].sort());
    // collections holding user-owned products survive (and are no longer demo)
    expect(d.collections.map((c) => c.id).sort()).toEqual([winter.id, spring.id, userCol.id].sort());
    expect(d.collections.every((c) => !c.isDemo)).toBe(true);
    expect(d.products.find((p) => p.id === userProd.id)!.collectionId).toBe(spring.id);
    expect(d.products.find((p) => p.id === inSpring[0].id)!.collectionId).toBe(userCol.id);
    // persisted
    expect(createPlannerStore(mem).getData().products.map((p) => p.id).sort()).toEqual([...keep].sort());
  });

  it('removes a demo collection entirely when nothing in it was touched', () => {
    const { winter, spring, inSpring } = demoSetup();
    store.setProductStatus(inSpring[0].id, 'Ready');
    store.clearDemoData();
    const d = store.getData();
    expect(d.collections.map((c) => c.id)).toEqual([spring.id]);
    expect(d.collections.some((c) => c.id === winter.id)).toBe(false);
    expect(ids()).toEqual([inSpring[0].id]);
  });
});

describe('deleteProduct', () => {
  it('deletes and persists', () => {
    const c = mkCol();
    const p = mkProd(c.id);
    const keep = mkProd(c.id, { name: 'Keep' });
    store.deleteProduct(p.id);
    expect(ids()).toEqual([keep.id]);
    expect(createPlannerStore(mem).getData().products.map((x) => x.id)).toEqual([keep.id]);
    function ids() { return store.getData().products.map((x) => x.id); }
  });

  it('unknown id is a no-op and does not notify', () => {
    const c = mkCol();
    mkProd(c.id);
    const before = snapshot();
    const listener = vi.fn();
    store.subscribe(listener);
    store.deleteProduct('nope');
    expect(listener).not.toHaveBeenCalled();
    expect(snapshot()).toBe(before);
  });
});

describe('countProductsByCollection', () => {
  it('stays accurate after add, move and delete', () => {
    const a = mkCol('A');
    const b = mkCol('B');
    const p1 = mkProd(a.id);
    const p2 = mkProd(a.id, { name: 'Two' });
    const count = () => countProductsByCollection(store.getData().products);
    expect(count()).toEqual({ [a.id]: 2 });
    store.updateProduct(p1.id, input(b.id));
    expect(count()).toEqual({ [a.id]: 1, [b.id]: 1 });
    store.deleteProduct(p2.id);
    expect(count()[a.id] ?? 0).toBe(0);
    expect(count()[b.id]).toBe(1);
    store.deleteProduct(p1.id);
    expect(count()).toEqual({});
  });
});

describe('persistence of product changes', () => {
  it('survives store re-creation from the same storage', () => {
    const a = mkCol('A');
    const b = mkCol('B');
    const p = mkProd(a.id);
    store.updateProduct(p.id, input(b.id, { name: 'Moved' }));
    store.setProductStatus(p.id, 'Sample');
    const again = createPlannerStore(mem);
    expect(again.getPersistence()).toBe('persistent');
    expect(again.getData().products[0]).toMatchObject({ name: 'Moved', collectionId: b.id, status: 'Sample' });
  });

  it('reports failed when setItem throws after a product change, keeping memory state', () => {
    const c = mkCol();
    const p = mkProd(c.id);
    expect(store.getPersistence()).toBe('persistent');
    mem.failSet = true;
    store.setProductStatus(p.id, 'Ready');
    expect(store.getPersistence()).toBe('failed');
    expect(store.getData().products[0].status).toBe('Ready');
    mem.failSet = false;
    store.deleteProduct(p.id);
    expect(store.getPersistence()).toBe('persistent');
  });

  it('reports failed for updateProduct and deleteProduct writes too', () => {
    const c = mkCol();
    const p = mkProd(c.id);
    mem.failSet = true;
    store.updateProduct(p.id, input(c.id, { name: 'X' }));
    expect(store.getPersistence()).toBe('failed');
    mem.failSet = false;
    store.updateProduct(p.id, input(c.id, { name: 'Y' }));
    mem.failSet = true;
    store.deleteProduct(p.id);
    expect(store.getPersistence()).toBe('failed');
  });

  it('reports unavailable without storage and never claims persistent', () => {
    const s = createPlannerStore(null);
    const col = s.addCollection({ name: 'A' });
    if (!col.ok) throw new Error();
    s.addProduct(input(col.value.id));
    expect(s.getPersistence()).toBe('unavailable');
  });
});
