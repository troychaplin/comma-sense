<?php
/**
 * Dynamic frontend rendering for Comma Sense blocks.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Filter the rendered output of core/table blocks that have a linked CSV.
 *
 * @param string $block_content The block's rendered HTML.
 * @param array  $block         The parsed block data.
 * @return string Modified HTML or original content.
 */
function comma_sense_render_block( $block_content, $block ) {
	$attrs = $block['attrs'] ?? array();

	if ( empty( $attrs['commaSenseCsvId'] ) ) {
		return $block_content;
	}

	$csv_id = (int) $attrs['commaSenseCsvId'];
	$data   = Comma_Sense_CSV_Handler::parse( $csv_id );

	if ( is_wp_error( $data ) ) {
		return $block_content;
	}

	$head = $data['head'] ?? array();
	$body = $data['body'] ?? array();

	if ( empty( $body ) && empty( $head ) ) {
		return $block_content;
	}

	$pagination_enabled = ! isset( $attrs['commaSensePaginationEnabled'] ) || ! empty( $attrs['commaSensePaginationEnabled'] );
	$rows_per_page      = isset( $attrs['commaSenseRowsPerPage'] ) ? min( (int) $attrs['commaSenseRowsPerPage'], 100 ) : 25;
	$total_rows         = count( $body );

	// Force pagination on when total rows exceed the max of 100, regardless of the toggle.
	if ( ! $pagination_enabled && $total_rows > 100 ) {
		$pagination_enabled = true;
		$rows_per_page      = 100;
	}

	// Pagination only renders (and rows only get hidden) when there is more than
	// one page of data.
	$show_pagination = $pagination_enabled && $total_rows > $rows_per_page;
	$total_pages     = $show_pagination ? (int) ceil( $total_rows / $rows_per_page ) : 1;

	// Build the fresh <thead>/<tbody> that will replace the saved table's inner
	// content. We deliberately do NOT reconstruct the <figure>/<table> wrappers:
	// keeping core's own opening tags preserves every class/style it applies
	// (alignwide/alignfull, is-style-stripes, spacing, has-fixed-layout, color,
	// border) and any <figcaption>, with no coupling to core's exact markup.
	$sections_html = '';

	if ( ! empty( $head ) ) {
		$sections_html .= '<thead>';
		foreach ( $head as $row ) {
			$sections_html .= '<tr>';
			foreach ( $row['cells'] as $cell ) {
				$content = $cell['content'] ?? '';
				$scope   = ! empty( $cell['scope'] ) ? ' scope="' . esc_attr( $cell['scope'] ) . '"' : ' scope="col"';
				$sections_html .= '<th' . $scope . '>' . esc_html( $content ) . '</th>';
			}
			$sections_html .= '</tr>';
		}
		$sections_html .= '</thead>';
	}

	if ( ! empty( $body ) ) {
		$sections_html .= '<tbody>';
		foreach ( $body as $index => $row ) {
			$row_attrs = '';

			if ( $show_pagination ) {
				// Interactivity API: each row carries its index in context and
				// binds `hidden`/`aria-hidden` to whether it falls outside the
				// current page. Rows are visible by default (progressive
				// enhancement); the store applies `hidden` after hydration.
				$row_attrs  = ' data-wp-context=\'{"rowIndex":' . (int) $index . '}\'';
				$row_attrs .= ' data-wp-bind--hidden="state.isRowHidden"';
				$row_attrs .= ' data-wp-bind--aria-hidden="state.isRowHidden"';
			}

			$sections_html .= '<tr' . $row_attrs . '>';
			foreach ( $row['cells'] as $cell ) {
				$tag     = $cell['tag'] ?? 'td';
				$content = $cell['content'] ?? '';
				$sections_html .= '<' . $tag . '>' . esc_html( $content ) . '</' . $tag . '>';
			}
			$sections_html .= '</tr>';
		}
		$sections_html .= '</tbody>';
	}

	// Swap only the inner content of the first <table>, keeping its opening and
	// closing tags. A callback is used instead of a replacement string so cell
	// content containing "$" sequences (e.g. "$5") isn't treated as a regex
	// backreference.
	$count       = 0;
	$new_content = preg_replace_callback(
		'/(<table\b[^>]*>)(.*?)(<\/table>)/s',
		static function ( $matches ) use ( $sections_html ) {
			return $matches[1] . $sections_html . $matches[3];
		},
		$block_content,
		1,
		$count
	);

	// Fail safe: if the saved markup has no <table> (unexpected), leave the
	// original content untouched rather than emitting a stripped-down table.
	if ( null === $new_content || 0 === $count ) {
		return $block_content;
	}

	// Ensure the figure carries the `comma-sense` class so the frontend styles
	// can scope to it. add_class() is a no-op if already present. When
	// paginating, the figure is also the Interactivity API root: it holds the
	// shared page state in context and the scroll watcher.
	$processor = new WP_HTML_Tag_Processor( $new_content );
	if ( $processor->next_tag( array( 'tag_name' => 'figure' ) ) ) {
		$processor->add_class( 'comma-sense' );

		if ( $show_pagination ) {
			$processor->set_attribute( 'data-wp-interactive', 'comma-sense' );
			$processor->set_attribute(
				'data-wp-context',
				wp_json_encode(
					array(
						'currentPage' => 1,
						'rowsPerPage' => $rows_per_page,
						'totalPages'  => $total_pages,
						'totalRows'   => $total_rows,
					)
				)
			);
			$processor->set_attribute( 'data-wp-watch', 'callbacks.onPageChange' );
		}

		$new_content = $processor->get_updated_html();
	}

	// Render pagination controls and inject them just before </figure>. Buttons
	// carry Interactivity API directives; the initial disabled/active state is
	// also rendered statically so it is correct before the module hydrates.
	if ( $show_pagination ) {
		// The nav ships hidden; the Interactivity API removes `hidden` after
		// hydration via state.isPaginationHidden. Without JS the nav stays
		// hidden and all rows remain visible — no <noscript> block needed.
		$pagination_html = '<nav class="comma-sense-pagination" hidden aria-label="' . esc_attr__( 'Table pagination', 'comma-sense' ) . '"';
		$pagination_html .= ' data-wp-bind--hidden="state.isPaginationHidden">';

		// Previous — disabled on page one initially; the directive keeps it in
		// sync after hydration.
		$pagination_html .= '<button class="comma-sense-pagination__btn comma-sense-pagination__prev"';
		$pagination_html .= ' data-wp-on--click="actions.previous"';
		$pagination_html .= ' data-wp-bind--disabled="state.isFirstPage"';
		$pagination_html .= ' disabled aria-label="' . esc_attr__( 'Previous page', 'comma-sense' ) . '">';
		$pagination_html .= esc_html__( 'Previous', 'comma-sense' );
		$pagination_html .= '</button>';

		$pagination_html .= '<span class="comma-sense-pagination__pages">';
		for ( $i = 1; $i <= $total_pages; $i++ ) {
			$classes = 'comma-sense-pagination__page';
			$active  = '';
			if ( 1 === $i ) {
				$classes .= ' comma-sense-pagination__page--active';
				$active   = ' aria-current="page"';
			}
			$pagination_html .= '<button class="' . esc_attr( $classes ) . '"';
			$pagination_html .= ' data-wp-context=\'{"page":' . $i . '}\'';
			$pagination_html .= ' data-wp-on--click="actions.goToPage"';
			$pagination_html .= ' data-wp-bind--aria-current="state.ariaCurrent"';
			$pagination_html .= ' data-wp-class--comma-sense-pagination__page--active="state.isCurrentPage"';
			$pagination_html .= $active . '>';
			$pagination_html .= esc_html( $i );
			$pagination_html .= '</button>';
		}
		$pagination_html .= '</span>';

		$pagination_html .= '<button class="comma-sense-pagination__btn comma-sense-pagination__next"';
		$pagination_html .= ' data-wp-on--click="actions.next"';
		$pagination_html .= ' data-wp-bind--disabled="state.isLastPage"';
		$pagination_html .= ' aria-label="' . esc_attr__( 'Next page', 'comma-sense' ) . '">';
		$pagination_html .= esc_html__( 'Next', 'comma-sense' );
		$pagination_html .= '</button>';

		$pagination_html .= '</nav>';

		$close_pos = strrpos( $new_content, '</figure>' );
		if ( false !== $close_pos ) {
			$new_content = substr_replace( $new_content, $pagination_html, $close_pos, 0 );
		} else {
			$new_content .= $pagination_html;
		}

		// Enqueue the Interactivity API pagination module only when needed.
		comma_sense_enqueue_pagination_module();
	}

	return $new_content;
}
// Use the block-type-specific filter so the callback only runs for table
// blocks, instead of on every block in the post via the generic `render_block`.
add_filter( 'render_block_core/table', 'comma_sense_render_block', 10, 2 );

/**
 * Enqueue the Interactivity API pagination module on the frontend.
 *
 * Registered and enqueued in one call (idempotent — WordPress dedupes by id, so
 * multiple Comma Sense tables on a page are fine). Declaring
 * `@wordpress/interactivity` as a dependency makes WordPress emit the import map
 * that resolves the module's bare import, and loads the runtime.
 */
function comma_sense_enqueue_pagination_module() {
	wp_enqueue_script_module(
		'comma-sense-pagination',
		COMMA_SENSE_URL . 'modules/view.js',
		array( '@wordpress/interactivity' ),
		COMMA_SENSE_VERSION
	);
}
