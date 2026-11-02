import { EMPTY_DATA, LIMITS, PALETTE_MODES, PRODUCT_TYPES, STATUSES } from './types';
import type { AppData, Collection, PaletteColour, Product, ProductType, SavedPalette, Status } from './types';
import type { CollectionInput, PersistenceStatus, PlannerStore, ProductInput, Result } from './store';
import { getDefaultStorage, loadFromStorage, saveToStorage } from './storage';
import { buildDemoRecords } from './demo';
import { formatColourForProduct, normalizeHex } from './colorApi';

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    /* fall back */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const emptyData = (): AppData => ({ ...EMPTY_DATA, collections: [], products: [], palettes: [] });

export function createPlannerStore(storage?: Storage | null): PlannerStore {
  const backing = storage === undefined ? getDefaultStorage() : storage;
  const loaded = loadFromStorage(backing);
  let data: AppData = loaded.data;
  let persistence: PersistenceStatus = loaded.persistence;
  const listeners = new Set<() => void>();

  function commit(next: AppData): void {
    data = next;
    if (persistence !== 'unavailable') {
      persistence = backing && saveToStorage(backing, data) ? 'persistent' : backing ? 'failed' : 'unavailable';
    }
    listeners.forEach((l) => l());
  }

  function validateCollectionName(raw: string, excludeId?: string): Result<string, 'name'> {
    const name = (raw ?? '').trim();
    if (!name) return { ok: false, errors: { name: 'Enter a collection name.' } };
    if (name.length > LIMITS.collectionName)
      return { ok: false, errors: { name: `Collection name must be ${LIMITS.collectionName} characters or fewer.` } };
    const lower = name.toLowerCase();
    if (data.collections.some((c) => c.id !== excludeId && c.name.toLowerCase() === lower))
      return { ok: false, errors: { name: 'A collection with this name already exists.' } };
    return { ok: true, value: name };
  }

  function validateProduct(
    input: ProductInput,
  ): { ok: true; value: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'isDemo'> } | { ok: false; errors: Partial<Record<keyof ProductInput, string>> } {
    const errors: Partial<Record<keyof ProductInput, string>> = {};
    const name = (input.name ?? '').trim();
    const colour = (input.colour ?? '').trim();
    const notes = (input.notes ?? '').trim();
    if (!name) errors.name = 'Enter a product name.';
    else if (name.length > LIMITS.productName) errors.name = `Product name must be ${LIMITS.productName} characters or fewer.`;
    if (!(PRODUCT_TYPES as readonly string[]).includes(input.type)) errors.type = 'Choose a product type from the list.';
    if (!(STATUSES as readonly string[]).includes(input.status)) errors.status = 'Choose a status from the list.';
    if (colour.length > LIMITS.colour) errors.colour = `Colour must be ${LIMITS.colour} characters or fewer.`;
    if (notes.length > LIMITS.notes) errors.notes = `Notes must be ${LIMITS.notes} characters or fewer.`;
    if (!input.collectionId) errors.collectionId = 'Choose a collection.';
    else if (!data.collections.some((c) => c.id === input.collectionId))
      errors.collectionId = 'That collection no longer exists. Choose another one.';
    if (Object.keys(errors).length) return { ok: false, errors };
    return {
      ok: true,
      value: {
        collectionId: input.collectionId,
        name,
        type: input.type as ProductType,
        colour,
        notes,
        status: input.status as Status,
      },
    };
  }

  return {
    getData: () => data,
    getPersistence: () => persistence,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    addCollection(input: CollectionInput) {
      const v = validateCollectionName(input?.name);
      if (!v.ok) return v;
      const c: Collection = { id: newId(), name: v.value, createdAt: new Date().toISOString(), isDemo: false };
      commit({ ...data, collections: [...data.collections, c] });
      return { ok: true, value: c };
    },
    renameCollection(id, name) {
      const existing = data.collections.find((c) => c.id === id);
      if (!existing) return { ok: false, errors: { name: 'That collection no longer exists.' } };
      const v = validateCollectionName(name, id);
      if (!v.ok) return v;
      const updated: Collection = { ...existing, name: v.value, isDemo: false };
      // Renaming adopts the whole collection: its demo products become the user's too,
      // so "Remove demo data" can never empty a collection the user has edited.
      commit({
        ...data,
        collections: data.collections.map((c) => (c.id === id ? updated : c)),
        products: data.products.map((pr) => (pr.collectionId === id ? { ...pr, isDemo: false } : pr)),
      });
      return { ok: true, value: updated };
    },
    deleteCollection(id) {
      if (!data.collections.some((c) => c.id === id)) return;
      commit({
        ...data,
        collections: data.collections.filter((c) => c.id !== id),
        products: data.products.filter((p) => p.collectionId !== id),
        palettes: data.palettes.filter((p) => p.collectionId !== id),
      });
    },
    savePalette(input) {
      if (!data.collections.some((c) => c.id === input?.collectionId))
        return { ok: false, errors: { collectionId: 'That collection no longer exists. Choose another one.' } };
      const seed = normalizeHex(input.seedHex);
      const colours: PaletteColour[] = [];
      for (const c of input.colours ?? []) {
        const h = normalizeHex(c?.hex ?? '');
        if (!h.ok || typeof c.name !== 'string' || !c.name.trim()) break;
        colours.push({ name: c.name.trim(), hex: h.hex });
      }
      if (!seed.ok || !(PALETTE_MODES as readonly string[]).includes(input.mode) || colours.length === 0 || colours.length !== input.colours.length)
        return { ok: false, errors: { palette: 'This palette is not valid and was not saved.' } };
      const saved: SavedPalette = {
        collectionId: input.collectionId,
        seedHex: seed.hex,
        mode: input.mode,
        colours,
        savedAt: new Date().toISOString(),
      };
      commit({
        ...data,
        collections: data.collections.map((c) => (c.id === input.collectionId ? { ...c, isDemo: false } : c)),
        products: data.products.map((p) => (p.collectionId === input.collectionId ? { ...p, isDemo: false } : p)),
        palettes: [...data.palettes.filter((p) => p.collectionId !== input.collectionId), saved],
      });
      return { ok: true, value: saved };
    },
    applyPaletteColour(productId, colour) {
      const existing = data.products.find((p) => p.id === productId);
      if (!existing) return { ok: false, errors: { colour: 'That product no longer exists.' } };
      const palette = data.palettes.find((p) => p.collectionId === existing.collectionId);
      if (!palette || !palette.colours.some((c) => c.hex === colour?.hex && c.name === colour?.name))
        return { ok: false, errors: { colour: 'That colour is not in this collection’s saved palette.' } };
      const updated: Product = {
        ...existing,
        colour: formatColourForProduct(colour, LIMITS.colour),
        updatedAt: new Date().toISOString(),
        isDemo: false,
      };
      commit({ ...data, products: data.products.map((p) => (p.id === productId ? updated : p)) });
      return { ok: true, value: updated };
    },

    addProduct(input) {
      const v = validateProduct(input);
      if (!v.ok) return v;
      const now = new Date().toISOString();
      const p: Product = { ...v.value, id: newId(), createdAt: now, updatedAt: now, isDemo: false };
      commit({ ...data, products: [...data.products, p] });
      return { ok: true, value: p };
    },
    updateProduct(id, input) {
      const existing = data.products.find((p) => p.id === id);
      if (!existing) return { ok: false, errors: { name: 'That product no longer exists.' } };
      const v = validateProduct(input);
      if (!v.ok) return v;
      const updated: Product = { ...existing, ...v.value, updatedAt: new Date().toISOString(), isDemo: false };
      commit({ ...data, products: data.products.map((p) => (p.id === id ? updated : p)) });
      return { ok: true, value: updated };
    },
    setProductStatus(id, status) {
      if (!(STATUSES as readonly string[]).includes(status))
        return { ok: false, errors: { status: 'Choose a status from the list.' } };
      const existing = data.products.find((p) => p.id === id);
      if (!existing) return { ok: false, errors: { status: 'That product no longer exists.' } };
      const updated: Product = { ...existing, status: status as Status, updatedAt: new Date().toISOString(), isDemo: false };
      commit({ ...data, products: data.products.map((p) => (p.id === id ? updated : p)) });
      return { ok: true, value: updated };
    },
    deleteProduct(id) {
      if (!data.products.some((p) => p.id === id)) return;
      commit({ ...data, products: data.products.filter((p) => p.id !== id) });
    },

    loadDemoData() {
      const skip = new Set(data.collections.map((c) => c.name.toLowerCase()));
      const demo = buildDemoRecords(newId, new Date().toISOString(), skip);
      commit({
        ...data,
        collections: [...data.collections, ...demo.collections],
        products: [...data.products, ...demo.products],
        onboarded: true,
      });
    },
    clearDemoData() {
      const hasUserProducts = (cid: string) => data.products.some((p) => p.collectionId === cid && !p.isDemo);
      const collections = data.collections
        .filter((c) => !c.isDemo || hasUserProducts(c.id))
        .map((c) => (c.isDemo ? { ...c, isDemo: false } : c));
      const kept = new Set(collections.map((c) => c.id));
      const products = data.products.filter((p) => !p.isDemo && kept.has(p.collectionId));
      const palettes = data.palettes.filter((p) => kept.has(p.collectionId));
      commit({ ...data, collections, products, palettes });
    },
    startEmpty() {
      commit({ ...data, onboarded: true });
    },
    resetAll() {
      commit(emptyData());
    },
  };
}
