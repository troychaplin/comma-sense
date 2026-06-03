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

Because the data comes from a CSV — a plain grid of values — per-cell table features that have no equivalent in a CSV are intentionally not applied: cell text alignment (`align`), and cell merging (`colspan`/`rowspan`). Block-level controls (alignment, color, border, typography, spacing) work as normal.

### Read-Only While Synced

While a CSV is linked, the table is read-only in the editor — the CSV is the single source of truth, so cell edits can't silently drift from your data. All of the block's design controls (color, border, alignment, typography, spacing) still work normally. To hand-edit the table instead, click **Detach**: the block becomes a standard, fully editable Table block, keeping the imported data.

### Pagination

Large tables paginate automatically to keep your pages performant and readable. Rows per page is configurable, with a cap of 100 visible rows per page. If pagination is disabled and the dataset exceeds that cap, it quietly re-enables itself.

Pagination on the frontend is powered by the WordPress [Interactivity API](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/) and degrades gracefully: with JavaScript disabled, every row is shown and the controls are hidden, so no data is ever stuck behind a non-functional control.

### Accessible by Default

CSV headers render as proper `<th>` elements with `scope="col"`. If a table is missing headers entirely, an informational notice appears in the editor to nudge content authors in the right direction.

### Dynamic Rendering

Frontend output is rendered dynamically from the linked CSV, with server-side transient caching for performance. The table always reflects the current state of the file — no manual republishing required.

## Requirements

- WordPress 6.5+ (frontend pagination uses the Interactivity API)
- PHP 7.4+

## Installation

1. Upload the `comma-sense` folder to `/wp-content/plugins/`
2. Activate through the WordPress admin
3. Add a Table block, or search "CSV" in the inserter for the **Comma Sense** variation

## Usage

1. Insert a **Table** block, or search "CSV" in the inserter for the **Comma Sense** variation
2. With the block selected, choose **Select CSV file** — from the upload placeholder in the block, or the **CSV Data Source** panel in the inspector sidebar — and pick a file from the Media Library
3. The table populates automatically and stays read-only while synced
4. Adjust **Rows per page** or toggle pagination in the **Pagination** panel
5. **Refresh** re-syncs the editor preview from the linked file; **Replace** swaps in a different CSV
6. **Detach** disconnects the CSV and returns the block to a standard, editable Table block

## Development

Built with [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) and [PapaParse](https://www.papaparse.com/) for CSV parsing.

The editor code (`src/`) is bundled by `@wordpress/scripts` into `build/`. The frontend pagination (`modules/view.js`) is a hand-authored Interactivity API ES module — it is **not** bundled; it is enqueued directly as a script module and resolves `@wordpress/interactivity` at runtime via WordPress's import map.

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
