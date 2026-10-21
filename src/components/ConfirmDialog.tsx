import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Generic confirmation dialog on a native <dialog>. Cancel receives initial focus.
 * Cancel and Esc return focus to the element that opened the dialog. After a confirm the
 * caller decides where focus goes.
 */
export function ConfirmDialog({ open, title, description, confirmLabel, danger = false, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(open);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    openRef.current = open;
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      cancelRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const cancel = () => {
    const trigger = triggerRef.current;
    onCancel();
    if (trigger && trigger.isConnected) trigger.focus();
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClose={() => {
        // Only a user-initiated close (Esc) while still open counts as cancel.
        if (openRef.current) cancel();
      }}
    >
      <div className="stack">
        <h2 id={titleId}>{title}</h2>
        <p id={descId}>{description}</p>
        <div className="dialog__actions">
          <button type="button" ref={cancelRef} className="btn btn--secondary" autoFocus onClick={cancel}>
            Cancel
          </button>
          <button type="button" className={danger ? 'btn btn--danger' : 'btn btn--primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
