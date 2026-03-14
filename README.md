<img src="assets/banner-772x250.png" alt="Comma Sense plugin decorative banner" style="width: 100%; height: auto;">

# ▓▓▓ COMMA SENSE ▓▓▓
### *The radical CSV-syncing plugin for WordPress that your tables have been waiting for.*

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

> **"It just makes sense, dude."**

---

## 🕹️ WHAT IS THIS GNARLY THING?

Yo. You know what's totally NOT tubular? Manually entering table data in WordPress. Row. By. Row. Like some kind of digital cave person.

Comma Sense is here to save you from that bogus nightmare. Link a CSV straight from your Media Library to a core Table block and **BOOM** — your data is *live*, baby. Change the CSV, hit refresh, watch your table update like magic. Totally excellent.

No custom blocks. No weird markup. No drama. Just pure, unadulterated data sync that would make any 1985 hacker weep with joy.

---

## 🌟 FEATURES — THIS THING IS STACKED

### 📼 CSV Data Syncing — *Totally Radical*

Point Comma Sense at any CSV in your Media Library and watch it go to work. First row becomes your header. Everything else fills the table. Update your data? Just upload a fresh CSV or slam that **Refresh** button. The table updates in the editor *and* on the frontend. No re-saving posts. No sweat. No problemo.

### 🏗️ Built on Core — *Plays Well With Others*

Comma Sense isn't some rogue custom block trying to take over your installation. It's a **block variation** of `core/table`, which means it gets along with everything:

- ✅ Wide & full-width alignment
- ✅ Color settings
- ✅ Fixed layout
- ✅ All your theme styles

Your tables look exactly like they should. Because they *are* exactly what they should be.

### 📟 Pagination — *For Those Gnarly Big Datasets*

Got a thousand rows of data? Comma Sense has got your back. Tables paginate automatically so your pages stay fast and your readers stay sane. Rows per page? Configurable. Tables capped at 100 rows per page for maximum performance. Try to go over 100 without pagination? We'll flip it back on. You're welcome.

### ♿ Accessible by Default — *Because Everyone Deserves to Party*

CSV headers render as proper `<th>` elements with `scope="col"`. It's not just the right thing to do — it's the *only* thing to do. Missing headers? Comma Sense drops an informational notice right in the editor to keep your content authors on the straight and narrow. Righteous.

### ⚡ Dynamic Rendering — *Live From the Server*

Table data renders dynamically on the frontend, pulled fresh from the linked CSV with server-side transient caching for speed. The data you see is always the *real* data. No stale tables. No republishing posts every time a spreadsheet changes. Just the truth, the whole truth, and nothing but the truth.

---

## 💾 SYSTEM REQUIREMENTS

```
┌─────────────────────────────────────┐
│  MINIMUM SPECS TO RUN THIS BAD BOY  │
├─────────────────────────────────────┤
│  WordPress   ►  6.4 or higher       │
│  PHP         ►  7.4 or higher       │
│  Rad Factor  ►  Maximum             │
└─────────────────────────────────────┘
```

---

## 📦 INSTALLATION — LET'S DO THIS

1. Upload the `comma-sense` folder to `/wp-content/plugins/`
2. Activate through the WordPress admin like the power user you are
3. Drop a Table block (or the Comma Sense variation) in the editor
4. **ENGAGE**

---

## 🕹️ USAGE — YOUR QUEST BEGINS HERE

```
STAGE 1 ► Select a Table block in the editor
STAGE 2 ► Open the [COMMA SENSE] panel in the block sidebar
STAGE 3 ► Hit [UPLOAD CSV] and choose your file from the Media Library
STAGE 4 ► Watch your table fill up like magic — !!BONUS POINTS!!
STAGE 5 ► Set your [ROWS PER PAGE] or toggle pagination
STAGE 6 ► Use [REFRESH] anytime to re-sync from the CSV
STAGE 7 ► Use [UNLINK] to cut the cord and go back to a standard table

                    *** YOU WIN ***
```

---

## 🔧 DEVELOPMENT — FOR THE CODE WARRIORS

Built with [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) and [PapaParse](https://www.papaparse.com/) — the most excellent CSV parsing library in the known universe.

```bash
# Load up your gear
npm install

# Fire up dev mode — watch the magic happen
npm start

# Ship it to production, hero
npm run build
```

---

## 📜 LICENSE

**GPL-2.0-or-later** — Free as in freedom. Free as in *tubular*.

---

```
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
░  COMMA SENSE — MAKING TABLES GREAT AGAIN        ░
░  © This Decade  |  Made with ♥ and CSV Files   ░
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

*Now go forth and sync some data, you radical human.*