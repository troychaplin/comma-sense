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

	// Extract the existing <figure> opening tag from the original block content
	// so we preserve all core classes (alignwide, has-fixed-layout, colors, etc.).
	$figure_open = '<figure class="wp-block-table comma-sense">';
	if ( preg_match( '/<figure\b[^>]*>/', $block_content, $matches ) ) {
		$figure_open = $matches[0];

		// Ensure our custom class is present on the figure tag.
		if ( strpos( $figure_open, 'comma-sense' ) === false ) {
			$figure_open = str_replace( 'class="', 'class="comma-sense ', $figure_open );
		}
	}

	// Build the table HTML.
	$table_html = $figure_open;
	$table_html .= '<table>';

	// Render thead.
	if ( ! empty( $head ) ) {
		$table_html .= '<thead>';
		foreach ( $head as $row ) {
			$table_html .= '<tr>';
			foreach ( $row['cells'] as $cell ) {
				$tag     = 'th';
				$content = $cell['content'] ?? '';
				$scope   = ! empty( $cell['scope'] ) ? ' scope="' . esc_attr( $cell['scope'] ) . '"' : ' scope="col"';
				$table_html .= '<' . $tag . $scope . '>' . esc_html( $content ) . '</' . $tag . '>';
			}
			$table_html .= '</tr>';
		}
		$table_html .= '</thead>';
	}

	// Render tbody.
	if ( ! empty( $body ) ) {
		$table_html .= '<tbody>';
		foreach ( $body as $index => $row ) {
			$hidden = '';
			if ( $pagination_enabled && $index >= $rows_per_page ) {
				$hidden = ' style="display:none" aria-hidden="true"';
			}
			$table_html .= '<tr data-row-index="' . esc_attr( $index ) . '"' . $hidden . '>';
			foreach ( $row['cells'] as $cell ) {
				$tag     = $cell['tag'] ?? 'td';
				$content = $cell['content'] ?? '';
				$table_html .= '<' . $tag . '>' . esc_html( $content ) . '</' . $tag . '>';
			}
			$table_html .= '</tr>';
		}
		$table_html .= '</tbody>';
	}

	$table_html .= '</table>';

	// Render pagination controls.
	if ( $pagination_enabled && $total_rows > $rows_per_page ) {
		$total_pages = (int) ceil( $total_rows / $rows_per_page );

		$table_html .= '<nav class="comma-sense-pagination" aria-label="' . esc_attr__( 'Table pagination', 'comma-sense' ) . '"';
		$table_html .= ' data-total-rows="' . esc_attr( $total_rows ) . '"';
		$table_html .= ' data-rows-per-page="' . esc_attr( $rows_per_page ) . '"';
		$table_html .= ' data-total-pages="' . esc_attr( $total_pages ) . '">';

		$table_html .= '<button class="comma-sense-pagination__btn comma-sense-pagination__prev" disabled aria-label="' . esc_attr__( 'Previous page', 'comma-sense' ) . '">';
		$table_html .= esc_html__( 'Previous', 'comma-sense' );
		$table_html .= '</button>';

		$table_html .= '<span class="comma-sense-pagination__pages">';
		for ( $i = 1; $i <= $total_pages; $i++ ) {
			$active  = 1 === $i ? ' aria-current="page"' : '';
			$classes = 'comma-sense-pagination__page';
			if ( 1 === $i ) {
				$classes .= ' comma-sense-pagination__page--active';
			}
			$table_html .= '<button class="' . esc_attr( $classes ) . '" data-page="' . esc_attr( $i ) . '"' . $active . '>';
			$table_html .= esc_html( $i );
			$table_html .= '</button>';
		}
		$table_html .= '</span>';

		$table_html .= '<button class="comma-sense-pagination__btn comma-sense-pagination__next" aria-label="' . esc_attr__( 'Next page', 'comma-sense' ) . '">';
		$table_html .= esc_html__( 'Next', 'comma-sense' );
		$table_html .= '</button>';

		$table_html .= '</nav>';

		// Enqueue pagination JS only when needed.
		comma_sense_enqueue_pagination_script();
	}

	$table_html .= '</figure>';

	return $table_html;
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
