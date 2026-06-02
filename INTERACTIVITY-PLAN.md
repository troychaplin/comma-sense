# Plan — Migrate Frontend Pagination to the Interactivity API

Replace the imperative vanilla-JS frontend pagination (`src/pagination.js`) with the WordPress **Interactivity API** (declarative `data-wp-*` directives + a `store`), aligning Comma Sense with how core blocks (`core/query`, `core/search`, etc.) now handle frontend interactivity.

## Resolved decisions

1. **WP minimum:** bump `Requires at least` **6.4 → 6.5** (Interactivity API is stable from 6.5). Unreleased plugin, so this is free.
2. **Build:** ship the module as a **hand-authored ESM file** (no bundler change). It imports `@wordpress/interactivity`, which resolves at runtime via the import map that `wp_enqueue_script_module()` generates.
3. **No-JS:** server renders the no-flash initial state (rows past page 1 carry the `hidden` attribute), **plus** a `<noscript>` CSS block that reveals all rows and hides the nav when JS is disabled.
4. **Proceeding** — future-proofing / standardization.

## Why (rationale)

- Aligns with the modern Gutenberg standard (declarative directives + store) instead of a bespoke imperative script.
- Sets up composability if more interactivity is added later.
- Fixes a latent issue: today rows past page 1 use inline `display:none` and are **permanently inaccessible with JS off**. The `<noscript>` fallback resolves that.

## Current architecture (recap)

- `includes/render.php` emits a `<nav class="comma-sense-pagination">` with `data-total-rows` / `data-rows-per-page` / `data-total-pages`, marks rows beyond page 1 with inline `style="display:none" aria-hidden="true"`, and enqueues `pagination.js` only when pagination renders.
- `src/pagination.js` (vanilla): `querySelectorAll` + `addEventListener`, toggles `style.display` / `aria-hidden`, updates button states, smooth-scrolls.
- State is per-`<figure>` already (scoped DOM queries), so multiple tables on a page work independently.

## Target architecture

A small **script module** using `@wordpress/interactivity` with `store('comma-sense', …)`, plus declarative directives emitted by `render.php`. **State lives in per-`<figure>` context**, preserving independent pagination across multiple tables on one page.

### Directive mapping

| Element | Directives |
|---|---|
| `<figure>` (interactive root) | `data-wp-interactive="comma-sense"`, `data-wp-context='{"currentPage":1,"rowsPerPage":N,"totalPages":M,"totalRows":T}'`, `data-wp-watch="callbacks.onPageChange"` (smooth scroll) |
| each body `<tr>` | `data-wp-context='{"rowIndex":i}'`, `data-wp-bind--hidden="state.isRowHidden"`, `data-wp-bind--aria-hidden="state.isRowHidden"` |
| Previous / Next `<button>` | `data-wp-on--click="actions.previous"` / `"actions.next"`, `data-wp-bind--disabled="state.isFirstPage"` / `"state.isLastPage"` |
| page-number `<button>` | `data-wp-context='{"page":n}'`, `data-wp-on--click="actions.goToPage"`, `data-wp-bind--aria-current="state.ariaCurrent"`, `data-wp-class--comma-sense-pagination__page--active="state.isCurrentPage"` |

Context merges parent → child, so a row's directive callbacks can read both its own `rowIndex` and the figure's `currentPage`/`rowsPerPage`. Mutating `currentPage` (in an action) re-runs the dependent getters reactively (signals) — the same model as `core/search`.

### Store sketch (`modules/view.js`, modeled on `core/search/view.js`)

```js
import { store, getContext, getElement } from '@wordpress/interactivity';

const { state } = store( 'comma-sense', {
	state: {
		get isRowHidden() {
			const { rowIndex, currentPage, rowsPerPage } = getContext();
			const start = ( currentPage - 1 ) * rowsPerPage;
			return rowIndex < start || rowIndex >= start + rowsPerPage;
		},
		get isFirstPage() { return getContext().currentPage <= 1; },
		get isLastPage() {
			const { currentPage, totalPages } = getContext();
			return currentPage >= totalPages;
		},
		get isCurrentPage() {
			const { page, currentPage } = getContext();
			return page === currentPage;
		},
		get ariaCurrent() { return state.isCurrentPage ? 'page' : undefined; },
	},
	actions: {
		previous() { const c = getContext(); if ( c.currentPage > 1 ) c.currentPage--; },
		next() { const c = getContext(); if ( c.currentPage < c.totalPages ) c.currentPage++; },
		goToPage() { const c = getContext(); c.currentPage = c.page; },
	},
	callbacks: {
		onPageChange() {
			// Smooth-scroll to the figure top on page change (skip first run).
			const { ref } = getElement();
			// guard against initial mount; details in implementation
		},
	},
} );
```

### Module registration / enqueue (no build change)

- Hand-authored ESM at **`modules/view.js`** (a new directory, kept out of the webpack entry list and the wiped `build/` dir).
- In `comma-sense.php`, replace the pagination `wp_enqueue_script` with:
  ```php
  wp_register_script_module( 'comma-sense-pagination', COMMA_SENSE_URL . 'modules/view.js', array( '@wordpress/interactivity' ), COMMA_SENSE_VERSION );
  wp_enqueue_script_module( 'comma-sense-pagination' );
  ```
  enqueued from `render.php` only when pagination renders (same gating as today). `@wordpress/interactivity` as a dependency makes WP emit the import map so the bare `import` resolves at runtime.

