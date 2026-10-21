import { useEffect, useRef, useState } from 'react';
import type { AppData, PlannerStore } from '../domain';
import { countProductsByCollection } from '../domain';
import { CollectionDetail } from './CollectionDetail';
import { CollectionForm } from './CollectionForm';

interface Props {
  store: PlannerStore;
  data: AppData;
}

const plural = (n: number) => `${n} product${n === 1 ? '' : 's'}`;

export function CollectionsPanel({ store, data }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [focusHeading, setFocusHeading] = useState(false);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const counts = countProductsByCollection(data.products);
  // Selection is UI state; if the record vanished (delete, remove demo, reset) it resolves to none.
  const selected = data.collections.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (focusHeading) {
      headingRef.current?.focus();
      setFocusHeading(false);
    }
  }, [focusHeading]);

  useEffect(() => {
    if (focusItemId) {
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button[data-collection-id]');
      buttons?.forEach((b) => {
        if (b.dataset.collectionId === focusItemId) b.focus();
      });
      setFocusItemId(null);
    }
  }, [focusItemId, data.collections]);

  return (
    <section className="card stack" aria-labelledby="collections-title">
      <h2 id="collections-title" ref={headingRef} tabIndex={-1}>
        Collections
      </h2>
      <p role="status">{message}</p>
      <CollectionForm
        label="New collection name"
        submitLabel="Create collection"
        resetOnSuccess
        onSubmit={(name) => {
          const r = store.addCollection({ name });
          if (!r.ok) return r.errors.name ?? 'Enter a valid collection name.';
          setSelectedId(r.value.id);
          setFocusItemId(r.value.id);
          setMessage('');
          return null;
        }}
      />
      <div className="collections-layout">
        {data.collections.length === 0 ? (
          <p className="empty-state">No collections yet. Create your first one, for example "Winter Drop".</p>
        ) : (
          <ul className="collection-list" ref={listRef}>
            {data.collections.map((c) => {
              const isSelected = c.id === selected?.id;
              return (
                <li key={c.id} className={isSelected ? 'collection-item collection-item--selected' : 'collection-item'}>
                  <button
                    type="button"
                    className="collection-item__select"
                    data-collection-id={c.id}
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => {
                      setSelectedId(c.id);
                      setMessage('');
                    }}
                  >
                    <span className="collection-item__name">{c.name}</span>
                    <span className="collection-item__count">{plural(counts[c.id] ?? 0)}</span>
                    {c.isDemo && <span className="collection-item__demo">Demo</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {selected ? (
          <CollectionDetail
            key={selected.id}
            store={store}
            collection={selected}
            collections={data.collections}
            products={data.products.filter((p) => p.collectionId === selected.id)}
            productCount={counts[selected.id] ?? 0}
            onDeleted={(name) => {
              setSelectedId(null);
              setMessage(`Collection "${name}" deleted`);
              setFocusHeading(true);
            }}
          />
        ) : (
          <p className="empty-state">Select a collection to see its details.</p>
        )}
      </div>
    </section>
  );
}
