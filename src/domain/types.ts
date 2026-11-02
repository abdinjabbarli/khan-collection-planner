/** Shared data contracts. Owned by the main agent; specialists must not change them without approval. */

export const STATUSES = ['Idea', 'Design', 'Sample', 'Ready'] as const;
export type Status = (typeof STATUSES)[number];

export const PRODUCT_TYPES = [
  'T-shirt',
  'Hoodie',
  'Sweatshirt',
  'Jacket',
  'Pants',
  'Shorts',
  'Accessory',
  'Other',
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const LIMITS = {
  collectionName: 40,
  productName: 60,
  colour: 40,
  notes: 500,
} as const;

export interface Collection {
  id: string;
  name: string;
  createdAt: string; // ISO 8601
  /** true only for records created by "Load demo data" */
  isDemo: boolean;
}

export interface Product {
  id: string;
  collectionId: string;
  name: string;
  type: ProductType;
  colour: string;
  notes: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}

export const PALETTE_MODES = ['monochrome', 'analogic', 'complement'] as const;
export type PaletteMode = (typeof PALETTE_MODES)[number];

export interface PaletteColour {
  name: string;
  /** Upper-case "#RRGGBB" */
  hex: string;
}

/** A generated palette saved to a collection (at most one per collection). */
export interface SavedPalette {
  collectionId: string;
  seedHex: string;
  mode: PaletteMode;
  colours: PaletteColour[];
  savedAt: string; // ISO 8601
}

export interface AppData {
  version: 1;
  collections: Collection[];
  products: Product[];
  /** Added after v1 launch; absent in older saved data and read as []. */
  palettes: SavedPalette[];
  /** whether the first-visit choice (demo or empty) has been made */
  onboarded: boolean;
}

export const STORAGE_KEY = 'khan-planner:v1';

export const EMPTY_DATA: AppData = {
  version: 1,
  collections: [],
  products: [],
  palettes: [],
  onboarded: false,
};

export interface ProductFilters {
  collectionId: string | 'all';
  type: ProductType | 'all';
  status: Status | 'all';
}

export type ValidationErrors<K extends string> = Partial<Record<K, string>>;
