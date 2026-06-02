/**
 * Comma Sense — Block variation registration and attribute extension.
 */

import { registerBlockVariation } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import './editor';
import './style.scss';

/**
 * Extend core/table attributes with Comma Sense custom attributes.
 */
addFilter(
	'blocks.registerBlockType',
	'comma-sense/extend-attributes',
	( settings, name ) => {
		if ( name !== 'core/table' ) {
			return settings;
		}

		return {
			...settings,
			attributes: {
				...settings.attributes,
				commaSenseCsvId: {
					type: 'number',
					default: 0,
				},
				commaSenseFileName: {
					type: 'string',
					default: '',
				},
				commaSensePaginationEnabled: {
					type: 'boolean',
					default: true,
				},
				commaSenseRowsPerPage: {
					type: 'number',
					default: 25,
				},
				commaSenseVariation: {
					type: 'boolean',
					default: false,
				},
			},
		};
	}
);

/**
 * Register the Comma Sense block variation.
 */
registerBlockVariation( 'core/table', {
	name: 'comma-sense',
	title: __( 'Comma Sense', 'comma-sense' ),
	description: __( 'A table synced from a CSV data source.', 'comma-sense' ),
	icon: 'editor-table',
	// Inserter only: do not offer a block transform. Converting an existing,
	// populated core/table into the variation would set commaSenseVariation
	// with no CSV linked, replacing the table with our upload placeholder.
	scope: [ 'inserter' ],
	keywords: [
		__( 'csv', 'comma-sense' ),
		__( 'data', 'comma-sense' ),
		__( 'table', 'comma-sense' ),
		__( 'spreadsheet', 'comma-sense' ),
	],
	attributes: {
		commaSenseVariation: true,
		commaSenseCsvId: 0,
	},
	isActive: ( blockAttributes ) => {
		return blockAttributes.commaSenseVariation === true;
	},
} );
