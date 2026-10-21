import { useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { Collection, PlannerStore, Product, ProductInput } from '../domain';
import { ConfirmDialog } from './ConfirmDialog';
import { ProductCard } from './ProductCard';
import { ProductForm } from './ProductForm';

interface Props {
  store: PlannerStore;
  /** Collection mode: the selected collection. Enables the "Products" heading and Add product. */
  collection?: Collection;
  collections: Collection[];
  products: Product[];
  /** Overview mode: the parent's heading; focus moves here after delete or move. */
  headingRef?: RefObject<HTMLElement | null>;
  /** Overview mode: show the collection name on cards. */
  showCollectionName?: boolean;
  /** Overview mode: whether a product still belongs in the (filtered) list. */
  matches?: (product: Product) => boolean;
  /** Overview mode: content shown when the list is empty. */
  empty?: ReactNode;
}

type Focus = { kind: 'heading' } | { kind: 'edit' | 'add'; id?: string };

export function ProductList({
  store,
  collection,
  collections,
  products,
  headingRef: externalHeadingRef,
  showCollectionName,
  matches,
  empty,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [focus, setFocus] = useState<Focus | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const ownHeadingRef = useRef<HTMLHeadingElement>(null);
  const headingRef = externalHeadingRef ?? ownHeadingRef;
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const headingLevel = collection ? 5 : 3;
  const collectionName = (id: string) => collections.find((c) => c.id === id)?.name ?? '';

  useEffect(() => {
    if (!focus) return;
    if (focus.kind === 'heading') {
      headingRef.current?.focus();
      setFocus(null);
    } else if (focus.kind === 'add') {
      addBtnRef.current?.focus();
      setFocus(null);
    } else {
      const el = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('button[data-product-edit]') ?? []).find(
        (b) => b.dataset.productEdit === focus.id,
      );
      if (el) {
        el.focus();
        setFocus(null);
      }
    }
  }, [focus, products, adding, editingId]);

  const blank: ProductInput = {
    collectionId: collection?.id ?? '',
    name: '',
    type: 'T-shirt',
    colour: '',
    notes: '',
    status: 'Idea',
  };

  const editing = products.find((p) => p.id === editingId) ?? null;

  const renderForm = () => {
    if (adding) {
      return (
        <ProductForm
          headingLevel={headingLevel}
          heading="Add product"
          submitLabel="Add product"
          initial={blank}
          collections={collections}
          onCancel={() => {
            setAdding(false);
            setFocus({ kind: 'add' });
          }}
          onSubmit={(input) => {
            const r = store.addProduct(input);
            if (!r.ok) return r.errors;
            setAdding(false);
            setMessage(`Added "${r.value.name}"`);
            // The form may place it in another collection; then it leaves this list.
            setFocus(r.value.collectionId === collection?.id ? { kind: 'edit', id: r.value.id } : { kind: 'heading' });
            return null;
          }}
        />
      );
    }
    return null;
  };

  const addButton = (
    <button
      ref={addBtnRef}
      type="button"
      className="btn btn--primary"
      disabled={collections.length === 0}
      onClick={() => {
        setEditingId(null);
        setMessage('');
        setAdding(true);
      }}
    >
      Add product
    </button>
  );

  return (
    <section
      ref={rootRef}
      className={collection ? 'products stack' : 'stack'}
      aria-labelledby={collection ? 'products-heading' : undefined}
    >
      {collection && (
        <div className="products__header">
          <h4 id="products-heading" ref={ownHeadingRef} tabIndex={-1}>
            Products
          </h4>
          {!adding && addButton}
        </div>
      )}
      <p role="status">{message}</p>
      {renderForm()}
      {products.length === 0 && !adding ? (
        collection ? (
          <div className="empty-state stack">
            <p>No products in "{collection.name}" yet. Add your first product idea.</p>
            {addButton}
          </div>
        ) : (
          empty ?? null
        )
      ) : (
        <ul className="product-list">
          {products.map((p) =>
            p.id === editingId && editing ? (
              <li key={p.id} className="product-form__full">
                <ProductForm
                  headingLevel={headingLevel}
                  heading={`Edit ${p.name}`}
                  submitLabel="Update product"
                  initial={{
                    collectionId: p.collectionId,
                    name: p.name,
                    type: p.type,
                    colour: p.colour,
                    notes: p.notes,
                    status: p.status,
                  }}
                  collections={collections}
                  onCancel={() => {
                    setEditingId(null);
                    setFocus({ kind: 'edit', id: p.id });
                  }}
                  onSubmit={(input) => {
                    const r = store.updateProduct(p.id, input);
                    if (!r.ok) return r.errors;
                    setEditingId(null);
                    if (r.value.collectionId !== p.collectionId) {
                      setMessage(`Moved "${r.value.name}" to "${collectionName(r.value.collectionId)}"`);
                      setFocus({ kind: 'heading' });
                    } else if (matches && !matches(r.value)) {
                      setMessage(`Updated "${r.value.name}". It no longer matches the current filters.`);
                      setFocus({ kind: 'heading' });
                    } else {
                      setMessage(`Updated "${r.value.name}"`);
                      setFocus({ kind: 'edit', id: p.id });
                    }
                    return null;
                  }}
                />
              </li>
            ) : (
              <ProductCard
                key={p.id}
                product={p}
                headingLevel={headingLevel}
                collectionName={showCollectionName ? collectionName(p.collectionId) : undefined}
                onStatusChange={(prod, status) => {
                  const r = store.setProductStatus(prod.id, status);
                  if (r.ok && matches && !matches(r.value)) {
                    setMessage(`"${r.value.name}" is now ${r.value.status}. It no longer matches the current filters.`);
                    setFocus({ kind: 'heading' });
                    return;
                  }
                  setMessage(
                    r.ok ? `"${r.value.name}" is now ${r.value.status}` : (r.errors.status ?? 'Choose a valid status.'),
                  );
                }}
                onEdit={(prod) => {
                  setAdding(false);
                  setMessage('');
                  setEditingId(prod.id);
                }}
                onDelete={(prod) => setDeleting(prod)}
              />
            ),
          )}
        </ul>
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete product?"
        description={deleting ? `Delete "${deleting.name}" from "${collectionName(deleting.collectionId) || collection?.name || ''}"? This cannot be undone.` : ''}
        confirmLabel="Delete product"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          const name = deleting.name;
          setDeleting(null);
          store.deleteProduct(deleting.id);
          setMessage(`Deleted "${name}"`);
          setFocus({ kind: 'heading' });
        }}
      />
    </section>
  );
}
