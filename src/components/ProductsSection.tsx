import type { Collection, PlannerStore, Product } from '../domain';
import { ProductList } from './ProductList';

interface Props {
  store: PlannerStore;
  collection: Collection;
  collections: Collection[];
  products: Product[];
}

export function ProductsSection({ store, collection, collections, products }: Props) {
  return <ProductList store={store} collection={collection} collections={collections} products={products} />;
}
