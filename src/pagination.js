/**
 * Comma Sense — Frontend pagination.
 *
 * Handles show/hide of table rows based on the active page.
 * All rows are in the DOM; pagination toggles visibility.
 */

( function () {
	const paginationNavs = document.querySelectorAll(
		'.comma-sense-pagination'
	);

	paginationNavs.forEach( ( nav ) => {
		const totalRows = parseInt( nav.dataset.totalRows, 10 );
		const rowsPerPage = parseInt( nav.dataset.rowsPerPage, 10 );
		const totalPages = parseInt( nav.dataset.totalPages, 10 );

		const table = nav.closest( '.comma-sense' )?.querySelector( 'table' );
		if ( ! table ) {
			return;
		}

		const tbody = table.querySelector( 'tbody' );
		if ( ! tbody ) {
			return;
		}

		const rows = tbody.querySelectorAll( 'tr[data-row-index]' );
		const prevBtn = nav.querySelector( '.comma-sense-pagination__prev' );
		const nextBtn = nav.querySelector( '.comma-sense-pagination__next' );
		const pageButtons = nav.querySelectorAll(
			'.comma-sense-pagination__page'
		);

		let currentPage = 1;

		function showPage( page ) {
			currentPage = page;
			const start = ( page - 1 ) * rowsPerPage;
			const end = start + rowsPerPage;

			rows.forEach( ( row ) => {
				const index = parseInt( row.dataset.rowIndex, 10 );
				if ( index >= start && index < end ) {
					row.style.display = '';
					row.removeAttribute( 'aria-hidden' );
				} else {
					row.style.display = 'none';
					row.setAttribute( 'aria-hidden', 'true' );
				}
			} );

			// Scroll to top of the table with a small offset.
			const tableTop = table.getBoundingClientRect().top + window.scrollY - 20;
			window.scrollTo( { top: tableTop, behavior: 'smooth' } );

			// Update button states.
			prevBtn.disabled = page === 1;
			nextBtn.disabled = page === totalPages;

			pageButtons.forEach( ( btn ) => {
				const btnPage = parseInt( btn.dataset.page, 10 );
				if ( btnPage === page ) {
					btn.classList.add(
						'comma-sense-pagination__page--active'
					);
					btn.setAttribute( 'aria-current', 'page' );
				} else {
					btn.classList.remove(
						'comma-sense-pagination__page--active'
					);
					btn.removeAttribute( 'aria-current' );
				}
			} );
		}

		// Bind events.
		prevBtn.addEventListener( 'click', () => {
			if ( currentPage > 1 ) {
				showPage( currentPage - 1 );
			}
		} );

		nextBtn.addEventListener( 'click', () => {
			if ( currentPage < totalPages ) {
				showPage( currentPage + 1 );
			}
		} );

		pageButtons.forEach( ( btn ) => {
			btn.addEventListener( 'click', () => {
				const page = parseInt( btn.dataset.page, 10 );
				showPage( page );
			} );
		} );
	} );
} )();
