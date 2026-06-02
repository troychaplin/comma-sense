# Comma Sense - Plugin Plan

## Overview

A WordPress plugin that registers a **block variation** of `core/table` called "Comma Sense." The variation adds CSV upload functionality so users can populate and sync table data from CSV files stored in the Media Library. Tables render dynamically on the frontend, always reflecting the current CSV file contents.

The core feature set (variation registration, CSV upload UI, PHP/JS parsing, dynamic frontend rendering, transient caching, and pagination) is built. This plan now focuses on the remaining **Gutenberg alignment & hardening** work surfaced by a review against the current `core/table` and `core/query-pagination` source.

### Architecture (reference)

- **Block variation**, not a custom block — inherits all of `core/table`'s styling, supports, and `block.json` features. Custom attributes (`commaSenseCsvId`, `commaSenseFileName`, `commaSensePaginationEnabled`, `commaSenseRowsPerPage`, `commaSenseVariation`) are added via a `blocks.registerBlockType` filter and stored in the block comment delimiter.
- **Dynamic rendering** — a `render_block` filter (`includes/render.php`) intercepts `core/table` output when a CSV is linked and rebuilds the table from the current CSV. If the plugin is deactivated, the last-saved markup still renders.
- **Caching** — parsed CSV data is cached in transients, keyed by attachment ID + file modification time.
- **Editor** — a `editor.BlockEdit` HOC (`src/editor.js`) adds the CSV Data Source + Pagination inspector panels and a preview.

### Key Files

- `src/index.js` — variation + attribute registration
- `src/editor.js` — BlockEdit HOC (CSV panel, preview, pagination)
- `src/pagination.js` — frontend pagination (vanilla JS)
- `includes/class-csv-handler.php` — CSV parsing + transient caching
- `includes/render.php` — `render_block` filter for dynamic output

---

## Remaining Work: Gutenberg Alignment & Hardening

A review against the current Gutenberg source surfaced one correctness bug and several robustness/alignment items. This work resolves them while keeping the plugin as close to core behavior as possible.

### 1. Read-only preview while attached (fixes data-loss bug)

**Problem.** While a CSV is attached, the editor HOC feeds core/table's `BlockEdit` a **sliced** `body` (`src/editor.js`). Core's `updateSelectedCell` (`table/state.js`) maps over the section it's given and writes the *entire* section back via `setAttributes`. So editing any cell while paginated past page 1 overwrites the full `body` with just the visible slice — silently destroying the other rows in the saved attributes (the frontend re-parses the CSV and is unaffected, but the deactivation fallback markup is corrupted).

**Decision — Route B.** While a CSV is attached, **do not render core's editable `BlockEdit`.** Render our own static, read-only `<figure><table>` preview built from `head`/`body`. Editing is only possible after **Detach**, which flips `commaSenseVariation` off, removes our HOC wrapper, and hands control to unmodified core/table (fully editable). This removes the editor-side coupling to core's edit internals entirely and gives a 100% pure core/table experience once detached.

- [ ] In `src/editor.js`, when `commaSenseCsvId > 0`, render a read-only preview instead of `<BlockEdit>`:
  - [ ] Build the preview `<figure>`/`<table>` from `head`/`body`
  - [ ] Apply core's wrapper/styling via `useBlockProps()` and core's exported helpers `__experimentalGetColorClassesAndStyles` / `__experimentalGetBorderClassesAndStyles` (the same helpers `table/save.js` uses) so the preview reflects the block's color/border/typography/spacing controls
  - [ ] Add `has-fixed-layout` class when `hasFixedLayout` is set, matching core
- [ ] Pagination preview slices `body` **for display only** (never calls `setAttributes`) — safe because it is our own preview, not a core attribute write
- [ ] Keep the Detach flow as-is (already transforms to a plain core/table, preserving parsed `head`/`body`)
- [ ] Remove the old slice-into-`editProps` logic and the `<BlockEdit>` render path for the attached state
- [ ] Verify: editing cells is not possible while attached; detaching yields a fully editable, unmodified core/table; color/border/spacing controls still render and apply to the preview

