<?php
/**
 * CSV file parsing and caching.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Comma_Sense_CSV_Handler {

	/**
	 * Parse a CSV file from the Media Library.
	 *
	 * @param int $attachment_id Media Library attachment ID.
	 * @return array|WP_Error Parsed data with 'head' and 'body' keys, or WP_Error on failure.
	 */
	public static function parse( int $attachment_id ) {
		$file_path = get_attached_file( $attachment_id );

		if ( ! $file_path || ! file_exists( $file_path ) ) {
			return new WP_Error( 'file_not_found', __( 'CSV file not found.', 'comma-sense' ) );
		}

		$mime = get_post_mime_type( $attachment_id );
		if ( $mime && ! in_array( $mime, array( 'text/csv', 'application/csv', 'text/plain' ), true ) ) {
			return new WP_Error( 'invalid_mime', __( 'File is not a valid CSV.', 'comma-sense' ) );
		}

		// Check transient cache.
		$file_mod_time = filemtime( $file_path );
		$cache_key     = 'comma_sense_' . $attachment_id;
		$cached        = get_transient( $cache_key );

		if ( $cached && isset( $cached['mod_time'] ) && $cached['mod_time'] === $file_mod_time ) {
			return $cached['data'];
		}

		// Parse the CSV.
		$data = self::read_csv( $file_path );

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		// Cache for 1 hour, keyed by modification time.
		set_transient( $cache_key, array(
			'mod_time' => $file_mod_time,
			'data'     => $data,
		), HOUR_IN_SECONDS );

		return $data;
	}

	/**
	 * Read and parse a CSV file into head/body arrays.
	 *
	 * @param string $file_path Absolute path to the CSV file.
	 * @return array|WP_Error Parsed data or WP_Error.
	 */
	private static function read_csv( string $file_path ) {
		$handle = fopen( $file_path, 'r' );

		if ( ! $handle ) {
			return new WP_Error( 'file_open_error', __( 'Could not open CSV file.', 'comma-sense' ) );
		}

		// Handle UTF-8 BOM.
		$bom = fread( $handle, 3 );
		if ( $bom !== "\xEF\xBB\xBF" ) {
			rewind( $handle );
		}

		$rows = array();
		while ( ( $row = fgetcsv( $handle ) ) !== false ) {
			$rows[] = $row;
		}

		fclose( $handle );

		if ( empty( $rows ) ) {
			return new WP_Error( 'empty_file', __( 'CSV file is empty.', 'comma-sense' ) );
		}

		// First row is the header.
		$header_row = array_shift( $rows );

		$head = array(
			array(
				'cells' => array_map( function ( $cell ) {
					return array(
						'content' => sanitize_text_field( $cell ),
						'tag'     => 'th',
					);
				}, $header_row ),
			),
		);

		$body = array_map( function ( $row ) use ( $header_row ) {
			// Pad or trim row to match header column count.
			$row = array_pad( $row, count( $header_row ), '' );
			$row = array_slice( $row, 0, count( $header_row ) );

			return array(
				'cells' => array_map( function ( $cell ) {
					return array(
						'content' => sanitize_text_field( $cell ),
						'tag'     => 'td',
					);
				}, $row ),
			);
		}, $rows );

		return array(
			'head' => $head,
			'body' => $body,
		);
	}

	/**
	 * Invalidate the cache for a given attachment.
	 *
	 * @param int $attachment_id Media Library attachment ID.
	 */
	public static function invalidate_cache( int $attachment_id ) {
		delete_transient( 'comma_sense_' . $attachment_id );
	}
}
