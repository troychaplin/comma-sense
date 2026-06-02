/**
 * Comma Sense — Editor-side BlockEdit filter.
 *
 * Adds the CSV Data Source inspector panel and header accessibility notice.
 */

import apiFetch from '@wordpress/api-fetch';
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
	BaseControl,
	Button,
	Notice,
	Placeholder,
	RangeControl,
	Spinner,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Papa from 'papaparse';

import './editor.scss';

/**
 * Mirrors the private @wordpress/block-editor utility of the same name.
 * Ensures ToolsPanel dropdown menus are positioned correctly in the sidebar.
 */
function useToolsPanelDropdownMenuProps() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	return isMobileViewport
		? {}
		: { popoverProps: { placement: 'left-start', offset: 259 } };
}

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
	const response = await apiFetch( {
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
function CommaSensePlaceholder( {
	onSelect,
	isLoading,
	error,
	onDismissError,
} ) {
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
 * CSV Data Source inspector panels.
 *
 * Renders two ToolsPanel sections: one for the linked CSV file, one for
 * pagination settings. Only shown once a CSV is linked.
 */
function CsvDataSourcePanel( { attributes, setAttributes, clientId } ) {
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
	const paginationActive = commaSensePaginationEnabled !== false;

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

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

	// Detach from the CSV source: drop the variation flag so the block
	// becomes a plain core/table, keeping the already-parsed head/body data.
	// Clearing commaSenseVariation makes the HOC stop wrapping the block, and
	// clearing commaSenseCsvId makes the render_block filter stop intercepting,
	// so the full table renders statically from the saved markup.
	const onDetach = useCallback( () => {
		setAttributes( {
			commaSenseVariation: false,
			commaSenseCsvId: 0,
			commaSenseFileName: '',
			commaSensePaginationEnabled: true,
			commaSenseRowsPerPage: 25,
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

	return (
		<InspectorControls>
			{ /* Accessibility warning — renders above the panels when the
			     table header section has been disabled in core/table's controls. */ }
			{ ! hasHeader && (
				<Notice
					status="warning"
					isDismissible={ false }
					className="comma-sense-header-notice"
				>
					{ __(
						'Table headers are recommended for accessibility. They help screen reader users understand the data in each column.',
						'comma-sense'
					) }
				</Notice>
			) }

			{ /* CSV Data Source panel */ }
			<ToolsPanel
				label={ __( 'CSV Data Source', 'comma-sense' ) }
				resetAll={ resetCsv }
				panelId={ `${ clientId }-csv` }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					panelId={ `${ clientId }-csv` }
					label={ __( 'CSV file', 'comma-sense' ) }
					hasValue={ () => hasCsv }
					onDeselect={ resetCsv }
					isShownByDefault
				>
					{ error && (
						<Notice
							status="error"
							isDismissible
							onDismiss={ () => setError( '' ) }
							className="comma-sense-error-notice"
						>
							{ error }
						</Notice>
					) }

					{ isLoading ? (
						<Spinner />
					) : hasCsv ? (
						<div className="comma-sense-panel-controls">
							<BaseControl
								label={ __( 'Linked file', 'comma-sense' ) }
								__nextHasNoMarginBottom
							>
								<span className="comma-sense-filename">
									{ commaSenseFileName }
								</span>
							</BaseControl>

							<div className="comma-sense-file-actions">
								<Button
									variant="secondary"
									size="compact"
									onClick={ onRefresh }
								>
									{ __( 'Refresh', 'comma-sense' ) }
								</Button>
								<MediaUploadCheck>
									<MediaUpload
										onSelect={ onSelectMedia }
										allowedTypes={ [ 'text/csv' ] }
										value={ commaSenseCsvId }
										render={ ( { open } ) => (
											<Button
												variant="secondary"
												size="compact"
												onClick={ open }
											>
												{ __(
													'Replace',
													'comma-sense'
												) }
											</Button>
										) }
									/>
								</MediaUploadCheck>
								<Button
									variant="secondary"
									size="compact"
									isDestructive
									onClick={ onDetach }
								>
									{ __( 'Detach', 'comma-sense' ) }
								</Button>
							</div>
						</div>
					) : (
						<MediaUploadCheck>
							<MediaUpload
								onSelect={ onSelectMedia }
								allowedTypes={ [ 'text/csv' ] }
								render={ ( { open } ) => (
									<Button
										variant="secondary"
										onClick={ open }
										__next40pxDefaultSize
									>
										{ __(
											'Select CSV file',
											'comma-sense'
										) }
									</Button>
								) }
							/>
						</MediaUploadCheck>
					) }
				</ToolsPanelItem>
			</ToolsPanel>

			{ /* Pagination panel */ }
			<ToolsPanel
				label={ __( 'Pagination', 'comma-sense' ) }
				resetAll={ resetPagination }
				panelId={ `${ clientId }-pagination` }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					panelId={ `${ clientId }-pagination` }
					label={ __( 'Enable pagination', 'comma-sense' ) }
					hasValue={ () => ! paginationActive }
					onDeselect={ () =>
						setAttributes( { commaSensePaginationEnabled: true } )
					}
					isShownByDefault
				>
					<ToggleControl
						label={ __( 'Enable pagination', 'comma-sense' ) }
						checked={ paginationActive }
						onChange={ ( val ) =>
							setAttributes( {
								commaSensePaginationEnabled: val,
							} )
						}
						__nextHasNoMarginBottom
					/>
				</ToolsPanelItem>

				{ /* Only shown when pagination is on — mirrors the File block's
				     pattern of conditionally rendering ToolsPanelItems. */ }
				{ paginationActive && (
					<ToolsPanelItem
						panelId={ `${ clientId }-pagination` }
						label={ __( 'Rows per page', 'comma-sense' ) }
						hasValue={ () => commaSenseRowsPerPage !== 25 }
						onDeselect={ () =>
							setAttributes( { commaSenseRowsPerPage: 25 } )
						}
						isShownByDefault
					>
						<RangeControl
							label={ __( 'Rows per page', 'comma-sense' ) }
							value={ commaSenseRowsPerPage }
							min={ 2 }
							max={ 100 }
							step={ 1 }
							onChange={ ( val ) =>
								setAttributes( {
									commaSenseRowsPerPage: val ?? 25,
								} )
							}
							__nextHasNoMarginBottom
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</InspectorControls>
	);
}

/**
 * Static, non-interactive pagination preview shown below the table while a CSV
 * is attached and pagination is active. It does not drive anything — it just
 * represents the frontend pagination so the editor conveys that only the first
 * page of rows is being shown. Rendered with spans (not buttons) and hidden
 * from assistive tech; the real, working pagination is generated on the
 * frontend by includes/render.php.
 *
 * Prop: `totalPages` — number of pages the frontend will produce.
 */
function PaginationPlaceholder( { totalPages } ) {
	// Keep the strip compact for large tables: 1 2 3 … N.
	const pages =
		totalPages <= 7
			? Array.from( { length: totalPages }, ( _, i ) => i + 1 )
			: [ 1, 2, 3, '…', totalPages ];

	return (
		<nav
			className="comma-sense-pagination comma-sense-pagination--editor"
			aria-hidden="true"
		>
			<span className="comma-sense-pagination__btn comma-sense-pagination__prev">
				{ __( 'Previous', 'comma-sense' ) }
			</span>
			<span className="comma-sense-pagination__pages">
				{ pages.map( ( page, i ) =>
					page === '…' ? (
						<span
							key={ `gap-${ i }` }
							className="comma-sense-pagination__ellipsis"
						>
							{ '…' }
						</span>
					) : (
						<span
							key={ page }
							className={ `comma-sense-pagination__page${
								page === 1
									? ' comma-sense-pagination__page--active'
									: ''
							}` }
						>
							{ page }
						</span>
					)
				) }
			</span>
			<span className="comma-sense-pagination__btn comma-sense-pagination__next">
				{ __( 'Next', 'comma-sense' ) }
			</span>
		</nav>
	);
}

/**
 * Inner component for the Comma Sense block edit view.
 *
 * Two mutually exclusive states:
 * - No CSV linked → CommaSensePlaceholder (which owns useBlockProps()).
 * - CSV linked    → core/table's real BlockEdit, so every core control
 *                   (alignment, color, border, typography, spacing, toolbar)
 *                   stays available, alongside our CSV/pagination inspector.
 *
 * While a CSV is linked the table is read-only in two layers:
 * 1. The setAttributes handed to BlockEdit drops any head/body change, so the
 *    CSV data can't be edited or corrupted (covers cell edits, paste, and the
 *    insert/delete row/column toolbar). All other attributes pass through, so
 *    the style/support controls keep working.
 * 2. A `comma-sense-readonly` class (added via editor.BlockListBlock) makes the
 *    cells pointer-transparent, so clicking selects the block instead of
 *    placing an editing caret.
 *
 * To edit by hand, Detach first — that clears commaSenseVariation and the block
 * becomes an unmodified, fully editable core/table.
 */
function CommaTableEdit( { BlockEdit, ...props } ) {
	const { commaSenseCsvId } = props.attributes;

	const [ isPlaceholderLoading, setIsPlaceholderLoading ] = useState( false );
	const [ placeholderError, setPlaceholderError ] = useState( '' );

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

	// Read-only guard: block any head/body change from core/table's edit while
	// a CSV is linked (cell typing, paste, insert/delete row/column), but let
	// every other attribute through so the style/support controls still work.
	const readOnlySetAttributes = useCallback(
		( next ) => {
			if ( next && ( 'head' in next || 'body' in next ) ) {
				const rest = { ...next };
				delete rest.head;
				delete rest.body;
				if ( Object.keys( rest ).length > 0 ) {
					props.setAttributes( rest );
				}
				return;
			}
			props.setAttributes( next );
		},
		[ props.setAttributes ]
	);

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

	// --- CSV linked: core's real (read-only) table edit + our inspector ---
	const { commaSensePaginationEnabled, commaSenseRowsPerPage, body } =
		props.attributes;

	const maxRows = 100;
	const totalRows = Array.isArray( body ) ? body.length : 0;
	const isPaginationActive = commaSensePaginationEnabled !== false;
	// Mirror the frontend: force pagination on when rows exceed the hard cap.
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

	// Slice the body for DISPLAY only, so the editor shows just the first page —
	// matching the rows-per-page the frontend will show. This is safe even
	// though the original data-loss bug was caused by a sliced body: the
	// read-only guard drops every head/body write, so the slice can never be
	// written back. The full body stays in the saved attributes untouched.
	let editProps = props;
	if ( Array.isArray( body ) ) {
		let displayBody = body;
		if ( showPagination ) {
			displayBody = body.slice( 0, effectiveRowsPerPage );
		} else if ( body.length > maxRows ) {
			displayBody = body.slice( 0, maxRows );
		}
		if ( displayBody !== body ) {
			editProps = {
				...props,
				attributes: { ...props.attributes, body: displayBody },
			};
		}
	}

	return (
		<>
			<BlockEdit { ...editProps } setAttributes={ readOnlySetAttributes } />
			{ showPagination && (
				<PaginationPlaceholder totalPages={ totalPages } />
			) }
			<CsvDataSourcePanel
				attributes={ props.attributes }
				setAttributes={ props.setAttributes }
				clientId={ props.clientId }
			/>
		</>
	);
}

/**
 * Wrap the core/table BlockEdit component to add Comma Sense behaviour.
 */
const withCsvInspectorControls = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if (
			props.name !== 'core/table' ||
			! props.attributes.commaSenseVariation
		) {
			return <BlockEdit { ...props } />;
		}

		// Attached variation: wrap core's real BlockEdit so it stays
		// read-only while keeping every core control. Detaching clears
		// commaSenseVariation, so the block falls through to the branch
		// above and renders as an unmodified, fully editable core/table.
		return <CommaTableEdit BlockEdit={ BlockEdit } { ...props } />;
	};
}, 'withCsvInspectorControls' );

addFilter(
	'editor.BlockEdit',
	'comma-sense/csv-inspector-controls',
	withCsvInspectorControls
);

/**
 * Add a `comma-sense-readonly` class to the block wrapper while a CSV is linked.
 * The class makes the table cells pointer-transparent (see editor.scss) so
 * clicks select the block instead of placing an editing caret — the visual half
 * of the read-only behaviour. The data half is the setAttributes guard in
 * CommaTableEdit.
 */
const withReadOnlyClass = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		const isAttached =
			props.name === 'core/table' &&
			props.attributes?.commaSenseVariation &&
			props.attributes?.commaSenseCsvId > 0;

		if ( ! isAttached ) {
			return <BlockListBlock { ...props } />;
		}

		const className = [ props.className, 'comma-sense-readonly' ]
			.filter( Boolean )
			.join( ' ' );

		return <BlockListBlock { ...props } className={ className } />;
	};
}, 'withReadOnlyClass' );

addFilter(
	'editor.BlockListBlock',
	'comma-sense/readonly-class',
	withReadOnlyClass
);
