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

## Remaining ideas

### Images
5. **Images on spine and back, and full-wrap art.** A separate image or
   background per panel, plus one image across all three panels like retail
   J-cards. Basic filters: brightness, contrast, saturation, greyscale,
   "faded print".

### Fine control and usability
6. **Precise nudging everywhere.** Sliders next to number boxes (the generic
   `input[type=range][data-for]` sync already exists, so reuse it). Each text
   block gets its own position offsets, letter spacing and line height.
8. **Fonts and presets.** Drag in custom font files (.ttf/.otf/.woff) and pick
   from a few Google Fonts. Layout presets ("Minimal", "Retro retail",
   "Mixtape handwritten") plus saving your own.

### Output
9. **Better export.** A high-res PNG/PDF export that doesn't depend on the
   browser print dialog, and several different cards on one sheet (today,
   one print repeats the same card).

### Reference database
10. **Album-art lookup.** Search artist + album, pick a cover result, drop it
    on the card, and optionally auto-fill Side A/B track lists.
    - **MusicBrainz + Cover Art Archive:** first choice. Free, no key, CORS
      OK. It has track lists, often high-res scans, and real cassette
      releases.
    - **iTunes Search API:** fallback. Clean square art up to about 3000 px.
    - **Discogs:** later. The biggest cassette catalogue and real J-card
      scans, but it needs a free user token.
    - Look art up live; never re-host it, because album art is copyrighted.
      Printing it for your own tapes is fine.
    - Add a personal library in the browser: recent covers and favourite
      layouts.

## Housekeeping
- Enable GitHub Pages: Settings → Pages → Deploy from a branch → `master`,
  `/ (root)`. The site then lives at heisenberggtr.github.io/jcard-template.
- Shared styles still load from `ed7n.github.io/res`. Consider vendoring them
  so the fork doesn't break if upstream changes.
- Keep `LICENSE` (BSD 2-Clause) intact; add our own copyright line when we
  make substantial changes.
