import type { Product } from './types';

/** Number of products per collection id. Collections with no products are absent (read with `?? 0`). */
export function countProductsByCollection(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of products) counts[p.collectionId] = (counts[p.collectionId] ?? 0) + 1;
  return counts;
}