### Initial render & SSR (important correction)

`wp_interactivity_process_directives()` evaluates directives against **PHP** state/context — it does **not** execute the JS store getters (`state.isRowHidden` lives only in `view.js`). So we **do not** rely on it to pre-hide rows. Instead:

- `render.php` emits the **initial first-page state directly** — rows with index ≥ `rowsPerPage` get the `hidden` attribute (replacing today's inline `display:none`), exactly matching what the client getter computes for `currentPage = 1`. No flash on hydration (server and client agree on page 1).
- After hydration, the `data-wp-bind--hidden` directives take over and react to `currentPage` changes.

### No-JS fallback

When pagination renders, `render.php` also outputs:
```html
<noscript><style>
  .comma-sense tr[hidden]{display:table-row !important;}
  .comma-sense-pagination{display:none !important;}
</style></noscript>
```
With JS off: all rows show, nav hidden → all CSV data accessible. With JS on: `<noscript>` is ignored, directives drive pagination.

## Performance note + fallback approach

All body rows are in the DOM (pagination only toggles visibility). For very large CSVs this means many per-row contexts + bindings, which is heavier to hydrate than the current single-`querySelectorAll` script.

- **Default:** declarative per-row directives (above) — clean, idiomatic, fine for typical tables (dozens–hundreds of rows).
- **Fallback if large-table hydration is slow:** keep the store/actions/buttons declarative, but toggle row visibility **imperatively inside an IA callback** (`data-wp-watch` on the figure reads `currentPage` and shows/hides rows via a scoped query) instead of per-row bindings. Retains the IA model for state while avoiding thousands of per-row signals.
- Decide based on a quick measurement during Phase A with a large test CSV.

## Files that change

- **NEW `modules/view.js`** — hand-authored ESM store/module. **Replaces** `src/pagination.js` (deleted).
- **`includes/render.php`** — emit directives + per-row `hidden` initial state + `<noscript>` fallback; set `<figure>` interactive attributes via the existing `WP_HTML_Tag_Processor`; remove the `data-total-*` config attributes and inline `display:none`; swap script enqueue for the script-module enqueue.
- **`comma-sense.php`** — remove the classic `wp_enqueue_script` pagination helper; add `wp_register_script_module()` registration. Bump header `Requires at least: 6.5`.
- **`src/style.scss`** — rely on the `hidden` attribute (`tr[hidden]{display:none}` safeguard so a theme's `tr{display:table-row}` can't override it); remove assumptions tied to inline `display:none`.
- **`src/pagination.js`** — deleted; remove from any build references (it's a separate wp-scripts entry today — confirm/clean `webpack.config.js` / build entry).
- **`README.md`** — note WP 6.5 requirement; optionally mention the Interactivity-API-based pagination.

## Phased steps

### Phase A — Spike (prove hydration + nav) ✅
- [x] Create `modules/view.js` with the store (state getters, actions, scroll callback)
- [x] Enqueue the script module via `wp_enqueue_script_module()` (register+enqueue in one call), gated in `render.php`
- [x] Emit directives on `<figure>`, rows, and nav buttons in `render.php`
- [x] Verified IA semantics at the source level: context `set` writes inherited props where defined (page buttons update the figure's `currentPage`); `data-wp-class--…--active` parses correctly despite the BEM `--`
- [ ] Manual verify on a test post: page navigation, prev/next disabled states, active page highlight, multiple tables independent
- [ ] Measure hydration on a large CSV; decide per-row vs imperative-callback row toggling

### Phase B — Initial state + no-flash + no-JS ✅
- [x] Emit first-page `hidden` attribute on rows ≥ `rowsPerPage` (replaced inline `display:none`)
- [x] Add the `<noscript>` CSS fallback
- [ ] Manual verify: no hydration flash; no-JS shows all rows and hides nav

### Phase C — Cleanup ✅
- [x] Deleted `src/pagination.js` and its webpack entry; removed `comma_sense_enqueue_pagination_script()`
- [x] Removed the now-unused `data-total-rows`/`-rows-per-page`/`-total-pages` attributes
- [x] Bumped `Requires at least: 6.5`; updated `README.md`
- [x] `style.scss`: `tr[hidden]` safeguard added
- [x] Final lint/build pass clean

### Phase D — Test matrix
- [ ] Multiple Comma Sense tables on one page → independent pagination
- [ ] Pagination on/off; force-pagination at >100 rows; rows-per-page changes
- [ ] Keyboard navigation + screen reader (`aria-current`, disabled states); RTL
- [ ] JS disabled → all rows visible, nav hidden
- [ ] Large CSV hydration performance acceptable
- [ ] Transient caching unaffected; plugin-deactivated fallback still renders the static table

## Risks / trade-offs

- **Per-row hydration cost** on very large tables (mitigation: imperative-callback fallback).
- **New moving parts** vs the current ~100-line script (module registration, directives).
- **WP 6.5 minimum** (accepted).
- Editor preview is unaffected — the Interactivity API is frontend-only; the editor pagination placeholder stays as-is.

## Out of scope (future)

- AJAX/REST on-demand page fetching for very large datasets (the dynamic-render architecture already anticipates this).
- Pagination style options (arrows, labels, mid-size truncation) — previously deferred.
