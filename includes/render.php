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
	if ( 'core/table' !== $block['blockName'] ) {
		return $block_content;
	}

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
			$hidden = '';
			if ( $pagination_enabled && $index >= $rows_per_page ) {
				$hidden = ' style="display:none" aria-hidden="true"';
			}
			$sections_html .= '<tr data-row-index="' . esc_attr( $index ) . '"' . $hidden . '>';
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
	// and pagination script can scope to it. add_class() is a no-op if present.
	$processor = new WP_HTML_Tag_Processor( $new_content );
	if ( $processor->next_tag( array( 'tag_name' => 'figure' ) ) ) {
		$processor->add_class( 'comma-sense' );
		$new_content = $processor->get_updated_html();
	}

	// Render pagination controls and inject them just before </figure>.
	if ( $pagination_enabled && $total_rows > $rows_per_page ) {
		$total_pages = (int) ceil( $total_rows / $rows_per_page );

		$pagination_html  = '<nav class="comma-sense-pagination" aria-label="' . esc_attr__( 'Table pagination', 'comma-sense' ) . '"';
		$pagination_html .= ' data-total-rows="' . esc_attr( $total_rows ) . '"';
		$pagination_html .= ' data-rows-per-page="' . esc_attr( $rows_per_page ) . '"';
		$pagination_html .= ' data-total-pages="' . esc_attr( $total_pages ) . '">';

		$pagination_html .= '<button class="comma-sense-pagination__btn comma-sense-pagination__prev" disabled aria-label="' . esc_attr__( 'Previous page', 'comma-sense' ) . '">';
		$pagination_html .= esc_html__( 'Previous', 'comma-sense' );
		$pagination_html .= '</button>';

		$pagination_html .= '<span class="comma-sense-pagination__pages">';
		for ( $i = 1; $i <= $total_pages; $i++ ) {
			$active  = 1 === $i ? ' aria-current="page"' : '';
			$classes = 'comma-sense-pagination__page';
			if ( 1 === $i ) {
				$classes .= ' comma-sense-pagination__page--active';
			}
			$pagination_html .= '<button class="' . esc_attr( $classes ) . '" data-page="' . esc_attr( $i ) . '"' . $active . '>';
			$pagination_html .= esc_html( $i );
			$pagination_html .= '</button>';
		}
		$pagination_html .= '</span>';

		$pagination_html .= '<button class="comma-sense-pagination__btn comma-sense-pagination__next" aria-label="' . esc_attr__( 'Next page', 'comma-sense' ) . '">';
		$pagination_html .= esc_html__( 'Next', 'comma-sense' );
		$pagination_html .= '</button>';

		$pagination_html .= '</nav>';

		$close_pos = strrpos( $new_content, '</figure>' );
		if ( false !== $close_pos ) {
			$new_content = substr_replace( $new_content, $pagination_html, $close_pos, 0 );
		} else {
			$new_content .= $pagination_html;
		}

		// Enqueue pagination JS only when needed.
		comma_sense_enqueue_pagination_script();
	}

	return $new_content;
}
add_filter( 'render_block', 'comma_sense_render_block', 10, 2 );

/**
 * Enqueue the pagination script on the frontend.
 */
function comma_sense_enqueue_pagination_script() {
	static $enqueued = false;

	if ( $enqueued ) {
		return;
	}

	$asset_file = COMMA_SENSE_DIR . 'build/pagination.asset.php';

	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = require $asset_file;

	wp_enqueue_script(
		'comma-sense-pagination',
		COMMA_SENSE_URL . 'build/pagination.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);

	$enqueued = true;
}
