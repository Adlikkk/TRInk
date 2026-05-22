# TRInk Internal Testing Checklist

See [RC_CHECKLIST.md](RC_CHECKLIST.md) for the release-candidate manual QA pass.

## Install

- Installer launches from the packaged internal or beta release folder
- Beta installer launches from the packaged beta release folder
- Product name shows as `TradeReality Ink`
- App icon looks correct during installation
- Installer icon matches the current TradeReality/TRInk logo
- Start Menu entry is created cleanly
- Release package includes `logo.svg`
- Release package includes `COMPATIBILITY.md`
- Beta package includes `BETA_README.md`
- Beta package includes `SIGNING.md`

## Launch

- App launches after install
- Overlay window appears
- Toolbar window appears
- Toolbar shows a branded `Starting TRInk…` state briefly, then `Ready`
- Tray icon/menu is available
- Installed app icon is correct
- Taskbar/window icon is correct
- Start Menu icon is correct
- Tray icon is readable
- App does not require login
- App does not require network access to open the toolbar and overlay

## Toolbar

- Toolbar is visible on first launch
- Toolbar drag works
- Toolbar can move across monitors
- Compact mode looks correct
- Normal mode looks correct
- Toolbar logo is readable in compact mode
- Toolbar logo is readable in normal mode
- Palette opens and closes cleanly
- Palette categories render correctly
- Active tool highlight works in favorites and palette
- Palette filter narrows the visible tool list

## Monitor Targeting

- Drawing target monitor can be changed from settings
- Overlay moves to the selected monitor
- Toolbar can remain on another monitor
- Restart preserves toolbar position safely

## Click-Through

- Click-through toggle works from the toolbar
- `Ctrl+Shift+X` still works if not taken by another app
- Toolbar remains usable while overlay is click-through
- Returning to draw mode works cleanly

## Hotkeys

- Visibility hotkey works
- Tool hotkeys work when available
- Hotkey conflicts do not crash the app
- Keybind settings section opens
- Click-through shortcut can be changed
- Eraser shortcut can be changed
- Shortcut can be disabled
- One shortcut can be reset
- All shortcuts can be reset
- Duplicate shortcut warning is shown before applying
- Malformed shortcut input is rejected safely while recording
- Registration conflict status is shown when a shortcut is unavailable
- Changed shortcut works after save/re-register
- Old shortcut no longer triggers the action after reassignment
- Expiry does not appear in any shortcut/keybind UI

## Drawing Tools

- Pen
- Highlighter
- Arrow
- Rectangle
- Text
- Eraser

## Text

- Create text works
- Empty text cancels safely
- Edit text content works
- Font size changes work
- Font weight changes work
- Text color changes work
- Background can be enabled and disabled
- Background opacity changes work
- Border can be enabled and disabled
- Multiline text works
- Double-click text editing works
- Move text works
- Lock text works
- Duplicate text works
- Ordering with text works
- Save/load preserves styled text
- Export PNG preserves styled text
- Export JSON preserves styled text

## Trading Tools

- Trend
- Channel
- Support/Resistance zone
- Horizontal Line
- Vertical Marker
- Ray
- Fibonacci Retracement
- Fibonacci Fan
- Andrew's Pitchfork
- QM Bullish
- QM Bearish
- BOS
- CHoCH
- FVG
- Liquidity Sweep

## Binary Tools

- CALL marker
- PUT marker

## Edit Actions

- Select tool activates existing-object editing
- Click selects an object
- Click empty space clears selection
- Drag selected object moves it
- Drag anchor handles edits geometry
- Edit text/label/color/stroke/opacity in the property panel
- Undo after move works
- Redo after move works
- Delete selected object works
- Undo
- Redo
- Clear
- Hide/show drawings
- `Ctrl+click` selection
- `Delete` selected object
- `Esc` cancel
- `Backspace` remove last point
- Right-click finish for multi-point tools
- Bring forward works
- Send backward works
- Bring to front works
- Send to back works
- Ordering affects render/export
- Lock selected object works
- Locked object cannot move
- Locked anchors cannot drag
- Unlock restores editing
- Undo/redo works for lock and ordering

## QM

- QM bullish creation works
- QM bearish creation works
- `Esc` cancels QM placement
- `Backspace` removes the last QM point
- Right-click finish works when enough points are placed
- QM selection works
- QM anchor edit works
- QM move works
- QM property toggles work
- QM save/load works
- QM export PNG works
- QM export JSON works
- QM undo/redo works

## Structured Price Action

- BOS create/edit/export works
- CHoCH create/edit/export works
- FVG create/edit/export works
- Sweep create/edit/export works
- Save/load with the new tools works
- Undo/redo with the new tools works
- Malformed session/export data is ignored safely if present

## Core Chart Tools Pack

