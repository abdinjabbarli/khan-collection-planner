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

## Additions by design-system (M0)

- Extra tokens: `--color-burgundy-dark` (hover), `--color-muted` (secondary text), `--color-border`, `--color-ok-bg/-text`, `--color-warning-bg/-text/-border`, `--color-{idea,design,sample,ready}-{bg,text}`, `--touch-target`, `--container-max`.
- Layout: `.stack--lg` (larger gap), `.page` (main region padding, grows to fill), `.page-grid` (1/2/3 columns at 0/40rem/64rem).
- Components: `.app-header__wordmark`, `.app-header__tagline`, `.app-footer`, `.dialog__actions` (button row), `.dialog` works on native `<dialog>` and styles `::backdrop`.
- `#root` is a flex column so `.page` pushes `.app-footer` to the bottom.

## M1 contract: collections (set by the main agent before parallel work)

Class names the UI Builder will use and the Design System must style (document any extras you add):

- `.collections-layout`: wrapper. Single column on mobile; two columns (list ~20rem + detail) from 64rem.
- `.collection-list`: the `<ul>` (no bullets, no padding, vertical gap).
- `.collection-item` (the `<li>`), `.collection-item--selected`.
- `.collection-item__select`: the full-width `<button>` inside the item (min 44px); selected item also has `aria-current="true"`.
- `.collection-item__name`, `.collection-item__count` (e.g. "3 products", muted), `.collection-item__demo` (small "Demo" tag, text always shown).
- `.collection-detail`: the detail panel; `.collection-detail__header` (title + actions, wraps on mobile), `.collection-detail__actions` (button row).
- `.collection-form`: inline form row for create/rename: a `.field` plus a `.btn` row; stacks on mobile, inline from 40rem.
- Reuse existing: `.card`, `.btn*`, `.field*`, `.empty-state`, `.badge`, `.dialog`, `.dialog__actions`, `.stack`, `.cluster`.

Behaviour rules (UI): selection is UI state only; creating a collection selects it; deleting the selected collection clears selection; focus is managed after create (to the new item's select button), rename (back to the Rename button), delete (to the "Collections" heading, `tabIndex=-1`). A shared `ConfirmDialog` is used by both delete-collection and reset-all.

Store rule (domain): renaming a collection with `isDemo: true` sets `isDemo: false`, because the user has edited it and "Remove demo data" must never delete it. Renaming only changes case/whitespace of the same name is allowed (uniqueness excludes the collection itself).

## Additions by design-system (M1)

- New file `collections.css` (imported from `index.css`) styles every M1 contract class. No new class names were introduced beyond the contract, except optional `.collection-form__actions` (button row inside `.collection-form`; `.cluster` inside the form also works).
- Selected item: `.collection-item--selected` or `[aria-current="true"]` on the select button (the `<li>` is matched via `:has`). Cues beyond colour: thicker burgundy left border, inset outline, and extra-bold name.
- Item border uses `--color-muted` (about 7:1 on white) to meet 3:1 non-text contrast.
- Long names wrap with `overflow-wrap: anywhere`; count and Demo tag never shrink.
- `.collection-detail__actions` goes full width on mobile with buttons sharing the row; `.empty-state` inside `.collection-detail` is supported.
