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

## M2 contract: products (set by the main agent before parallel work)

Store (domain): `setProductStatus(id, status)` added to `PlannerStore`; successful `updateProduct` / `setProductStatus` set `isDemo:false` on the product (see comment in `src/domain/store.ts`). Validation is unchanged (`LIMITS`, enums, collection must exist; errors keyed by `keyof ProductInput`).

Class names the UI Builder will use and the Design System must style (document extras you add):

- `.products` section wrapper inside `.collection-detail`; `.products__header` (h4 "Products" + "Add product" button, wraps on mobile).
- `.product-list`: the `<ul>`; 1 column on mobile, 2 columns from 40rem (inside the detail pane). No bullets.
- `.product-card` (the `<li>`): bordered card on `--color-white`. Parts: `.product-card__header` (name + status badge), `.product-card__name` (h5, wraps with overflow-wrap:anywhere), `.product-card__meta` (type and colour, muted), `.product-card__notes` (clamped to ~3 lines), `.product-card__footer`, `.product-card__status` (label + select, see below), `.product-card__actions` (Edit / Delete buttons).
- Status control on the card is a native `<select class="field__control">` with a visible-or-visually-hidden label "Status for <name>"; the status is also always shown as text through `.badge.badge--idea|design|sample|ready`. Never colour alone.
- `.product-form`: the add/edit form card. Fields stack on mobile and use 2 columns from 40rem; `.product-form__full` spans both columns (name, notes). `.product-form__actions` button row. Uses existing `.field`, `.field__label`, `.field__control`, `.field__hint`, `.field__error`; also style `textarea.field__control` (min 6rem tall, vertical resize) and `select.field__control`.
- `.field__counter`: small muted "123 / 500" counter shown under the notes field; turns the danger colour when over the limit.
- `.sr-only`: visually hidden but available to assistive tech (the Design System defines it in base.css if it is missing).
- Reuse: `.card`, `.btn*`, `.empty-state`, `.badge*`, `.stack`, `.cluster`, `.dialog*`.

Behaviour rules (UI):
- Products live inside the selected collection's detail panel (`CollectionDetail`). The product count there and in the list must come from `countProductsByCollection`.
- "Add product" opens `ProductForm` inline (collection preselected to the selected collection; also editable). Fields: Name (required, <=60), Type (select, PRODUCT_TYPES), Colour (<=40, optional), Design notes (textarea, <=500, optional, with counter), Status (select, STATUSES; default Idea), Collection (select). Errors from the store Result are shown inline per field, linked by `aria-describedby`, `aria-invalid="true"`, and the first invalid field is focused. Esc cancels. After a successful add: close the form, show a `role=status` message `Added "<name>"`, focus the new card's Edit button.
- Edit uses the same form prefilled in place of the card (or above the list). Changing the collection moves the product: after save show `Moved "<name>" to "<collection>"` and move focus to the "Products" heading of the current collection; otherwise show `Saved changes to "<name>"`: NEVER use the word "saved" to claim persistence; say `Updated "<name>"` instead.
- Status change on a card: `setProductStatus`, message `"<name>" is now <Status>`, focus stays on the select.
- Delete: `ConfirmDialog` titled `Delete product?` with description naming the product: `Delete "<name>" from "<collection>"? This cannot be undone.` Cancel/Esc keep it and return focus to the Delete button; confirm deletes, shows `Deleted "<name>"`, focus goes to the "Products" heading.
- Empty states: collection with no products: `No products in "<collection>" yet. Add your first product idea.` with an "Add product" button; no collections: existing copy; "Add product" is disabled/hidden until a collection exists (it only exists inside a selected collection anyway).
- Welcome text (App.tsx) must describe the features now available: collections, product ideas with name/type/colour/notes/status, moving products between collections, quick status changes, demo data, data stored in this browser only.

## Additions by design-system (M2)

- New file `products.css` (imported from `index.css`) styles every M2 contract class. `.sr-only` was missing and is now in `base.css`.
- `.field__counter--over`: modifier for the over-limit state (danger colour, bold). The UI should also keep the textual "n / 500" so it is not colour alone.
- No other new classes. `.product-card` has no hover state (it is not clickable). Notes clamp to 3 lines and keep line breaks (`white-space: pre-line`).
- `.product-card__actions` is full width on mobile with buttons sharing the row; `.product-card__footer` sticks to the card bottom so cards in a row align.
- `select.field__control` keeps the native arrow and behaviour; `textarea.field__control` is vertical-resize only, min 6rem.

## M3 contract: filters, overview and demo flows (set by the main agent before parallel work)

