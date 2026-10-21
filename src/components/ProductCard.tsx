import { useId } from 'react';
import { STATUSES } from '../domain';
import type { Product } from '../domain';

interface Props {
  product: Product;
  onStatusChange: (product: Product, status: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductCard({ product, onStatusChange, onEdit, onDelete }: Props) {
  const selectId = useId();
  return (
    <li className="product-card">
      <div className="product-card__header">
        <h5 className="product-card__name">{product.name}</h5>
        <span className={`badge badge--${product.status.toLowerCase()}`}>{product.status}</span>
      </div>
      <p className="product-card__meta">
        {product.type}
        {product.colour ? `, ${product.colour}` : ''}
      </p>
      {product.notes && <p className="product-card__notes">{product.notes}</p>}
      <div className="product-card__footer">
        <div className="product-card__status">
          <label className="field__label" htmlFor={selectId}>
            Status<span className="sr-only"> for {product.name}</span>
          </label>
          <select
            id={selectId}
            className="field__control"
            data-product-status={product.id}
            value={product.status}
            onChange={(e) => onStatusChange(product, e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="product-card__actions">
          <button
            type="button"
            className="btn btn--secondary"
            data-product-edit={product.id}
            aria-label={`Edit ${product.name}`}
            onClick={() => onEdit(product)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn--danger"
            data-product-delete={product.id}
            aria-label={`Delete ${product.name}`}
            onClick={() => onDelete(product)}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
