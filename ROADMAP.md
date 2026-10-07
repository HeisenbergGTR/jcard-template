# Roadmap

Hobby fork of [ed7n/jcard-template](https://github.com/ed7n/jcard-template).
Goals: very usable, flexible, handles large high-quality images, drag and drop,
fine adjustments, and an album-art reference lookup.

## Done

### 1. Cover saved with the card (committed `b9de795`)
- The cover image is embedded in `.jcard.json` at full original quality (data
  URL, no recompression) and restored on load.
- Old save files without a cover still load and keep the current cover.
- The large-file warning was raised from 1 MiB to 256 MiB.
- Download Cover now uses the right file extension.

### 2. Drag, drop and paste (committed `b9de795`)
- Drop an image anywhere to set the cover; drop a `.jcard.json` to open it.
- An overlay shows while dragging files.
- Ctrl+V pastes a copied image as the cover. A text paste into a text field
  still goes to the field.
- Images dragged from other browser tabs are fetched when the site allows it;
  otherwise a message suggests Copy image + Ctrl+V.
- Dragging selected text into fields is left alone.

### 3. Cover crop and zoom (committed `e6c940b`)
- New **Adjust** panel in Cover: Zoom, Move X/Y, Rotate (slider + number box
  each), ⟲90°/⟳90°, Flip ↔/↕, Reset adjustments.
- On the card: drag to move, scroll to zoom. Click the cover, then use arrows
  to nudge, `+`/`-` to zoom, `[`/`]` to rotate, `0` to reset. Shift = bigger
  steps.
- All adjustments are saved with the card. Adding a new image resets them.
- Under the hood: the cover `<img>` now sits inside `.template-cover-frame`,
  which clips it. The fill/flip classes and the reverse-mode flip apply to the
  frame; the transform is applied to the `<img>`.
- Open question: should scroll-zoom require Ctrl so it doesn't catch page
  scrolling?

### 4. Print-quality (DPI) readout
- The Cover section shows the effective DPI live, colour-coded: Sharp ✓
  (300+), Good (200+), May look soft (150+), Will look blurry.
- It accounts for the cover area (height factor, Fill cover), the image's
  crop-to-fill scaling, and zoom. Below 300 DPI it says the pixel size needed.
- Still open: a downscaled preview while editing huge scans (6000 px+), if
  dragging ever feels slow.

### Cover art reference links
- A **Find Cover Art** section in Cover lists 10 sources: COV (Music
  Hoarders), MusicBrainz / Cover Art Archive, Discogs (cassette filter),
  iTunes Artwork Finder, Album Art Exchange, Bandcamp, Last.fm, fanart.tv,
  Google Images (large) and Tapedeck.org.
- The 🔍 links pre-fill searches from the card titles (lower title = artist,
  upper = album). The others link to the homepage, because their search URLs
  couldn't be verified.
- Album Art Exchange returned 403 to automated checks; confirm it opens in a
  normal browser.
- This is the manual step before #10 (in-app lookup).

### 7. Undo/redo and auto-save
- ↶ Undo / ↷ Redo buttons at the top of the form, plus Ctrl+Z, and Ctrl+Y or
  Ctrl+Shift+Z. Inside text boxes, Ctrl+Z still undoes typing in that box.
- Whole-card snapshots are taken after 0.5 s of quiet (up to 100 steps) and
  include the cover. They share the cover string, so big images cost no
  extra memory.
- Each snapshot is auto-saved to IndexedDB. On the next visit, a banner offers
  Restore or Discard. Saving a file marks the auto-save as saved, so no
  banner appears after that.
- Code: `res/scripts/history.mjs`.

### Grid snapping for cover adjustments
- **Snap to grid** switch (on by default) and **Grid (%)** size (default 5).
  These are app preferences, not saved with the card.
- When dragging, the cover centre snaps to grid lines and its edges snap to the
  frame edges. Grid lines show while dragging or while the cover is focused.
- Ctrl while dragging moves freely. Arrows jump to the next grid line, Shift
  jumps 5 lines, and Ctrl+arrow nudges 0.1%.
- Ctrl is used rather than Alt, because Alt+← means "go back" in browsers.

### 5. Spine, back and wrap images (committed `6ac879d`)
- Three image slots besides the cover: **Spine**, **Back** and **Wrap** (one
  image across the whole card, into the bleed). Each has Fit (fill/whole),
  Turn 0/90/180/270, Zoom, Move X/Y, Opacity, Brightness, Contrast and
  Saturation. The cover gets the same three filters.
- Drop an image on the spine or back to fill that slot; Shift+drop sets the
  wrap. Slot images are embedded in saves and covered by undo/auto-save.

### 6. Fine adjustments for every text block (committed `216a234`)
- Front titles, front contents, footer, spine titles, notes and back each get
  Move →/↓ (pt), Letter spacing (pt) and Line height, with sliders.
- Movement follows the text direction (CSS `translate`), so it works on the
  rotated spine and back.

### 8. Fonts and style presets (committed `0ec35b6`)
- **Title font** separate from the main font.
- 18 Google Fonts in the font list, loaded on demand. Names are quoted, so
  ones like "Press Start 2P" work.
- **Add fonts** (or drop .ttf/.otf/.woff/.woff2): fonts join a browser library
  and are embedded in saves of cards that use them.
- **Style presets** change everything except the text and image placement: 7
  built-ins (Default, Minimal, Retro retail, Mixtape handwritten,
  Typewriter, Neon night, Bold block) plus Save as… / Delete for your own.

### 9. Export (committed `56b0abf`)
- New **Export** page: PNG or PDF at 150/300/600 DPI, cropped to the card, the
  bleed or the crop marks. PNGs record their DPI; PDFs are card size or
  centred on Letter/A4.
- **Sheet**: collect different cards and save them as one PDF, as many per page
  as fit at true size. It lasts until the page is reloaded.
- html-to-image and jsPDF load from CDNs on first use. The card's fonts
  (app, Google, custom) are embedded.

### 10. Album-art search (committed `a3cca01`)
- **Search Album Art** in Cover: MusicBrainz (cassette releases first, Cover
  Art Archive originals) or Apple Music (up to 3000 px). Empty boxes use the
  card titles.
- Use a result as the cover, back or wrap; **Fill titles**; **Fill track
  list** (keeps a release's real sides: two media, or A/B track numbers;
  otherwise splits in half).
- **Recent Picks** keeps the last 12 choices in the browser.
- Art is fetched live, never re-hosted. Deezer was tested and blocks browser
  requests (no CORS).

### Edit on the card, Clear text / Clear images
- Click any text on the card for a small editor right there (front contents
  edits Side A and B together); it updates live and goes through undo. Clicks
  are matched against the actual letters, so overlapping blocks on the spine
  work.
- Click the cover, or a blank part of the spine, back or front, for that
  image's actions: Choose image…, Search art, Adjust…, Remove.
- A press on the cover only becomes a drag after 4 px of movement, so clicks
  never nudge or snap it.
- **Clear text** and **Clear images** sit beside Undo/Redo. Clearing images
  hides the cover via the new **Show cover** switch, and a new cover image
  shows it again. The Side A/B labels can now be left blank.

## Ideas for later
- **Auto-fit text:** long albums (such as 26 tracks) overflow the front and
  back. A "shrink to fit" option, or an overflow warning, would help.
- **Discogs search:** the best cassette J-card scans, but it needs a free
  user token entered by the user.
- **Drag/zoom on the card for spine, back and wrap images**, like the cover
  has. Today they use sliders only.
- **DPI readout for the slot images.**
- **Keep the export sheet in browser storage** so it survives reloads.
- **Scroll-to-zoom on the cover:** consider requiring Ctrl.

## Housekeeping
- GitHub Pages is on: https://heisenberggtr.github.io/jcard-template/
  updates on every push to `master`.
- Shared styles still load from `ed7n.github.io/res`. Consider vendoring them
  so the fork doesn't break if upstream changes.
- Keep `LICENSE` (BSD 2-Clause) intact; add our own copyright line when we
  make substantial changes.
