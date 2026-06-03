=== Comma Sense — CSV to Table Block Sync ===

Contributors:      areziaal
Tags:              csv, table, spreadsheet, block, data
Requires at least: 6.5
Tested up to:      6.8
Requires PHP:      7.4
Stable tag:        0.1.0
License:           GPLv2 or later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Beam a CSV into a core Table block and watch it light up — upload, refresh, HIGH SCORE. Your spreadsheet data, neon-bright on the page.

== Description ==

**INSERT CSV. PRESS START.**

Hand-building tables cell by cell is the final boss nobody asked for. Comma Sense plugs a CSV from your Media Library straight into a core WordPress Table block and — *FWOOSH* — your spreadsheet rezzes onto the page in full neon. Update the file, smash **Refresh**, and your live page levels up with it. No quarters required.

> *"It just makes sense, dude."*

Pricing sheets. Sports stats. Product specs. Event schedules. That 800-row dataset lurking at the end of the level. Comma Sense turns *"ugh, the table"* into *"NEW HIGH SCORE."* No copy-paste marathons, no fragile manual edits, no re-saving posts every time your numbers tick up.

= Power-Ups =

* **PLAYER 1, READY.** Pick a CSV and the first row becomes your headers while the rest fills the body — automatically.
* **One file, always in sync.** The table renders live from the linked CSV on every page load, so the front end always shows the latest data. Change the file, you're done.
* **Zero lock-in, zero quarters.** It's not a weird custom block — it's a variation of the core Table block. Everything you already know still works, and your content stays portable.
* **It looks like *your* cabinet.** Color, borders, typography, spacing, alignment, fixed layout, theme styles — every core Table control applies, untouched.
* **No lag.** Output renders dynamically with smart server-side caching, so big tables never drop a frame.

= Built on Core, Not Bolted On =

Comma Sense is a block variation of `core/table` — full compatibility with everything you rely on, and it inherits future WordPress upgrades for free. Because the data is a plain CSV grid, per-cell tricks with no CSV equivalent (cell alignment, colspan/rowspan) are intentionally skipped, while every block-level design control works exactly as you'd expect.

= No Friendly Fire (Read-Only While Synced) =

While a CSV is linked, the table is read-only in the editor — the file is the single source of truth, so a stray keystroke can't knock your data out of sync. Want to go off-script and edit by hand? One hit of **Detach** drops it back to a standard, fully editable Table block with your data intact.

= Pagination That Never Drops a Frame =

Big dataset? Comma Sense paginates automatically to keep pages fast and readable, with a configurable rows-per-page. Powered by the modern WordPress Interactivity API, it degrades like a champ: with JavaScript disabled, every row shows and the controls hide — so no data is ever trapped behind a dead button.

= Accessible From the First Row =

CSV headers render as proper `<th>` elements with `scope="col"`, pagination ships with correct ARIA and keyboard support, and the editor nudges you when a table is missing headers. Good data tables, by default.

= 1-UP For =

* Pricing and comparison tables
* Product catalogs and spec sheets
* Sports standings, schedules, and stats
* Financial reports and data dumps
* Anyone who lives in a spreadsheet and wishes WordPress did too

== Installation ==

Loading screen, then you're in:

1. Upload the plugin files to the `/wp-content/plugins/comma-sense` directory, or install the plugin through the WordPress Plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Add a Table block, or search "CSV" in the block inserter for the **Comma Sense** variation.
4. Choose **Select CSV file**, pick a file from the Media Library, and watch your table rez into place.

== Frequently Asked Questions ==

= How do I connect a CSV to my table? =

Insert a Table block (or search "CSV" in the inserter for the Comma Sense variation), then choose **Select CSV file** from the block's upload placeholder or the **CSV Data Source** panel in the sidebar. Pick a file from your Media Library and the table fills itself in instantly — no continue screen required.

= What happens when my data changes? =

Upload a new version of the file (or hit **Replace**) and the front end reflects it on the next page load — no need to re-save the post. In the editor, smash **Refresh** to update the preview. Your spreadsheet stays the single source of truth.

= Can I still edit the table by hand? =

Yes. While a CSV is linked the table is read-only to keep your data safe, but **Detach** converts the block back into a standard, fully editable Table block — every imported row intact.

= Do my colors, borders, and theme styles still work? =

Absolutely. Comma Sense is a variation of the core Table block, so every block-level design control — color, border, typography, spacing, alignment, fixed layout — and all your theme's table styling apply exactly as normal.

= Will big tables slow down my site? =

No lag here. Tables render dynamically with server-side transient caching, and large datasets paginate automatically (configurable rows per page, capped for performance). Switch pagination off on a huge table and it quietly re-enables itself.

= Does pagination work without JavaScript? =

It degrades like a champ. Pagination is built on the WordPress Interactivity API; with JavaScript disabled, every row is displayed and the pagination controls are hidden, so all of your data stays accessible.

= Is it accessible? =

Yes. CSV headers become real `<th scope="col">` cells, the pagination controls include proper ARIA states and keyboard support, and the editor flags tables that are missing headers so your data tables stay screen-reader friendly.

= What kind of CSV files are supported? =

Standard comma-separated files from the Media Library, including those with a UTF-8 byte-order mark and quoted fields. Comma Sense is forgiving about the various MIME types real-world CSV exports use, so files from Excel, Google Sheets, and friends just drop right in.

== Screenshots ==

1. Link a CSV from the Media Library and your table rezzes into place — headers and all.
2. Every core Table design control still applies, so your data looks like the rest of your cabinet.
3. Configurable, accessible pagination keeps large datasets fast and readable.
4. Detach anytime to drop back to a standard, fully editable Table block.

== Changelog ==

= 0.1.0 =
* PRESS START — initial release: CSV-to-Table syncing via a core Table block variation.
* Live dynamic front-end rendering from the linked CSV, with transient caching.
* Read-only-while-synced editing model with one-hit **Detach**.
* Configurable, accessible pagination built on the WordPress Interactivity API, with a no-JavaScript fallback.
* Accessible headers (`<th scope="col">`) and a missing-header nudge in the editor.

== Upgrade Notice ==

= 0.1.0 =
Drop a comma. Press start. The first public release of Comma Sense.
