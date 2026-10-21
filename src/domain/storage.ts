import { EMPTY_DATA, PRODUCT_TYPES, STATUSES, STORAGE_KEY } from './types';
import type { AppData } from './types';
import type { PersistenceStatus } from './store';

const PROBE_KEY = `${STORAGE_KEY}:probe`;

/** Returns window.localStorage, or null when access is blocked or unsupported. */
export function getDefaultStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/** True only if a real write, read and remove round-trip works. */
export function probeStorage(storage: Storage | null): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PROBE_KEY, '1');
    const ok = storage.getItem(PROBE_KEY) === '1';
    storage.removeItem(PROBE_KEY);
    return ok;
  } catch {
    return false;
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
const str = (v: unknown): v is string => typeof v === 'string';

/** Validates the stored shape. Returns a clean AppData or null. */
export function parseAppData(raw: unknown): AppData | null {
  if (!isObj(raw) || raw.version !== 1) return null;
  if (!Array.isArray(raw.collections) || !Array.isArray(raw.products)) return null;
  if (typeof raw.onboarded !== 'boolean') return null;
  const ids = new Set<string>();
  const collections: AppData['collections'] = [];
  for (const c of raw.collections) {
    if (!isObj(c) || !str(c.id) || !str(c.name) || !str(c.createdAt) || typeof c.isDemo !== 'boolean') return null;
    ids.add(c.id);
    collections.push({ id: c.id, name: c.name, createdAt: c.createdAt, isDemo: c.isDemo });
  }
  const products: AppData['products'] = [];
  for (const p of raw.products) {
    if (
      !isObj(p) || !str(p.id) || !str(p.collectionId) || !str(p.name) ||
      !str(p.type) || !(PRODUCT_TYPES as readonly string[]).includes(p.type) ||
      !str(p.status) || !(STATUSES as readonly string[]).includes(p.status) ||
      !str(p.colour) || !str(p.notes) || !str(p.createdAt) || !str(p.updatedAt) ||
      typeof p.isDemo !== 'boolean' || !ids.has(p.collectionId)
    ) return null;
    products.push({
      id: p.id, collectionId: p.collectionId, name: p.name,
      type: p.type as AppData['products'][number]['type'],
      status: p.status as AppData['products'][number]['status'],
      colour: p.colour, notes: p.notes, createdAt: p.createdAt, updatedAt: p.updatedAt, isDemo: p.isDemo,
    });
  }
  return { version: 1, collections, products, onboarded: raw.onboarded };
}

export interface LoadResult {
  data: AppData;
  persistence: PersistenceStatus;
}

export function loadFromStorage(storage: Storage | null): LoadResult {
  const empty = (): AppData => ({ ...EMPTY_DATA, collections: [], products: [] });
  if (!probeStorage(storage)) return { data: empty(), persistence: 'unavailable' };
  let text: string | null;
  try {
    text = storage!.getItem(STORAGE_KEY);
  } catch {
    return { data: empty(), persistence: 'unavailable' };
  }
  if (text === null) return { data: empty(), persistence: 'persistent' };
  try {
    const data = parseAppData(JSON.parse(text));
    if (data) return { data, persistence: 'persistent' };
  } catch {
    /* fall through */
  }
  return { data: empty(), persistence: 'recovered' };
}

/** Returns true only if the write succeeded. */
export function saveToStorage(storage: Storage, data: AppData): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
