import { useEffect, useRef, useState } from 'react';
import type { Collection, PlannerStore, Product, ProductInput } from '../domain';
import { ConfirmDialog } from './ConfirmDialog';
import { ProductCard } from './ProductCard';
import { ProductForm } from './ProductForm';

interface Props {
  store: PlannerStore;
  collection: Collection;
  collections: Collection[];
  products: Product[];
}

type Focus = { kind: 'heading' } | { kind: 'edit' | 'add'; id?: string };

export function ProductsSection({ store, collection, collections, products }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [focus, setFocus] = useState<Focus | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

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
    collectionId: collection.id,
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
            setFocus(r.value.collectionId === collection.id ? { kind: 'edit', id: r.value.id } : { kind: 'heading' });
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
    <section ref={rootRef} className="products stack" aria-labelledby="products-heading">
      <div className="products__header">
        <h4 id="products-heading" ref={headingRef} tabIndex={-1}>
          Products
        </h4>
        {!adding && addButton}
      </div>
      <p role="status">{message}</p>
      {renderForm()}
      {products.length === 0 && !adding ? (
        <div className="empty-state stack">
          <p>No products in "{collection.name}" yet. Add your first product idea.</p>
          {addButton}
        </div>
      ) : (
        <ul className="product-list">
          {products.map((p) =>
            p.id === editingId && editing ? (
              <li key={p.id} className="product-form__full">
                <ProductForm
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
                    if (r.value.collectionId !== collection.id) {
                      setMessage(`Moved "${r.value.name}" to "${collectionName(r.value.collectionId)}"`);
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
                onStatusChange={(prod, status) => {
                  const r = store.setProductStatus(prod.id, status);
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
        description={deleting ? `Delete "${deleting.name}" from "${collection.name}"? This cannot be undone.` : ''}
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
