import type { Collection, Product, ProductType, Status } from './types';

interface DemoProduct {
  name: string;
  type: ProductType;
  colour: string;
  notes: string;
  status: Status;
}
interface DemoCollection {
  name: string;
  products: DemoProduct[];
}

export const DEMO_COLLECTIONS: DemoCollection[] = [
  {
    name: 'Winter Drop (demo)',
    products: [
      { name: 'Heavyweight Hoodie', type: 'Hoodie', colour: 'Charcoal', notes: 'Brushed fleece, kangaroo pocket.', status: 'Ready' },
      { name: 'Quilted Jacket', type: 'Jacket', colour: 'Black', notes: 'Waiting on zip samples.', status: 'Sample' },
      { name: 'Crew Sweatshirt', type: 'Sweatshirt', colour: 'Oat', notes: '', status: 'Design' },
      { name: 'Wool Beanie', type: 'Accessory', colour: 'Forest green', notes: 'Embroidered logo patch.', status: 'Idea' },
    ],
  },
  {
    name: 'Spring Capsule (demo)',
    products: [
      { name: 'Logo Tee', type: 'T-shirt', colour: 'White', notes: 'Organic cotton.', status: 'Ready' },
      { name: 'Linen Shorts', type: 'Shorts', colour: 'Sand', notes: '', status: 'Design' },
      { name: 'Relaxed Pants', type: 'Pants', colour: 'Olive', notes: 'Check inseam length.', status: 'Sample' },
      { name: 'Tote Bag', type: 'Other', colour: 'Natural', notes: 'Merch giveaway idea.', status: 'Idea' },
    ],
  },
];

/** Builds fresh demo records (all isDemo: true). */
export function buildDemoRecords(
  newId: () => string,
  now: string,
  skipNames: Set<string>,
): { collections: Collection[]; products: Product[] } {
  const collections: Collection[] = [];
  const products: Product[] = [];
  for (const dc of DEMO_COLLECTIONS) {
    if (skipNames.has(dc.name.toLowerCase())) continue;
    const id = newId();
    collections.push({ id, name: dc.name, createdAt: now, isDemo: true });
    for (const p of dc.products) {
      products.push({ ...p, id: newId(), collectionId: id, createdAt: now, updatedAt: now, isDemo: true });
    }
  }
  return { collections, products };
}
