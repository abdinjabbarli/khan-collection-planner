import { useId, useState } from 'react';
import { LIMITS, MODE_INFO, formatColourForProduct } from '../domain';
import type { PaletteColour, PlannerStore, Product, SavedPalette as Saved } from '../domain';
import { ConfirmDialog } from './ConfirmDialog';
import { Swatches } from './Swatches';

interface Props {
  store: PlannerStore;
  palette: Saved;
  products: Product[];
}

/** Shows a saved palette from local data (no API request) and lets the user apply one colour to a product. */
export function SavedPalette({ store, palette, products }: Props) {
  const uid = useId();
  const [productId, setProductId] = useState('');
  const [pending, setPending] = useState<PaletteColour | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const product = products.find((p) => p.id === productId) ?? null;

  const apply = (colour: PaletteColour) => {
    if (!product) return;
    const r = store.applyPaletteColour(product.id, colour);
    if (r.ok) {
      setError('');
      setMessage(`Colour of "${product.name}" is now ${r.value.colour}.`);
    } else {
      setMessage('');
      setError(r.errors.colour ?? 'The colour could not be applied.');
    }
  };

  const onApplyClick = (colour: PaletteColour) => {
    if (!product) {
      setMessage('');
      setError('Choose a product first.');
      return;
    }
    if (product.colour.trim()) setPending(colour);
    else apply(colour);
  };

  return (
    <section className="saved-palette stack" aria-labelledby={`${uid}-title`}>
      <h4 id={`${uid}-title`}>Saved palette</h4>
      <p className="saved-palette__meta">
        {MODE_INFO[palette.mode].label} from {palette.seedHex}. Saved {new Date(palette.savedAt).toLocaleDateString('en-GB')}.
        Digital suggestion only, not a verified fabric or print match. Powered by The Color API.
      </p>
      <Swatches
        colours={palette.colours}
        label="Saved palette"
        renderAction={(c) => (
          <button
            type="button"
            className="btn btn--secondary swatch__apply"
            onClick={() => onApplyClick(c)}
            aria-label={`Apply ${c.name} ${c.hex} to chosen product`}
          >
            Apply
          </button>
        )}
      />
      {products.length === 0 ? (
        <p className="field__hint">Add a product to this collection to apply a palette colour to it.</p>
      ) : (
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-product`}>
            Apply to product
          </label>
          <select
            id={`${uid}-product`}
            className="field__control"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setMessage('');
              setError('');
            }}
          >
            <option value="">Choose a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="field__hint">
            Nothing changes until you press Apply. The colour field holds up to {LIMITS.colour} characters; long names are shortened.
          </p>
        </div>
      )}
      <p role="status">{message}</p>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={pending !== null}
        title="Replace product colour?"
        description={
          pending && product
            ? `"${product.name}" currently has the colour "${product.colour}". Replace it with "${formatColourForProduct(pending, LIMITS.colour)}"?`
            : ''
        }
        confirmLabel="Replace colour"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const c = pending;
          setPending(null);
          if (c) apply(c);
        }}
      />
    </section>
  );
}
