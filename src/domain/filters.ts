import { PRODUCT_TYPES, STATUSES } from './types';
import type { Collection, Product, ProductFilters } from './types';

/** AND semantics: a product must match every non-'all' filter. */
export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  return products.filter(
    (p) =>
      (filters.collectionId === 'all' || p.collectionId === filters.collectionId) &&
      (filters.type === 'all' || p.type === filters.type) &&
      (filters.status === 'all' || p.status === filters.status),
  );
}

export const DEFAULT_FILTERS: ProductFilters = Object.freeze({
  collectionId: 'all',
  type: 'all',
  status: 'all',
}) as ProductFilters;

export function hasActiveFilters(filters: ProductFilters): boolean {
  return filters.collectionId !== 'all' || filters.type !== 'all' || filters.status !== 'all';
}

/** Returns a new object; unknown collection/type/status values become 'all'. */
export function normalizeFilters(filters: ProductFilters, collections: Collection[]): ProductFilters {
  const collectionId =
    typeof filters.collectionId === 'string' && collections.some((c) => c.id === filters.collectionId)
      ? filters.collectionId
      : 'all';
  const type = (PRODUCT_TYPES as readonly string[]).includes(filters.type) ? filters.type : 'all';
  const status = (STATUSES as readonly string[]).includes(filters.status) ? filters.status : 'all';
  return { collectionId, type, status };
}
