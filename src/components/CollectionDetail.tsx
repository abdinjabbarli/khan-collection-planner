import { useEffect, useRef, useState } from 'react';
import type { Collection, PlannerStore } from '../domain';
import { CollectionForm } from './CollectionForm';
import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  store: PlannerStore;
  collection: Collection;
  productCount: number;
  onDeleted: (name: string) => void;
}

const plural = (n: number) => `${n} product${n === 1 ? '' : 's'}`;

export function CollectionDetail({ store, collection, productCount, onDeleted }: Props) {
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [returnToRename, setReturnToRename] = useState(false);
  const renameBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (returnToRename && !renaming) {
      renameBtnRef.current?.focus();
      setReturnToRename(false);
    }
  }, [returnToRename, renaming]);

  const stopRenaming = () => {
    setRenaming(false);
    setReturnToRename(true);
  };

  return (
    <section className="collection-detail card stack" aria-labelledby="collection-detail-title">
      <div className="collection-detail__header">
        {renaming ? (
          <>
            <CollectionForm
              label="Collection name"
              submitLabel="Save"
              initialValue={collection.name}
              autoFocus
              onCancel={stopRenaming}
              onSubmit={(name) => {
                const r = store.renameCollection(collection.id, name);
                if (!r.ok) return r.errors.name ?? 'Enter a valid collection name.';
                stopRenaming();
                return null;
              }}
            />
          </>
        ) : (
          <>
            <h3 id="collection-detail-title">{collection.name}</h3>
            <div className="collection-detail__actions">
              <button ref={renameBtnRef} type="button" className="btn btn--secondary" onClick={() => setRenaming(true)}>
                Rename
              </button>
              <button type="button" className="btn btn--danger" onClick={() => setConfirming(true)}>
                Delete collection
              </button>
            </div>
          </>
        )}
      </div>
      {collection.isDemo && <p className="collection-item__demo">Demo (sample content)</p>}
      <p>{plural(productCount)}</p>
      {productCount === 0 && (
        <p className="empty-state">No products in this collection yet. Adding products arrives in the next update.</p>
      )}
      <ConfirmDialog
        open={confirming}
        title="Delete collection?"
        description={`Delete "${collection.name}"? This will also delete ${plural(productCount)} in it. This cannot be undone.`}
        confirmLabel="Delete collection"
        danger
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          store.deleteCollection(collection.id);
          onDeleted(collection.name);
        }}
      />
    </section>
  );
}
