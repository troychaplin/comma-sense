/**
 * Comma Sense — Block variation registration and attribute extension.
 */

import { registerBlockVariation } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

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
	title: 'Comma Sense',
	description: 'A table synced from a CSV data source.',
	icon: 'editor-table',
	attributes: {
		commaSenseVariation: true,
		commaSenseCsvId: 0,
		head: [
			{
				cells: [
					{ content: '', tag: 'th' },
					{ content: '', tag: 'th' },
					{ content: '', tag: 'th' },
				],
			},
		],
	},
	isActive: ( blockAttributes ) => {
		return blockAttributes.commaSenseVariation === true;
	},
} );
