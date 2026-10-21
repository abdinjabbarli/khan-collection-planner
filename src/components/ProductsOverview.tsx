import { useEffect, useId, useRef, useState } from 'react';
import type { AppData, PlannerStore, ProductFilters } from '../domain';
import {
  DEFAULT_FILTERS,
  PRODUCT_TYPES,
  STATUSES,
  countProductsByStatus,
  filterProducts,
  hasActiveFilters,
  normalizeFilters,
} from '../domain';
import { ProductList } from './ProductList';

interface Props {
  store: PlannerStore;
  data: AppData;
}

const plural = (n: number) => `${n} product${n === 1 ? '' : 's'}`;

export function ProductsOverview({ store, data }: Props) {
  const [raw, setRaw] = useState<ProductFilters>(DEFAULT_FILTERS);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const collectionSelectRef = useRef<HTMLSelectElement>(null);
  const [focusCollection, setFocusCollection] = useState(false);
  const ids = { c: useId(), t: useId(), s: useId() };

  const filters = normalizeFilters(raw, data.collections);
  const active = hasActiveFilters(filters);
  const matching = filterProducts(data.products, filters);
  const statusCounts = countProductsByStatus(data.products);
  const total = data.products.length;

  useEffect(() => {
    if (focusCollection) {
      collectionSelectRef.current?.focus();
      setFocusCollection(false);
    }
  }, [focusCollection]);

  const clear = () => {
    setRaw(DEFAULT_FILTERS);
    setFocusCollection(true);
  };

  let empty;
  if (total === 0) {
    empty = (
      <p className="empty-state">
        {data.collections.length === 0
          ? 'No products yet. Create a collection first.'
          : 'No products yet. Select a collection above and add your first product idea.'}
      </p>
    );
  } else {
    empty = (
      <div className="empty-state stack">
        <p>No products match these filters.</p>
        <button type="button" className="btn btn--secondary" onClick={clear}>
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <section className="card stack overview" aria-labelledby="overview-title">
      <h2 id="overview-title" ref={headingRef} tabIndex={-1}>
        All products
      </h2>
      <ul className="status-summary" aria-label="Products by status">
        {STATUSES.map((s) => (
          <li key={s} className={`status-summary__item badge badge--${s.toLowerCase()}`}>
            {s} {statusCounts[s]}
          </li>
        ))}
      </ul>
      <div className="filters" role="group" aria-label="Filter products">
        <div className="field">
          <label className="field__label" htmlFor={ids.c}>
            Collection
          </label>
          <select
            id={ids.c}
            ref={collectionSelectRef}
            className="field__control"
            value={filters.collectionId}
            onChange={(e) => setRaw({ ...filters, collectionId: e.target.value })}
          >
            <option value="all">All collections</option>
            {data.collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={ids.t}>
            Type
          </label>
          <select
            id={ids.t}
            className="field__control"
            value={filters.type}
            onChange={(e) => setRaw({ ...filters, type: e.target.value as ProductFilters['type'] })}
          >
            <option value="all">All types</option>
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={ids.s}>
            Status
          </label>
          <select
            id={ids.s}
            className="field__control"
            value={filters.status}
            onChange={(e) => setRaw({ ...filters, status: e.target.value as ProductFilters['status'] })}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn--secondary" disabled={!active} onClick={clear}>
          Clear filters
        </button>
      </div>
      <p className="filters__count" role="status">
        Showing {matching.length} of {plural(total)}
      </p>
      <ProductList
        store={store}
        collections={data.collections}
        products={matching}
        headingRef={headingRef}
        resetMessageKey={JSON.stringify(filters)}
        showCollectionName
        matches={(p) => filterProducts([p], filters).length === 1}
        empty={empty}
      />
    </section>
  );
}
