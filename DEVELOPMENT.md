# Development

## Git remotes
- `origin`: https://github.com/HeisenbergGTR/jcard-template (push here)
- `upstream`: https://github.com/ed7n/jcard-template (pull author updates with
  `git pull upstream master`)

## Local preview (Windows)
The site is built with Jekyll, so opening `index.html` directly won't work.

```powershell
$env:Path = "C:\Ruby33-x64\bin;" + $env:Path
bundle exec jekyll serve --baseurl /jcard-template --port 4000 --livereload --force_polling
```

Open http://127.0.0.1:4000/jcard-template/. The page reloads by itself when
files change.

### First-time setup
1. Install Ruby: `winget install RubyInstallerTeam.RubyWithDevKit.3.3`
2. `bundle install` (installs the gems listed in `Gemfile`).

On the work network, `bundle install` fails SSL checks because traffic is
inspected. To fix that, export the Windows root certificates to a PEM file and
point Ruby at it for that shell:

```powershell
$pem = "$env:TEMP\windows-roots.pem"; $sb = [Text.StringBuilder]::new()
foreach ($s in 'Cert:\LocalMachine\Root','Cert:\CurrentUser\Root','Cert:\LocalMachine\CA') {
  Get-ChildItem $s | % { [void]$sb.AppendLine("-----BEGIN CERTIFICATE-----`n" +
    [Convert]::ToBase64String($_.RawData,'InsertLineBreaks') + "`n-----END CERTIFICATE-----") } }
[IO.File]::WriteAllText($pem, $sb.ToString()); $env:SSL_CERT_FILE = $pem
bundle install
```

## Code map
- `_sections/`: HTML partials. `template.html` is the card itself; `form.html`,
  `export.html` and `sections/*.html` are the panels.
- `_includes/`: reusable partials. `text-adjust.html` holds a text block's fine
  adjustments, `art-slot.html` an image slot, and `art-sliders.html` the
  zoom/move/opacity/filter sliders.
- `res/scripts/application-model.mjs`: every form entry, button and output.
  A new saved setting goes in `entries.data` as a `DataFormEntry`. Text-block
  and image-slot entries are generated from `TEXT_BLOCKS` / `ART_SLOTS` in
  `constants.mjs`.
- `res/scripts/events.mjs`: wires entries to outputs, file drop/paste, the
  cover drag/wheel/keys and snapping, fonts, presets, export and search UI.
- `res/scripts/application-functions.mjs`: load/save/restore, and the cover
  and slot images (`setCover`, `setArt`).
- `res/scripts/history.mjs`: undo/redo snapshots and auto-save.
- `res/scripts/sides.mjs`: the Outside/Inside switch. The inside is a second
  `.template` (`.template-inside.mirrored`) with the same geometry, mirrored
  with `rotateY` and its content turned back. `roots.mjs` exposes both, and
  `JCardOutput({ inside: true })` targets the inside.
- `res/scripts/safe-area.mjs`: the safe-area guide and crossing check.
- `res/scripts/card-edit.mjs`: click-to-edit popovers on the card.
- `res/scripts/storage.mjs`: IndexedDB stores (autosave, fonts, presets,
  recent).
- `res/scripts/fonts.mjs`: custom fonts, Google Fonts and CSS font lists.
- `res/scripts/presets.mjs`: style presets.
- `res/scripts/export.mjs`: PNG/PDF rendering and sheets.
- `res/scripts/lookup.mjs`: MusicBrainz, Cover Art Archive and Apple Music
  search.
- `res/styles/jcard.css`: card geometry, in inches. Settings reach it as CSS
  variables named `--jCard<Key>`, which are set on `<article>`.
- `res/styles/view.css`: the app's layout, the drop overlay, slider rows,
  presets, sheet and search tiles.

## Testing
No test suite in the repo. Each feature was checked by driving headless Edge
over the DevTools protocol: drop, paste and save/load round trips; real mouse,
wheel and keyboard input; downloaded export files (size, DPI, PDF pages);
live album searches; and screenshots.
