import type {
  AppData,
  Collection,
  Product,
  ProductFilters,
  ValidationErrors,
} from './types';

/**
 * Persistence status shown to the user. The UI must NEVER say data is "saved"
 * unless this is 'persistent'.
 *  - persistent:  localStorage works and the last write succeeded
 *  - unavailable: localStorage is blocked/unsupported; changes live in memory only
 *  - failed:      a write threw (e.g. quota); the latest change may be lost
 *  - recovered:   stored data was corrupt/unreadable and was ignored
 */
export type PersistenceStatus = 'persistent' | 'unavailable' | 'failed' | 'recovered';

export interface CollectionInput {
  name: string;
}
export interface ProductInput {
  collectionId: string;
  name: string;
  type: string;
  colour: string;
  notes: string;
  status: string;
}

export type Result<T, K extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationErrors<K> };

/** The contract the UI codes against. Implemented in src/domain (Data & Logic agent). */
export interface PlannerStore {
  getData(): AppData;
  getPersistence(): PersistenceStatus;
  subscribe(listener: () => void): () => void;

  addCollection(input: CollectionInput): Result<Collection, 'name'>;
  renameCollection(id: string, name: string): Result<Collection, 'name'>;
  /** Also deletes the collection's products. */
  deleteCollection(id: string): void;

  addProduct(input: ProductInput): Result<Product, keyof ProductInput>;
  updateProduct(id: string, input: ProductInput): Result<Product, keyof ProductInput>;
  deleteProduct(id: string): void;

  /** Adds demo records (isDemo: true) and marks onboarded. Never touches user records. */
  loadDemoData(): void;
  /** Removes ONLY records with isDemo === true. User-created records are preserved. */
  clearDemoData(): void;
  /** Marks onboarded without adding anything ("Start empty"). */
  startEmpty(): void;
  /** Wipes everything. The UI must obtain explicit confirmation before calling. */
  resetAll(): void;
}

export type FilterFn = (products: Product[], filters: ProductFilters) => Product[];
