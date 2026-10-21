import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

interface Props {
  label: string;
  submitLabel: string;
  initialValue?: string;
  /** Returns an error message, or null on success. */
  onSubmit: (name: string) => string | null;
  onCancel?: () => void;
  /** Focus the input on mount (used by rename). */
  autoFocus?: boolean;
  /** Clear the input after a successful submit (used by create). */
  resetOnSuccess?: boolean;
}

export function CollectionForm({
  label,
  submitLabel,
  initialValue = '',
  onSubmit,
  onCancel,
  autoFocus = false,
  resetOnSuccess = false,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [autoFocus]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = onSubmit(value);
    if (err) {
      setError(err);
      inputRef.current?.focus();
    } else {
      setError(null);
      if (resetOnSuccess) setValue('');
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form className="collection-form" onSubmit={submit} onKeyDown={onKeyDown} noValidate>
      <div className="field">
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          className="field__control"
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
        />
        <p className="field__hint" id={hintId}>
          Up to 40 characters
        </p>
        {error && (
          <p className="field__error" id={errorId}>
            {error}
          </p>
        )}
      </div>
      <div className="cluster">
        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