### 2. Cell attribute parity (`scope`) — documentation + a11y nicety

**Assessment.** Core cells carry `align`, `colspan`, `rowspan`, `scope` (`table/save.js`); CSV-sourced tables intentionally omit `align`/`colspan`/`rowspan` because a CSV grid has no source for them. This is correct by design, not a gap. The only attribute that matters is `scope`, and the frontend (`includes/render.php`) already emits `scope="col"` on headers.

- [ ] Add `scope="col"` to header cells in the read-only editor preview (item 1) so editor and frontend match
- [ ] Document in README that `align`/`colspan`/`rowspan` are intentionally unsupported for CSV-sourced tables

### 3. Robust frontend rendering — preserve core markup, swap only the table body

**Problem.** `includes/render.php` reconstructs the entire `<figure>`/`<table>` wrapper with regex and *falls back to a hardcoded `<figure class="wp-block-table comma-sense">`* if the match misses — which would silently drop `alignwide`/spacing/anchor classes. This couples us to core's exact wrapper markup.

**Fix.** Stop reconstructing the wrappers. Use core's saved markup as the base and replace **only the inner content of `<table>`**.

- [ ] Replace the figure/table opening-tag `preg_match` reconstruction with an inner-swap: match `/(<table\b[^>]*>)(.*?)(<\/table>)/s` and substitute fresh `<thead>`/`<tbody>` between the captured open/close tags
- [ ] `<figure>` classes, `<table>` classes/styles, and `<figcaption>` are preserved untouched (caption lives outside `<table>`, so it survives automatically)
- [ ] **Fail safe:** if the `<table>` region can't be located, return `$block_content` unchanged (render the saved static table rather than a stripped-down one)
- [ ] Ensure the `comma-sense` class is present on the figure (add via targeted replace on the existing figure tag only if missing)
- [ ] Inject the pagination `<nav>` immediately before `</figure>`

### 4. MIME hardening

**Problem.** `class-csv-handler.php` accepts `text/csv`/`application/csv`/`text/plain`, but real CSVs frequently upload as `application/vnd.ms-excel`, which parses fine in the editor (client fetches the URL directly) yet fails server-side → silent stale fallback.

- [ ] Add `application/vnd.ms-excel` to the accepted MIME allowlist in `Comma_Sense_CSV_Handler::parse()`
- [ ] Add a `.csv` file-extension fallback check so server MIME quirks don't reject valid files, while staying tight enough not to accept arbitrary uploads
- [ ] Verify a CSV that reports `application/vnd.ms-excel` renders on the frontend

### Files That Change

- `src/editor.js` — read-only preview render path, display-only pagination slice, core styling helpers (items 1, 2)
- `includes/render.php` — inner-swap rendering + fail-safe (item 3)
- `includes/class-csv-handler.php` — MIME allowlist + extension fallback (item 4)
- `README.md` — document intentional cell-attribute limitations (item 2)

---

## Technical Notes

### Variation Detection in Filters

To detect the variation in PHP (`render_block`), we check for the presence of `commaSenseCsvId` in the parsed block's `attrs` — more reliable than checking CSS classes. In JS, the HOC checks `commaSenseVariation === true`.

### Attribute Storage

Custom attributes added via the `blocks.registerBlockType` filter serialize into the block comment delimiter, e.g. `<!-- wp:table {"commaSenseCsvId":42} -->`, so they persist with content and are available in both editor and frontend contexts.

### REST API for CSV Content (editor)

The editor fetches CSV content via the media endpoint `GET /wp/v2/media/{id}`, reads `source_url`, then fetches and parses the file client-side with PapaParse.

---

## Future Considerations

- **Large CSVs:** editor preview loads all rows into block attributes; pagination only helps the frontend. A row/size cap may be worth adding.
- **Delimiter support:** CSV-only today; PapaParse already supports TSV/pipe/auto-detect — a future UI addition.
- **Endpoint syncing:** the dynamic `render.php` architecture extends naturally to fetching from a remote endpoint instead of a CSV attachment.
- **AJAX pagination:** current pagination loads all rows into the DOM; very large tables could fetch pages on demand via a REST endpoint.