Domain (Data & Logic implements, exported from `src/domain/index.ts`):
- `DEFAULT_FILTERS: ProductFilters` = `{ collectionId: 'all', type: 'all', status: 'all' }`.
- `hasActiveFilters(filters): boolean` (any value other than 'all').
- `normalizeFilters(filters, collections): ProductFilters`: a `collectionId` that no longer exists becomes `'all'`; unknown `type`/`status` values become `'all'`.
- `countProductsByStatus(products): Record<Status, number>` with all four statuses present (0 when empty).
- `filterProducts` already exists (AND semantics). Result order = store order (stable).

UI (UI Builder):
- New `ProductsOverview` panel titled "All products" (h2, `tabIndex=-1`), rendered after `CollectionsPanel` once `data.onboarded`. Contains: a status summary line, a filter bar, a live result count, and the list of matching product cards (each card also shows its collection name).
- Filter bar: three labelled native selects: Collection ("All collections" + each collection), Type ("All types" + PRODUCT_TYPES), Status ("All statuses" + STATUSES), combined with AND via `filterProducts`; a "Clear filters" button (disabled when nothing is active). Filters are UI state; pass them through `normalizeFilters` every render so a deleted collection resets to "All".
- Result count: `<p role="status">` "Showing N of M products" (singular/plural correct), updates as filters/data change.
- Empty states: no products at all, collections exist: `No products yet. Select a collection above and add your first product idea.`; no collections: `No products yet. Create a collection first.`; products exist but none match: `No products match these filters.` plus a "Clear filters" button. These are three distinct messages.
- Shared list: extract the card list + inline edit form + delete `ConfirmDialog` + status messages from `ProductsSection` into a reusable component (e.g. `ProductList`) used by BOTH `ProductsSection` and `ProductsOverview`; behaviour rules from the M2 contract stay binding (Edit/Delete accessible names, focus handling, 'Moved', 'Updated', 'Deleted', no persistence claims). In the overview the delete dialog text is `Delete "<name>" from "<collection>"? This cannot be undone.` and after delete/move focus goes to the overview heading. A product edited so that it no longer matches the active filters disappears from the list; announce it via the status message.
- `ProductCard` takes an optional `collectionName` prop and then shows it in `.product-card__collection` (text "Collection: <name>"). Collection detail lists do not show it.
- DataPanel demo flow: when onboarded and there are NO demo records, show a secondary button "Load demo data" with the hint "Adds clearly labelled sample content. Your own items are not changed." (the store already skips names that exist). Keep "Remove demo data", "Reset all data" (confirmed) and all M0/M1/M2 behaviour.

CSS (Design System styles exactly these; document extras):
- `.filters`: the filter bar (a `<form>`-like wrapper or `<div role="group" aria-label="Filter products">`): 1 column on mobile, 3 columns + a clear button from 40rem; uses `.field`, `.field__label`, `select.field__control`.
- `.filters__count`: the result count line, muted, small.
- `.status-summary` (a `<ul>`) and `.status-summary__item` (inline pills: text "Idea 2"; each includes the status text; use the status badge colours via `.badge--*` classes on the item).
- `.product-card__collection`: small muted line on the card.
- `.overview`: optional wrapper for the All-products panel.

## Additions by design-system (M3)

- New file `filters.css` (imported from `index.css`) styles `.overview`, `.filters`, `.filters__count`, `.status-summary`, `.status-summary__item`, `.product-card__collection`. No new class names.
- `.filters` is a grid: 1 column on mobile; from 40rem `repeat(3, 1fr) auto` with `align-items: end`, so the Clear button sits level with the selects (fields in the bar must not have hints/errors). `.filters__count` spans the full row when placed inside `.filters`; it also works outside. Selects have `max-width:100%` and ellipsis so long collection names never overflow.
- `.status-summary__item` carries its own pill styling and the `.badge--*` colours (works with or without `.badge` on the element).
- Fix: in `.collection-form` from 40rem the buttons are top-aligned and offset by one label line, so they line up with the input rather than the hint below it. Relies on the button group being `.cluster` or `.collection-form__actions` and on a single-line label.

## Additions by design-system (QA cosmetics)

- Footer: `.app-footer.container` keeps the exact left edge and width of header/main content; its cream-deep band and top border are painted full-bleed by `.app-footer::before` (100vw, centred). `#root` has `overflow-x: clip` so this never adds a horizontal scrollbar. `.app-footer` is pushed to the viewport bottom with `margin-top: auto`; `main.container` gets bottom padding.
- Button groups: a `.cluster` containing `.stack` cells (button + hint, as in DataPanel) aligns to the top. Buttons in it have `min-width: 12rem` (`--btn-group-min`) and do not wrap; the `.stack` cell is `width: min-content`, so the hint (`p`, muted, 0.875rem) wraps under its button and never widens it.
- `.product-card__header > .collection-item__demo`: tag never shrinks or wraps (`flex: 0 0 auto; white-space: nowrap`), top-aligned with the name. The header wraps, so a 60-char unbroken name wraps via overflow-wrap and the badge drops to the next line at 360px.
- No new class names.
