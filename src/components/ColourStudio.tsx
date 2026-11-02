import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { COLOR_API_DOCS, MODE_INFO, PALETTE_MODES, fetchPalette, normalizeHex } from '../domain';
import type { AppData, PaletteColour, PaletteMode, PlannerStore } from '../domain';
import { ConfirmDialog } from './ConfirmDialog';
import { Swatches } from './Swatches';

interface Props {
  store: PlannerStore;
  data: AppData;
}

interface Generated {
  seedHex: string;
  mode: PaletteMode;
  colours: PaletteColour[];
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; palette: Generated }
  | { kind: 'error'; errorKind: string; message: string };

const DEFAULT_SEED = '#0047AB';

export function ColourStudio({ store, data }: Props) {
  const uid = useId();
  const [hexText, setHexText] = useState(DEFAULT_SEED);
  const [hexError, setHexError] = useState('');
  const [mode, setMode] = useState<PaletteMode>('analogic');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [targetId, setTargetId] = useState('');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  // Stale-response guard: only the latest request id may update state.
  const latest = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const hexRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const lastParams = useRef<{ hex: string; mode: PaletteMode } | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  // Move focus to the outcome so keyboard and screen-reader users land on it (Retry/Generate may unmount or change).
  useEffect(() => {
    if (phase.kind === 'success') resultRef.current?.focus();
    else if (phase.kind === 'error') errorRef.current?.focus();
  }, [phase]);

  const target = data.collections.find((c) => c.id === targetId) ?? data.collections[0] ?? null;
  const existing = target ? data.palettes.find((p) => p.collectionId === target.id) : undefined;

  const run = async (hex: string, m: PaletteMode) => {
    controller.current?.abort();
    const ctl = new AbortController();
    controller.current = ctl;
    const id = ++latest.current;
    lastParams.current = { hex, mode: m };
    setSaveMsg('');
    setSaveErr('');
    setPhase({ kind: 'loading' });
    const res = await fetchPalette({ hex, mode: m, signal: ctl.signal });
    if (id !== latest.current) return; // a newer request superseded this one
    if (res.ok) setPhase({ kind: 'success', palette: { seedHex: hex, mode: m, colours: res.colours } });
    else if (res.error.kind !== 'aborted')
      setPhase({ kind: 'error', errorKind: res.error.kind, message: res.error.message });
  };

  const generate = (e?: FormEvent) => {
    e?.preventDefault();
    const n = normalizeHex(hexText);
    if (!n.ok) {
      setHexError(n.error);
      hexRef.current?.focus();
      return;
    }
    setHexError('');
    setHexText(n.hex);
    void run(n.hex, mode);
  };

  const retry = () => {
    const p = lastParams.current;
    if (p) void run(p.hex, p.mode);
  };

  const onHexChange = (v: string) => {
    setHexText(v);
    if (hexError) setHexError('');
  };

  const pickerValue = (() => {
    const n = normalizeHex(hexText);
    return n.ok ? n.hex.toLowerCase() : DEFAULT_SEED.toLowerCase();
  })();

  const doSave = () => {
    if (phase.kind !== 'success' || !target) return;
    const r = store.savePalette({
      collectionId: target.id,
      seedHex: phase.palette.seedHex,
      mode: phase.palette.mode,
      colours: phase.palette.colours,
    });
    if (r.ok) {
      setSaveErr('');
      setSaveMsg(`Palette ${existing ? 'replaced' : 'added'} in "${target.name}". Open that collection to see it.`);
    } else {
      setSaveMsg('');
      setSaveErr(r.errors.collectionId ?? r.errors.palette ?? 'The palette could not be saved.');
    }
  };

  const onSaveClick = () => {
    if (existing) setConfirmReplace(true);
    else doSave();
  };

  const loading = phase.kind === 'loading';
  const hexErrId = `${uid}-hex-error`;
  const hexHintId = `${uid}-hex-hint`;

  return (
    <section className="studio card stack" aria-labelledby="studio-title">
      <h2 id="studio-title">Colour Studio</h2>
      <p>
        Pick a seed colour and a palette mode, then generate five matching colours. These are digital colour
        suggestions only, not verified fabric or print matches. Always check against physical samples.
      </p>

      <form className="studio__form stack" onSubmit={generate} noValidate>
        <div className="studio__seed">
          <div className="field">
            <label className="field__label" htmlFor={`${uid}-picker`}>
              Seed colour picker
            </label>
            <input
              id={`${uid}-picker`}
              className="studio__picker"
              type="color"
              value={pickerValue}
              onChange={(e) => onHexChange(e.target.value.toUpperCase())}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`${uid}-hex`}>
              Seed colour HEX
            </label>
            <input
              id={`${uid}-hex`}
              ref={hexRef}
              className="field__control"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={7}
              value={hexText}
              onChange={(e) => onHexChange(e.target.value)}
              aria-invalid={hexError ? 'true' : undefined}
              aria-describedby={[hexHintId, hexError ? hexErrId : ''].filter(Boolean).join(' ')}
            />
            <p className="field__hint" id={hexHintId}>
              Six digits, 0-9 and A-F, for example #0047AB. The colour picker follows this box once the HEX is valid.
            </p>
            {hexError && (
              <p className="field__error" id={hexErrId}>
                {hexError}
              </p>
            )}
          </div>
        </div>

        <fieldset className="studio__modes">
          <legend className="field__label">Palette mode</legend>
          {PALETTE_MODES.map((m) => (
            <label key={m} className="studio__mode">
              <input type="radio" name={`${uid}-mode`} value={m} checked={mode === m} onChange={() => setMode(m)} />
              <span>
                <strong>{MODE_INFO[m].label}</strong>
                <span className="studio__mode-desc">{MODE_INFO[m].description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="cluster">
          <button type="submit" className="btn btn--primary" aria-busy={loading}>
            {loading ? 'Generating…' : 'Generate palette'}
          </button>
        </div>
      </form>

      <div role="status" aria-live="polite" className="studio__status">
        {loading && 'Requesting a palette from The Color API…'}
        {phase.kind === 'success' && `Palette ready: ${phase.palette.colours.map((c) => `${c.name} ${c.hex}`).join(', ')}.`}
      </div>

      {phase.kind === 'error' && (
        <div className="studio__error" role="alert" tabIndex={-1} ref={errorRef}>
          <p>
            <strong>
              {phase.errorKind === 'timeout' ? 'Timed out. ' : phase.errorKind === 'invalid-response' ? 'Unexpected response. ' : 'Palette not generated. '}
            </strong>
            {phase.message} No palette was created.
          </p>
          <button type="button" className="btn btn--secondary" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {phase.kind === 'success' && (
        <div className="stack" aria-labelledby={`${uid}-result`} role="group">
          <h3 id={`${uid}-result`} ref={resultRef} tabIndex={-1}>
            {MODE_INFO[phase.palette.mode].label} palette from {phase.palette.seedHex}
          </h3>
          <Swatches colours={phase.palette.colours} label="Generated palette" />

          {data.collections.length === 0 ? (
            <p className="empty-state">Create a collection above to save this palette.</p>
          ) : (
            <div className="studio__save">
              <div className="field">
                <label className="field__label" htmlFor={`${uid}-target`}>
                  Save to collection
                </label>
                <select
                  id={`${uid}-target`}
                  className="field__control"
                  value={target?.id ?? ''}
                  onChange={(e) => {
                    setTargetId(e.target.value);
                    setSaveMsg('');
                    setSaveErr('');
                  }}
                >
                  {data.collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {existing && (
                  <p className="field__hint">This collection already has a saved palette. Saving will ask before replacing it.</p>
                )}
              </div>
              <button type="button" className="btn btn--primary" onClick={onSaveClick}>
                Save palette
              </button>
            </div>
          )}
          <p role="status">{saveMsg}</p>
          {saveErr && <p className="field__error" role="alert">{saveErr}</p>}
        </div>
      )}

      <p className="studio__source">
        Powered by{' '}
        <a href={COLOR_API_DOCS} target="_blank" rel="noopener noreferrer">
          The Color API
        </a>{' '}
        (documentation). Colours are requested only when you press “Generate palette”.
      </p>

      <ConfirmDialog
        open={confirmReplace}
        title="Replace saved palette?"
        description={`"${target?.name ?? ''}" already has a saved palette. Replace it with this new one? The old palette will be lost.`}
        confirmLabel="Replace palette"
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => {
          setConfirmReplace(false);
          doSave();
        }}
      />
    </section>
  );
}
