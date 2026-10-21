import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { LIMITS, PRODUCT_TYPES, STATUSES } from '../domain';
import type { Collection, ProductInput, ValidationErrors } from '../domain';

type FieldKey = keyof ProductInput;
type FieldEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface Props {
  heading: string;
  submitLabel: string;
  initial: ProductInput;
  collections: Collection[];
  /** Returns the store's validation errors, or null on success. */
  onSubmit: (input: ProductInput) => ValidationErrors<FieldKey> | null;
  onCancel: () => void;
  headingLevel?: 3 | 5;
}

const FIELD_ORDER: FieldKey[] = ['name', 'type', 'colour', 'notes', 'status', 'collectionId'];

export function ProductForm({ heading, submitLabel, initial, collections, onSubmit, onCancel, headingLevel = 5 }: Props) {
  const Heading = headingLevel === 3 ? 'h3' : 'h5';
  const [values, setValues] = useState<ProductInput>(initial);
  const [errors, setErrors] = useState<ValidationErrors<FieldKey>>({});
  const refs = useRef<Partial<Record<FieldKey, FieldEl | null>>>({});
  const uid = useId();
  const headingId = `${uid}-heading`;
  const id = (k: FieldKey) => `${uid}-${k}`;
  const errId = (k: FieldKey) => `${uid}-${k}-error`;

  useEffect(() => {
    refs.current.name?.focus();
  }, []);

  const set = (k: FieldKey, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = onSubmit(values);
    if (result) {
      setErrors(result);
      const first = FIELD_ORDER.find((k) => result[k]);
      if (first) refs.current[first]?.focus();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const describe = (k: FieldKey, extra?: string) =>
    [extra, errors[k] ? errId(k) : undefined].filter(Boolean).join(' ') || undefined;
  const invalid = (k: FieldKey) => (errors[k] ? ('true' as const) : undefined);
  const error = (k: FieldKey) =>
    errors[k] ? (
      <p className="field__error" id={errId(k)}>
        {errors[k]}
      </p>
    ) : null;
  const reg = (k: FieldKey) => (el: FieldEl | null) => {
    refs.current[k] = el;
  };

  const notesLen = values.notes.length;
  const notesId = `${uid}-notes-counter`;

  return (
    <form className="product-form card" onSubmit={submit} onKeyDown={onKeyDown} noValidate aria-labelledby={headingId}>
      <Heading id={headingId}>{heading}</Heading>
      <div className="field product-form__full">
        <label className="field__label" htmlFor={id('name')}>
          Name
        </label>
        <input
          id={id('name')}
          ref={reg('name')}
          className="field__control"
          type="text"
          autoComplete="off"
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={invalid('name')}
          aria-describedby={describe('name', `${id('name')}-hint`)}
        />
        <p className="field__hint" id={`${id('name')}-hint`}>
          Required, up to {LIMITS.productName} characters
        </p>
        {error('name')}
      </div>
      <div className="field">
        <label className="field__label" htmlFor={id('type')}>
          Type
        </label>
        <select
          id={id('type')}
          ref={reg('type')}
          className="field__control"
          value={values.type}
          onChange={(e) => set('type', e.target.value)}
          aria-invalid={invalid('type')}
          aria-describedby={describe('type')}
        >
          {PRODUCT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {error('type')}
      </div>
      <div className="field">
        <label className="field__label" htmlFor={id('colour')}>
          Colour
        </label>
        <input
          id={id('colour')}
          ref={reg('colour')}
          className="field__control"
          type="text"
          autoComplete="off"
          value={values.colour}
          onChange={(e) => set('colour', e.target.value)}
          aria-invalid={invalid('colour')}
          aria-describedby={describe('colour', `${id('colour')}-hint`)}
        />
        <p className="field__hint" id={`${id('colour')}-hint`}>
          Optional, up to {LIMITS.colour} characters
        </p>
        {error('colour')}
      </div>
      <div className="field product-form__full">
        <label className="field__label" htmlFor={id('notes')}>
          Design notes
        </label>
        <textarea
          id={id('notes')}
          ref={reg('notes')}
          className="field__control"
          rows={5}
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          aria-invalid={invalid('notes')}
          aria-describedby={describe('notes', notesId)}
        />
        <p className="field__counter" id={notesId}>
          {notesLen} / {LIMITS.notes}
        </p>
        {error('notes')}
      </div>
      <div className="field">
        <label className="field__label" htmlFor={id('status')}>
          Status
        </label>
        <select
          id={id('status')}
          ref={reg('status')}
          className="field__control"
          value={values.status}
          onChange={(e) => set('status', e.target.value)}
          aria-invalid={invalid('status')}
          aria-describedby={describe('status')}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {error('status')}
      </div>
      <div className="field">
        <label className="field__label" htmlFor={id('collectionId')}>
          Collection
        </label>
        <select
          id={id('collectionId')}
          ref={reg('collectionId')}
          className="field__control"
          value={values.collectionId}
          onChange={(e) => set('collectionId', e.target.value)}
          aria-invalid={invalid('collectionId')}
          aria-describedby={describe('collectionId')}
        >
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {error('collectionId')}
      </div>
      <div className="product-form__actions product-form__full">
        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
