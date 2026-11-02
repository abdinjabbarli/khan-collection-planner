import type { PaletteColour } from '../domain';

interface Props {
  colours: PaletteColour[];
  label: string;
  /** Optional per-colour action rendered under the HEX code. */
  renderAction?: (colour: PaletteColour) => React.ReactNode;
}

/** Swatches are plain CSS boxes. The name and HEX are always real text, never colour alone. */
export function Swatches({ colours, label, renderAction }: Props) {
  return (
    <ul className="swatches" aria-label={label}>
      {colours.map((c) => (
        <li key={`${c.hex}-${c.name}`} className="swatch">
          <span className="swatch__chip" style={{ backgroundColor: c.hex }} aria-hidden="true" />
          <span className="swatch__name">{c.name}</span>
          <span className="swatch__hex">{c.hex}</span>
          {renderAction?.(c)}
        </li>
      ))}
    </ul>
  );
}
