<img src="assets/banner-772x250.png" alt="Comma Sense plugin decorative banner" style="width: 100%; height: auto;">

# Comma Sense

A WordPress plugin that extends the core Table block with CSV data syncing. Upload a CSV file from the Media Library and Comma Sense keeps your table content in sync — no manual data entry required.

## Why Comma Sense?

Managing table data in the WordPress editor is tedious, especially for large datasets. Comma Sense bridges the gap between your data and the block editor by letting you link a CSV file directly to a core Table block. When your data changes, refresh the connection and the table updates instantly.

## Features

### CSV Data Syncing

Link any CSV file from the WordPress Media Library to a core Table block. The first row of your CSV automatically becomes the table header, and the remaining rows populate the table body. Need to update the data? Upload a new CSV or hit refresh — the table updates in both the editor and the frontend.

### Built on Core

Comma Sense is a block variation of `core/table`, not a custom block. This means full compatibility with all existing table features: alignment options (wide, full-width), color settings, fixed layout, and any theme styles that target the core Table block. Your tables look and behave exactly as expected.

### Pagination

Large tables are automatically paginated to keep your pages fast and readable. Pagination is enabled by default with a configurable number of rows per page. Tables are capped at 100 visible rows per page for performance — if pagination is disabled and the dataset exceeds 100 rows, pagination is automatically re-enabled.

### Accessible by Default

Comma Sense promotes accessible table markup out of the box. CSV headers are rendered as proper `<th>` elements with `scope="col"` attributes. When a table is missing headers, an informational notice appears in the editor to guide content authors toward better accessibility practices.

### Dynamic Rendering

Table data is rendered dynamically on the frontend from the linked CSV file, with server-side transient caching for performance. This means the displayed data always reflects the current state of the CSV — no need to re-save posts when your data changes upstream.

## Requirements

- WordPress 6.4+
- PHP 7.4+

## Installation

1. Upload the `comma-sense` folder to `/wp-content/plugins/`
2. Activate the plugin through the WordPress admin
3. Add a Table block (or the Comma Sense variation) in the block editor

## Usage

1. Select a Table block in the editor
2. Open the **Comma Sense** panel in the block inspector sidebar
3. Click **Upload CSV** and select a CSV file from the Media Library
4. The table populates automatically with your CSV data
5. Adjust **Rows per page** or toggle pagination as needed
6. Use the **Refresh** button anytime to re-sync data from the linked CSV
7. Use **Unlink** to disconnect the CSV and return to a standard table

## Development

Built with [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) and [PapaParse](https://www.papaparse.com/) for CSV parsing.

```bash
# Install dependencies
npm install

# Start development build with watch mode
npm start

# Production build
npm run build
```

## License

GPL-2.0-or-later
