/**
 * Comma Sense — frontend table pagination (Interactivity API).
 *
 * Hand-authored ES module. It is enqueued via wp_enqueue_script_module() with
 * `@wordpress/interactivity` as a dependency, so the bare import below resolves
 * at runtime through the import map WordPress emits — no bundler step.
 *
 * All table rows are present in the DOM. Visibility is driven declaratively
 * from per-<figure> context state (currentPage / rowsPerPage / totalPages):
 * each row binds its `hidden` attribute to whether it falls outside the current
 * page window. Rows are visible by default (progressive enhancement); the store
 * applies `hidden` after hydration. The pagination nav ships with `hidden` and
 * is revealed by the isPaginationHidden getter once the store hydrates.
 */

import { store, getContext, getElement } from '@wordpress/interactivity';

// Figures whose scroll watcher has already run once. Lets onPageChange skip the
// initial hydration pass (we only want to scroll on an actual navigation), and
// keeps that per-figure so multiple tables on a page stay independent.
const initialized = new WeakSet();

const { state } = store( 'comma-sense', {
	state: {
		/**
		 * True when a row falls outside the current page window. Read on each
		 * row via its merged context ({ rowIndex } + the figure's page state).
		 */
		get isRowHidden() {
			const { rowIndex, currentPage, rowsPerPage } = getContext();
			const start = ( currentPage - 1 ) * rowsPerPage;
			return rowIndex < start || rowIndex >= start + rowsPerPage;
		},

		/** Always false — removes the `hidden` attribute from the nav after hydration. */
		get isPaginationHidden() {
			return false;
		},

		get isFirstPage() {
			return getContext().currentPage <= 1;
		},

		get isLastPage() {
			const { currentPage, totalPages } = getContext();
			return currentPage >= totalPages;
		},

		/** True for the page-number button matching the current page. */
		get isCurrentPage() {
			const { page, currentPage } = getContext();
			return page === currentPage;
		},

		/** "page" on the active page-number button, otherwise removed. */
		get ariaCurrent() {
			return state.isCurrentPage ? 'page' : null;
		},
	},

	actions: {
		previous() {
			const context = getContext();
			if ( context.currentPage > 1 ) {
				context.currentPage -= 1;
			}
		},

		next() {
			const context = getContext();
			if ( context.currentPage < context.totalPages ) {
				context.currentPage += 1;
			}
		},

		goToPage() {
			const context = getContext();
			context.currentPage = context.page;
		},
	},

	callbacks: {
		/**
		 * Smooth-scroll to the top of the table when the page changes. Bound via
		 * data-wp-watch on the <figure>; reading currentPage subscribes this so
		 * it re-runs on navigation. The first run (hydration) is skipped.
		 */
		onPageChange() {
			const { ref } = getElement();

			// Reading currentPage subscribes this watcher so it re-runs on every
			// navigation — the read itself is the point, hence before the early
			// return.
			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const { currentPage } = getContext();

			// Skip the initial hydration run for this figure (no scroll on load).
			if ( ! initialized.has( ref ) ) {
				initialized.add( ref );
				return;
			}

			if ( ref && currentPage ) {
				const top =
					ref.getBoundingClientRect().top + window.scrollY - 20;
				window.scrollTo( { top, behavior: 'smooth' } );
			}
		},
	},
} );
