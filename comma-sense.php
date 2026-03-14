<?php
/**
 * Plugin Name:       Comma Sense
 * Description:       A block variation of the core table block that syncs data from CSV files.
 * Version:           0.1.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            Troy Chaplin
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       comma-sense
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'COMMA_SENSE_VERSION', '0.1.0' );
define( 'COMMA_SENSE_DIR', plugin_dir_path( __FILE__ ) );
define( 'COMMA_SENSE_URL', plugin_dir_url( __FILE__ ) );

require_once COMMA_SENSE_DIR . 'includes/class-csv-handler.php';
require_once COMMA_SENSE_DIR . 'includes/render.php';

/**
 * Allow CSV uploads in the Media Library.
 */
function comma_sense_mime_types( $mimes ) {
	$mimes['csv'] = 'text/csv';
	return $mimes;
}
add_filter( 'upload_mimes', 'comma_sense_mime_types' );

/**
 * Enqueue editor assets.
 */
function comma_sense_editor_assets() {
	$asset_file = COMMA_SENSE_DIR . 'build/index.asset.php';

	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = require $asset_file;

	wp_enqueue_script(
		'comma-sense-editor',
		COMMA_SENSE_URL . 'build/index.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);

	if ( file_exists( COMMA_SENSE_DIR . 'build/index.css' ) ) {
		wp_enqueue_style(
			'comma-sense-editor',
			COMMA_SENSE_URL . 'build/index.css',
			array(),
			$asset['version']
		);
	}
}
add_action( 'enqueue_block_editor_assets', 'comma_sense_editor_assets' );

/**
 * Enqueue frontend styles.
 */
function comma_sense_frontend_assets() {
	if ( file_exists( COMMA_SENSE_DIR . 'build/style-index.css' ) ) {
		wp_enqueue_style(
			'comma-sense-style',
			COMMA_SENSE_URL . 'build/style-index.css',
			array(),
			COMMA_SENSE_VERSION
		);
	}
}
add_action( 'wp_enqueue_scripts', 'comma_sense_frontend_assets' );
