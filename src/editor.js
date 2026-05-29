/**
 * Comma Sense — Editor-side BlockEdit filter.
 *
 * Adds the CSV Data Source inspector panel and header accessibility notice.
 */

import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import {
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	MediaPlaceholder,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	Notice,
	Placeholder,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	Spinner,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Papa from 'papaparse';

import './editor.scss';

/**
 * Parse CSV text into core/table head and body attribute format.
 */
function parseCsvToTableAttributes( csvText ) {
	const result = Papa.parse( csvText, {
		skipEmptyLines: true,
	} );

	if ( ! result.data || result.data.length === 0 ) {
		return null;
	}

	const [ headerRow, ...bodyRows ] = result.data;

	const head = [
		{
			cells: headerRow.map( ( cell ) => ( {
				content: cell.trim(),
				tag: 'th',
			} ) ),
		},
	];

	const body = bodyRows.map( ( row ) => {
		// Pad or trim to match header column count.
		const cells = headerRow.map( ( _, colIndex ) => ( {
			content: ( row[ colIndex ] || '' ).trim(),
			tag: 'td',
		} ) );
		return { cells };
	} );

	return { head, body };
}

/**
 * Fetch a CSV attachment from the REST API and parse it into table attributes.
 *
 * @param {number} attachmentId Media Library attachment ID.
 * @return {{ parsed: Object, fileName: string }}
 */
async function fetchCsvData( attachmentId ) {
	const response = await wp.apiFetch( {
		path: `/wp/v2/media/${ attachmentId }`,
	} );

	const csvResponse = await fetch( response.source_url );
	const csvText = await csvResponse.text();
	const parsed = parseCsvToTableAttributes( csvText );

	if ( ! parsed ) {
		throw new Error( __( 'Could not parse CSV file.', 'comma-sense' ) );
	}

	return {
		parsed,
		fileName: response.title?.rendered || '',
	};
}

/**
 * Placeholder shown when no CSV is linked yet.
 *
 * Calls useBlockProps() so the editor can track this element for selection,
 * focus, and block spacing — the same role useBlockProps() plays inside
 * the core/table BlockEdit when the table is rendered.
 */
function CommaSensePlaceholder( { onSelect, isLoading, error, onDismissError } ) {
	const blockProps = useBlockProps();

	if ( isLoading ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon="editor-table"
					label={ __( 'Comma Sense', 'comma-sense' ) }
				>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			<MediaPlaceholder
				icon="editor-table"
				labels={ {
					title: __( 'Comma Sense', 'comma-sense' ),
					instructions: __(
						'Upload a CSV file or select one from your media library.',
						'comma-sense'
					),
				} }
				onSelect={ onSelect }
				allowedTypes={ [ 'text/csv' ] }
				accept="text/csv,.csv"
				notices={
					error ? (
						<Notice
							status="error"
							isDismissible
							onDismiss={ onDismissError }
						>
							{ error }
						</Notice>
					) : undefined
				}
			/>
		</div>
	);
}

/**
 * CSV Data Source panel component (shown in the block inspector when a CSV is linked).
 */
function CsvDataSourcePanel( { attributes, setAttributes } ) {
	const {
		commaSenseCsvId,
		commaSenseFileName,
		commaSensePaginationEnabled,
		commaSenseRowsPerPage,
		head,
	} = attributes;

	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( '' );

	const hasHeader = Array.isArray( head ) && head.length > 0;
	const hasCsv = commaSenseCsvId > 0;

	const fetchAndParseCsv = useCallback(
		async ( attachmentId, fileName ) => {
			setIsLoading( true );
			setError( '' );

			try {
				const { parsed, fileName: fetchedName } =
					await fetchCsvData( attachmentId );
				setAttributes( {
					commaSenseCsvId: attachmentId,
					commaSenseFileName: fileName || fetchedName,
					head: parsed.head,
					body: parsed.body,
				} );
			} catch ( err ) {
				setError(
					err.message ||
						__( 'Failed to load CSV file.', 'comma-sense' )
				);
			}

			setIsLoading( false );
		},
		[ setAttributes ]
	);

	const onSelectMedia = useCallback(
		( media ) => {
			if ( ! media || ! media.id ) {
				return;
			}
			fetchAndParseCsv( media.id, media.filename || media.title );
		},
		[ fetchAndParseCsv ]
	);

	const onUnlink = useCallback( () => {
		setAttributes( {
			commaSenseCsvId: 0,
			commaSenseFileName: '',
		} );
	}, [ setAttributes ] );

	const onRefresh = useCallback( () => {
		if ( commaSenseCsvId ) {
			fetchAndParseCsv( commaSenseCsvId, commaSenseFileName );
		}
	}, [ commaSenseCsvId, commaSenseFileName, fetchAndParseCsv ] );

	const resetCsv = () => {
		setAttributes( {
			commaSenseCsvId: 0,
			commaSenseFileName: '',
		} );
	};

	const resetPagination = () => {
		setAttributes( {
			commaSensePaginationEnabled: true,
			commaSenseRowsPerPage: 25,
		} );
	};

	const paginationActive = commaSensePaginationEnabled !== false;

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Comma Sense', 'comma-sense' ) }
				resetAll={ () => {
					resetCsv();
					resetPagination();
				} }
			>
				{ ! hasHeader && (
					<Notice
						status="warning"
						isDismissible={ false }
						className="comma-sense-header-notice"
					>
						{ __(
							'Table headers are recommended for accessibility. They provide context for screen readers and help users understand the data in each column.',
							'comma-sense'
						) }
					</Notice>
				) }

				{ error && (
					<Notice
						status="error"
						isDismissible={ true }
						onDismiss={ () => setError( '' ) }
					>
						{ error }
					</Notice>
				) }

				<ToolsPanelItem
					label={ __( 'CSV file', 'comma-sense' ) }
					hasValue={ () => hasCsv }
					onDeselect={ resetCsv }
					isShownByDefault
				>
					{ isLoading && (
						<Flex
							justify="center"
							style={ { padding: '16px 0' } }
						>
							<FlexItem>
								<Spinner />
							</FlexItem>
						</Flex>
					) }

					{ hasCsv && ! isLoading && (
						<div className="comma-sense-file-info">
							<p>
								<strong>
									{ __(
										'Linked file:',
										'comma-sense'
									) }
								</strong>{ ' ' }
								{ commaSenseFileName }
							</p>
							<Flex>
								<FlexItem>
									<Button
										variant="secondary"
										size="small"
										onClick={ onRefresh }
									>
										{ __(
											'Refresh',
											'comma-sense'
										) }
									</Button>
								</FlexItem>
								<FlexItem>
									<Button
										variant="tertiary"
										size="small"
										isDestructive
										onClick={ onUnlink }
									>
										{ __(
											'Unlink',
											'comma-sense'
										) }
									</Button>
								</FlexItem>
							</Flex>
						</div>
					) }

					{ ! isLoading && (
						<MediaUploadCheck>
							<MediaUpload
								onSelect={ onSelectMedia }
								allowedTypes={ [ 'text/csv' ] }
								render={ ( { open } ) => (
									<Button
										variant={
											hasCsv
												? 'tertiary'
												: 'secondary'
										}
										onClick={ open }
										className="comma-sense-upload-btn"
									>
										{ hasCsv
											? __(
													'Replace CSV',
													'comma-sense'
											  )
											: __(
													'Upload CSV',
													'comma-sense'
											  ) }
									</Button>
								) }
							/>
						</MediaUploadCheck>
					) }
				</ToolsPanelItem>

				<ToolsPanelItem
					label={ __( 'Pagination', 'comma-sense' ) }
					hasValue={ () =>
						! paginationActive || commaSenseRowsPerPage !== 25
					}
					onDeselect={ resetPagination }
					isShownByDefault
				>
					<NumberControl
						label={ __(
							'Rows per page',
							'comma-sense'
						) }
						value={ commaSenseRowsPerPage }
						min={ 2 }
						max={ 100 }
						onChange={ ( value ) => {
							const parsed = parseInt( value, 10 );
							setAttributes( {
								commaSenseRowsPerPage:
									parsed > 0
										? Math.min( parsed, 100 )
										: 25,
							} );
						} }
					/>
					<ToggleControl
						label={ __(
							'Disable pagination',
							'comma-sense'
						) }
						help={ __(
							'Tables are limited to 100 rows per page for performance. Disabling pagination will still cap at 100 visible rows.',
							'comma-sense'
						) }
						checked={ ! paginationActive }
						onChange={ ( value ) =>
							setAttributes( {
								commaSensePaginationEnabled: ! value,
							} )
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);
}

/**
 * Inner component for the Comma Sense block edit view.
 *
 * Extracted from the HOC so hooks are called unconditionally before any
 * early returns (Rules of Hooks). useBlockProps() is NOT called here —
 * CommaSensePlaceholder owns it in placeholder state, and BlockEdit owns it
 * in table state.
 */
function CommaTableEdit( { BlockEdit, ...props } ) {
	const {
		commaSenseCsvId,
		commaSensePaginationEnabled,
		commaSenseRowsPerPage,
		body,
	} = props.attributes;

	const [ currentPage, setCurrentPage ] = useState( 1 );
	const [ isPlaceholderLoading, setIsPlaceholderLoading ] =
		useState( false );
	const [ placeholderError, setPlaceholderError ] = useState( '' );
	const initialPageRef = useRef( true );

	// Scroll to top of block when page changes (skip initial render).
	useEffect( () => {
		if ( initialPageRef.current ) {
			initialPageRef.current = false;
			return;
		}
		const blockEl = document.getElementById( 'block-' + props.clientId );
		if ( blockEl ) {
			const blockTop =
				blockEl.getBoundingClientRect().top + window.scrollY - 20;
			window.scrollTo( { top: blockTop, behavior: 'smooth' } );
		}
	}, [ currentPage, props.clientId ] );

	const onPlaceholderSelect = useCallback(
		async ( media ) => {
			if ( ! media?.id ) {
				return;
			}
			setIsPlaceholderLoading( true );
			setPlaceholderError( '' );
			try {
				const { parsed, fileName: fetchedName } = await fetchCsvData(
					media.id
				);
				props.setAttributes( {
					commaSenseCsvId: media.id,
					commaSenseFileName:
						media.filename || media.title || fetchedName,
					head: parsed.head,
					body: parsed.body,
				} );
			} catch ( err ) {
				setPlaceholderError(
					err.message ||
						__( 'Failed to load CSV file.', 'comma-sense' )
				);
			}
			setIsPlaceholderLoading( false );
		},
		[ props.setAttributes ]
	);

	const maxRows = 100;
	const totalRows = Array.isArray( body ) ? body.length : 0;
	const isPaginationActive = commaSensePaginationEnabled !== false;

	const forcePagination = ! isPaginationActive && totalRows > maxRows;
	const effectiveRowsPerPage = forcePagination
		? maxRows
		: Math.min( commaSenseRowsPerPage || 25, maxRows );
	const showPagination =
		( isPaginationActive || forcePagination ) &&
		totalRows > effectiveRowsPerPage;
	const totalPages = Math.max(
		1,
		Math.ceil( totalRows / effectiveRowsPerPage )
	);

	// Reset to page 1 when pagination settings change.
	useEffect( () => {
		setCurrentPage( 1 );
	}, [ isPaginationActive, effectiveRowsPerPage, totalRows ] );

	// --- Placeholder: shown until a CSV is linked ---
	// CommaSensePlaceholder calls useBlockProps() so the editor can track
	// this element for selection and apply block spacing.
	if ( ! commaSenseCsvId ) {
		return (
			<CommaSensePlaceholder
				onSelect={ onPlaceholderSelect }
				isLoading={ isPlaceholderLoading }
				error={ placeholderError }
				onDismissError={ () => setPlaceholderError( '' ) }
			/>
		);
	}

	// --- CSV linked: render table + editor pagination + inspector ---

	// Slice the body for the editor preview.
	const editProps = { ...props };
	if ( Array.isArray( body ) ) {
		let slicedBody = body;
		if ( showPagination ) {
			const start = ( currentPage - 1 ) * effectiveRowsPerPage;
			const end = start + effectiveRowsPerPage;
			slicedBody = body.slice( start, end );
		} else if ( body.length > maxRows ) {
			slicedBody = body.slice( 0, maxRows );
		}
		if ( slicedBody !== body ) {
			editProps.attributes = {
				...props.attributes,
				body: slicedBody,
			};
		}
	}

	return (
		<>
			<BlockEdit { ...editProps } />
			{ showPagination && (
				<nav
					className="comma-sense-pagination comma-sense-pagination--editor"
					aria-label={ __(
						'Table pagination',
						'comma-sense'
					) }
				>
					<Button
						className="comma-sense-pagination__btn comma-sense-pagination__prev"
						disabled={ currentPage === 1 }
						onClick={ () =>
							setCurrentPage( ( p ) => p - 1 )
						}
						aria-label={ __(
							'Previous page',
							'comma-sense'
						) }
					>
						{ __( 'Previous', 'comma-sense' ) }
					</Button>
					<span className="comma-sense-pagination__pages">
						{ Array.from(
							{ length: totalPages },
							( _, i ) => i + 1
						).map( ( page ) => (
							<Button
								key={ page }
								className={ `comma-sense-pagination__page${
									page === currentPage
										? ' comma-sense-pagination__page--active'
										: ''
								}` }
								onClick={ () => setCurrentPage( page ) }
								aria-current={
									page === currentPage
										? 'page'
										: undefined
								}
							>
								{ page }
							</Button>
						) ) }
					</span>
					<Button
						className="comma-sense-pagination__btn comma-sense-pagination__next"
						disabled={ currentPage === totalPages }
						onClick={ () =>
							setCurrentPage( ( p ) => p + 1 )
						}
						aria-label={ __( 'Next page', 'comma-sense' ) }
					>
						{ __( 'Next', 'comma-sense' ) }
					</Button>
				</nav>
			) }
			<CsvDataSourcePanel
				attributes={ props.attributes }
				setAttributes={ props.setAttributes }
			/>
		</>
	);
}

/**
 * Wrap the core/table BlockEdit component to add Comma Sense behaviour.
 */
const withCsvInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			if (
				props.name !== 'core/table' ||
				! props.attributes.commaSenseVariation
			) {
				return <BlockEdit { ...props } />;
			}

			return <CommaTableEdit BlockEdit={ BlockEdit } { ...props } />;
		};
	},
	'withCsvInspectorControls'
);

addFilter(
	'editor.BlockEdit',
	'comma-sense/csv-inspector-controls',
	withCsvInspectorControls
);
