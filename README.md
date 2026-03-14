```
 ██████╗ ██████╗ ███╗   ███╗███╗   ███╗ █████╗
██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔══██╗
██║     ██║   ██║██╔████╔██║██╔████╔██║███████║
██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║
╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║  ██║
 ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝
███████╗███████╗███╗   ██╗███████╗███████╗
██╔════╝██╔════╝████╗  ██║██╔════╝██╔════╝
███████╗█████╗  ██╔██╗ ██║███████╗█████╗
╚════██║██╔══╝  ██║╚██╗██║╚════██║██╔══╝
███████║███████╗██║ ╚████║███████║███████╗
╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝
``` 

# The CSV-syncing plugin for WordPress that your tables have been waiting for!

> **"It just makes sense, dude."**

<img src="assets/banner-772x250.png" alt="Comma Sense plugin decorative banner" style="width: 100%; height: auto;">

## Why Comma Sense?

Managing table data in the WordPress editor is tedious, especially for large datasets. Comma Sense bridges the gap between your spreadsheet and the block editor — link a CSV file directly to a core Table block, and when your data changes, one refresh is all it takes.

## Features

### CSV Data Syncing

Link any CSV from the WordPress Media Library to a core Table block. The first row becomes the table header, the rest fills the body. Update your data by uploading a new CSV or hitting refresh — changes appear in both the editor and the frontend without re-saving the post.

### Built on Core

Comma Sense is a block variation of `core/table`, not a custom block. That means full compatibility with everything you already rely on — alignment options, color settings, fixed layout, and any theme styles targeting the core Table block.

### Pagination

Large tables paginate automatically to keep your pages performant and readable. Rows per page is configurable, with a cap of 100 visible rows per page. If pagination is disabled and the dataset exceeds that cap, it quietly re-enables itself.

### Accessible by Default

CSV headers render as proper `<th>` elements with `scope="col"`. If a table is missing headers entirely, an informational notice appears in the editor to nudge content authors in the right direction.

### Dynamic Rendering

Frontend output is rendered dynamically from the linked CSV, with server-side transient caching for performance. The table always reflects the current state of the file — no manual republishing required.

## Requirements

- WordPress 6.4+
- PHP 7.4+

## Installation

1. Upload the `comma-sense` folder to `/wp-content/plugins/`
2. Activate through the WordPress admin
3. Add a Table block (or the Comma Sense variation) in the block editor

## Usage

1. Select a Table block in the editor
2. Open the **Comma Sense** panel in the block inspector sidebar
3. Click **Upload CSV** and select a file from the Media Library
4. The table populates automatically
5. Adjust **Rows per page** or toggle pagination as needed
6. Hit **Refresh** anytime to re-sync from the linked CSV
7. Use **Unlink** to disconnect the CSV and return to a standard table

## Development

Built with [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) and [PapaParse](https://www.papaparse.com/) for CSV parsing.

```bash
# Install dependencies
npm install

# Development build with watch mode
npm start

# Production build
npm run build
```

## License

GPL-2.0-or-later