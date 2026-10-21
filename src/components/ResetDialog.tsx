import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  collections: number;
  products: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetDialog({ open, collections, products, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="reset-title"
      aria-describedby="reset-desc"
      onClose={onCancel}
    >
      <div className="stack">
        <h2 id="reset-title">Delete all data?</h2>
        <p id="reset-desc">
          This will permanently delete all {collections} collection{collections === 1 ? '' : 's'} and{' '}
          {products} product{products === 1 ? '' : 's'}, including your own items and any demo data. This
          cannot be undone.
        </p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--secondary" autoFocus onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            Delete everything
          </button>
        </div>
      </div>
    </dialog>
  );
}
