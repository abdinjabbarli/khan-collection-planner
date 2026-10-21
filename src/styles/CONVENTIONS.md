# Styling conventions (shared contract)

Plain CSS, no framework. Files live in `src/styles/`; `src/styles/index.css` imports the rest and is imported once from `src/main.tsx`.

## Tokens (defined in `tokens.css` on `:root`)

| Token | Value | Use |
|---|---|---|
| `--color-cream` | `#f6f0e4` | page background |
| `--color-cream-deep` | `#ece3d0` | panels, hover, borders-on-cream |
| `--color-charcoal` | `#2b2b2b` | body text |
| `--color-espresso` | `#4a3326` | headings, secondary buttons, header |
| `--color-burgundy` | `#6d1a2c` | primary actions, accents, focus ring |
| `--color-white` | `#fffdf8` | cards, inputs |
| `--color-danger` | `#8a1c1c` | errors, destructive actions |

Also: `--space-1..6` (4px scale), `--radius-sm/md`, `--font-body`, `--font-heading`, `--shadow-card`, `--focus-ring`.
System font stacks only (no external font requests).

## Naming

- BEM-lite, prefix-free: `.block`, `.block__element`, `.block--modifier`.
- Layout helpers: `.container`, `.stack` (vertical gap), `.cluster` (horizontal wrap gap).
- Components own their block name: `.app-header`, `.storage-notice`, `.btn`, `.field`, `.card`, `.badge`, `.dialog`, `.empty-state`.
- Buttons: `.btn` + `.btn--primary | .btn--secondary | .btn--danger | .btn--ghost`.
- Status badges: `.badge` + `.badge--idea | --design | --sample | --ready`. Always render the status text, never colour alone.
- Form fields: `.field > label.field__label + control.field__control + .field__hint + .field__error`.
  Errors use `role`-free text linked with `aria-describedby`; invalid controls get `aria-invalid="true"`.
- Storage notice variants: `.storage-notice--ok | --warning`.

## Rules

- Mobile first; breakpoints `min-width: 40rem` and `64rem`. No horizontal scroll at 360px.
- Minimum text contrast AA (4.5:1). Visible `:focus-visible` ring on every interactive element.
- Touch targets at least 44px tall.
- Respect `prefers-reduced-motion`.
