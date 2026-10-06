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
- `_sections/`: HTML partials. `template.html` is the card itself; `sections/*.html`
  are the form panels (cover, titles, footer, notes, contents).
- `res/scripts/application-model.mjs`: every form entry, button and output.
  A new saved setting goes in `entries.data` as a `DataFormEntry`.
- `res/scripts/events.mjs`: wires entries to outputs, plus file drop/paste and
  the cover drag/wheel/keyboard controls.
- `res/scripts/application-functions.mjs`: load/save, cover read/set/reset.
- `res/styles/jcard.css`: card geometry, in inches. Settings reach it as CSS
  variables named `--jCard<Key>`, which are set on `<article>`.
- `res/styles/view.css`: the app's layout, the drop overlay and slider rows.

## Testing
No test suite. Changes have been checked by driving headless Edge over the
DevTools protocol: drop, paste, save/load round trips, plus real mouse, wheel
and keyboard input, with screenshots.
