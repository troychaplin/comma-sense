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

		// Validate the file is a CSV. Servers vary in how they report CSV MIME
		// types (text/csv, application/csv, text/plain, and Excel's
		// application/vnd.ms-excel are all common), so we accept the known set
		// and fall back to a .csv extension check for anything else. The
		// extension fallback keeps valid files working without opening the door
		// to arbitrary uploads.
		$allowed_mimes = array( 'text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel' );
		$mime          = get_post_mime_type( $attachment_id );
		$has_csv_ext   = 'csv' === strtolower( pathinfo( $file_path, PATHINFO_EXTENSION ) );

		if ( $mime && ! in_array( $mime, $allowed_mimes, true ) && ! $has_csv_ext ) {
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
		$contents = self::get_file_contents( $file_path );

		if ( is_wp_error( $contents ) ) {
			return $contents;
		}

		// Strip a UTF-8 BOM if present.
		if ( 0 === strncmp( $contents, "\xEF\xBB\xBF", 3 ) ) {
			$contents = substr( $contents, 3 );
		}

		$rows = self::parse_csv_string( $contents );

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
	 * Read a file's contents through the WordPress filesystem abstraction.
	 *
	 * Uses WP_Filesystem instead of direct PHP file handles (fopen/fread/fclose).
	 * Reads are infrequent thanks to the transient cache in parse(), so
	 * initialising WP_Filesystem here is inexpensive. On hosts where the
	 * filesystem can't be accessed without credentials, this returns a WP_Error
	 * and the caller falls back to the last-saved table markup.
	 *
	 * @param string $file_path Absolute path to the file.
	 * @return string|WP_Error File contents, or WP_Error on failure.
	 */
	private static function get_file_contents( string $file_path ) {
		global $wp_filesystem;

		if ( ! $wp_filesystem ) {
			if ( ! function_exists( 'WP_Filesystem' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}
			WP_Filesystem();
		}

		if ( ! $wp_filesystem || ! $wp_filesystem->exists( $file_path ) ) {
			return new WP_Error( 'file_open_error', __( 'Could not open CSV file.', 'comma-sense' ) );
		}

		$contents = $wp_filesystem->get_contents( $file_path );

		if ( false === $contents ) {
			return new WP_Error( 'file_open_error', __( 'Could not open CSV file.', 'comma-sense' ) );
		}

		return $contents;
	}

	/**
	 * Parse a CSV string into an array of row arrays.
	 *
	 * A small state machine that mirrors the parts of fgetcsv() we rely on —
	 * comma delimiters, double-quoted fields, doubled quotes ("") as an escaped
	 * literal quote, and embedded newlines inside quoted fields — without a file
	 * handle. Both "\n" and "\r\n" (and a bare "\r") terminate a record.
	 *
	 * @param string $contents Raw CSV text (any BOM already stripped).
	 * @return array[] List of rows, each a list of string field values.
	 */
	private static function parse_csv_string( string $contents ) {
		$rows      = array();
		$record    = array();
		$field     = '';
		$in_quotes = false;
		$length    = strlen( $contents );
		$dirty     = false; // Whether the current record has any content yet.

		for ( $i = 0; $i < $length; $i++ ) {
			$char = $contents[ $i ];

			if ( $in_quotes ) {
				if ( '"' === $char ) {
					// A doubled quote ("") is an escaped literal quote.
					if ( $i + 1 < $length && '"' === $contents[ $i + 1 ] ) {
						$field .= '"';
						$i++;
					} else {
						$in_quotes = false;
					}
				} else {
					$field .= $char;
				}
				continue;
			}

			switch ( $char ) {
				case '"':
					$in_quotes = true;
					$dirty     = true;
					break;

				case ',':
					$record[] = $field;
					$field    = '';
					$dirty    = true;
					break;

				case "\r":
					// Treat "\r\n" as a single line ending.
					if ( $i + 1 < $length && "\n" === $contents[ $i + 1 ] ) {
						$i++;
					}
					$record[] = $field;
					$rows[]   = $record;
					$record   = array();
					$field    = '';
					$dirty    = false;
					break;

				case "\n":
					$record[] = $field;
					$rows[]   = $record;
					$record   = array();
					$field    = '';
					$dirty    = false;
					break;

				default:
					$field .= $char;
					$dirty  = true;
					break;
			}
		}

		// Flush a trailing record that wasn't terminated by a newline.
		if ( $dirty || ! empty( $record ) || '' !== $field ) {
			$record[] = $field;
			$rows[]   = $record;
		}

		return $rows;
	}
}