- Horizontal Line create/edit/export works
- Vertical Marker create/edit/export works
- Ray create/edit/export works
- Fibonacci Retracement create/edit/export works
- Fibonacci Fan create/edit/export works
- Andrew's Pitchfork create/edit/export works
- Fib Retracement levels can be edited
- Fib Retracement levels can be reset to defaults
- Fib Fan levels can be edited
- Fib Fan levels can be reset to defaults
- Malformed Fib level input is rejected or sanitized safely
- Save/load preserves custom Fib levels
- Export PNG preserves custom Fib levels visually
- Export JSON preserves custom Fib levels
- Fib Retracement extend left works
- Fib Retracement extend right works
- Pitchfork variant can be changed
- Pitchfork line toggles work
- Locked Fib or Pitchfork properties cannot be edited
- Save/load with the new chart tools works
- Undo/redo with the new chart tools works
- Expiry is not visible anywhere in the chart tools UI

## Settings

- Settings panel opens and closes cleanly
- Favorite tools update correctly
- Favorite tools remain capped and compact
- Favorite tools persist after restart
- Expiry is not visible in favorite tools
- Expiry is not visible in default tool selection
- Invalid or legacy tools do not appear in grouped favorites sections
- Reset settings works
- Restart preserves settings
- About panel shows version, build channel, publisher, and distribution identity
- `Show welcome next launch` works from About

## First Run

- Welcome notice appears once on a fresh settings profile
- Welcome notice does not reappear after dismissal
- `Continue` dismisses welcome
- `Open settings` opens the settings panel
- `View shortcuts` scrolls to keybind settings

## Recent Tools

- Recent tools appear in the palette after tool changes
- Recent tools stay limited to user-facing tools only
- Recent tools do not show Expiry or legacy/internal entries

## Timer

- Show/hide timer works
- `1m` preset works
- `5m` preset works
- `15m` preset works
- Custom duration works
- Start works
- Pause works
- Resume works
- Reset works
- Drag timer position works
- Restart keeps timer position and preferences
- Running countdown does not persist across restart
- Finished state is visually clear
- Export excludes timer by default
- Session save/load excludes timer
- Timer UI uses neutral wording only
- No broker-time or chart-time integration appears in UI behavior

## Legacy Compatibility

- Expiry is not visible in the toolbar
- Expiry is not visible in overflow
- Old session data with a legacy vertical marker does not crash the app

## Sessions

- Save Session opens a native save dialog
- Saved file uses `.trink.json`
- Load Session opens a native file picker
- Save session with all object types works
- Loading a valid saved session restores drawings
- Load session with all object types works
- Load older session fixtures works
- Invalid session JSON shows an error instead of crashing
- Malformed drawable entries are ignored safely if present
- Clear + Load replaces the current canvas correctly
- Restart + Load still works after relaunch
- Save edited session preserves geometry and properties
- Load edited session restores geometry and properties
- Save/load preserves object order
- Save/load preserves locked state
- Save/load preserves styled text
- Save/load preserves custom Fib/Pitchfork properties
- Timer state is not loaded from sessions
- Release package includes `logo.svg`

## Export

- Export annotations PNG opens a native save dialog
- Exported PNG uses a transparent background
- Export PNG with all object types works
- Export annotations JSON opens a native save dialog
- Exported JSON contains current annotations only
- Export JSON with all object types works
- Malformed drawable export input is handled safely
- Export after loading a session works
- Export after clear still works without crashing
- Export edited PNG reflects moved/edited objects
- Export edited JSON reflects moved/edited objects
- Export preserves draw order
- Export preserves styled text
- Export preserves custom Fib/Pitchfork properties
- Export does not include selection handles, lock UI, toolbar UI, or timer UI
- Timer is excluded from annotation JSON export
- Timer is excluded from annotation PNG export
- Release package includes `logo.svg`

## Restart Persistence

- App restart keeps toolbar position
- App restart keeps chosen toolbar size
- App restart keeps target monitor setting
- App restart keeps default drawing settings
- App restart keeps timer size and opacity preferences
- App restart keeps custom shortcut settings

## Uninstall

- App appears in Installed Apps / Apps & Features
- Uninstall completes cleanly
- Start Menu entry is removed
- Installed executable is removed

## Reinstall

- Reinstall after uninstall succeeds
- App launches again cleanly after reinstall
- `pnpm release:internal` succeeds on the first run after a fresh debug bundle
- `pnpm release:beta` succeeds on the first run after a fresh debug bundle

## Beta Package Smoke Test

- `release/TRInk-0.3.2-beta/` is created
- `TradeReality Ink_0.3.2_x64-setup.exe` is present
- `CHECKSUMS.txt` is present
- `BETA_README.md` is present
- `RC_CHECKLIST.md` is present
- `SIGNING.md` is present
- `logo.svg` is present
- `README.md`, `PRIVACY.md`, `EULA.md`, `RELEASE_NOTES.md`, `TESTING.md`, and `COMPATIBILITY.md` are present
- `tools-handoff/` is present
- `tools-handoff/trink-tool-card.json` is present
- `tools-handoff/trink-release-manifest.json` is present
- `tools-handoff/trink-tool-card.md` is present
- `tools-handoff/trink-short-description.txt` is present
- `tools-handoff/trink-install-instructions.md` is present
- `tools-handoff/trink-faq.md` is present
- `tools-handoff/trink-changelog-summary.md` is present
