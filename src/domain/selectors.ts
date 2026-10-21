import { STATUSES } from './types';
import type { Product, Status } from './types';

/** Number of products per collection id. Collections with no products are absent (read with `?? 0`). */
export function countProductsByCollection(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of products) counts[p.collectionId] = (counts[p.collectionId] ?? 0) + 1;
  return counts;
}

/** Product count per status; all four statuses are always present. */
export function countProductsByStatus(products: Product[]): Record<Status, number> {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const p of products) if (p.status in counts) counts[p.status] += 1;
  return counts;
}
