import { ConfirmDialog } from './ConfirmDialog';

interface Props {
  open: boolean;
  collections: number;
  products: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetDialog({ open, collections, products, onCancel, onConfirm }: Props) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete all data?"
      description={`This will permanently delete all ${collections} collection${collections === 1 ? '' : 's'} and ${products} product${products === 1 ? '' : 's'}, including your own items and any demo data. This cannot be undone.`}
      confirmLabel="Delete everything"
      danger
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
