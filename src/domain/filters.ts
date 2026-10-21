import type { Product, ProductFilters } from './types';

/** AND semantics: a product must match every non-'all' filter. */
export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  return products.filter(
    (p) =>
      (filters.collectionId === 'all' || p.collectionId === filters.collectionId) &&
      (filters.type === 'all' || p.type === filters.type) &&
      (filters.status === 'all' || p.status === filters.status),
  );
}
