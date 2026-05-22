# TradeReality Ink

TradeReality Ink, short name `TRInk`, is a Windows-first Tauri desktop overlay for local screen annotation. Version `0.3.2` prepares a TradeReality Tools release candidate package while keeping Expiry out of user-facing UI.

TRInk does not have a standalone landing page. It is intended to be distributed as a free bonus tool through the TradeReality app/web Tools area for registered users, while the desktop app itself remains local-only and does not require login inside TRInk.

TradeReality Ink is an educational annotation overlay. It does not provide financial advice, trading signals, broker automation, or platform bypass functionality.

## Safety

TRInk is intentionally limited to normal desktop overlay behavior.

- No DLL injection
- No browser extensions
- No broker DOM reading
- No credential access
- No trading automation
- No anti-cheat bypass
- No stealth behavior
- No screen scraping
- No telemetry by default
- No cloud sync
- No automatic upload
- No obfuscation
- No suspicious packers

TRInk remains a local annotation overlay. It does not provide broker integration, financial advice, trading signals, trading automation, platform bypasses, cloud sync, or telemetry by default.

## v0.3.2 Focus

`v0.3.2` focuses on TradeReality Tools integration packaging and release-candidate QA without adding broker connectivity, login, or cloud behavior.

- Add a machine-readable TradeReality Tools release manifest
- Expand TradeReality Tools handoff copy for the download area
- Add a release-candidate QA checklist
- Keep beta package contents clean and web/app-consumable
- Keep local-only session/export behavior explicit
- Keep Expiry absent from user-facing UI
- Keep TRInk free for registered TradeReality users under the current distribution model

## Current Architecture

- `overlay` window: transparent drawing surface sized to the selected drawing monitor, owns drawing state, supports native click-through
- `toolbar` window: separate compact controller, always clickable, draggable across monitors, remembers position, opens settings, and controls the overlay through targeted Tauri events

The overlay remains the owner of drawing state. The toolbar receives a compact snapshot for:

- active tool
- active tool mode
- undo/redo availability
- hidden/showing state
- click-through state
- overlay visibility
- current session name
- unsaved state
- selected object summary
- timer status and remaining time

## Features

- Tauri v2 + React + TypeScript + Vite + TailwindCSS
- Two-window desktop overlay architecture
- Compact and normal toolbar size modes
- Drawing target monitor selection
- Local settings persistence with validation and fallback defaults
- Local save/load drawing sessions
- User-triggered local annotation export
- Manual local countdown timer widget
- Editable objects with selection, move, anchor editing, and compact properties
- Better text editing with multiline and style controls
- Basic drawing tools, trading tools, and manual CALL/PUT markers
- Manual QM / Quasimodo bullish and bearish pattern tools
- Manual BOS / CHoCH / FVG / Liquidity Sweep tools
- Core chart tools pack with Horizontal Line, Vertical Marker, Ray, Fibonacci Retracement, Fibonacci Fan, and Andrew's Pitchfork
- Grouped tool palette with search and recent tools
- Grouped favorites picker with validation against user-facing tools only
- Object ordering controls and lock/unlock support
- Custom keybind settings and conflict-aware global shortcut registration
- Undo, redo, clear, hide/show, and selection support
- Global hotkeys and tray menu
- Windows NSIS debug installer output

## Launch Experience

- Toolbar startup is lightweight and local-only
- The toolbar can show a compact branded `Starting TRInk…` state while the overlay syncs
- A short `Ready` state appears after the first successful toolbar/overlay snapshot
- If the overlay is slow to respond, the toolbar shows a compact waiting/error status instead of failing silently
- No login check, network call, or account gating happens inside the desktop app

## First Run and About

- A short welcome panel appears once per local settings profile
- The welcome panel explains the local-only safety scope and offers `Continue`, `Open settings`, and `View shortcuts`
- The About section shows the app name, short name, version, build channel, publisher, and TradeReality Tools distribution identity
- The About section also includes a `Show welcome next launch` reset action

## Local Session Storage

Sessions are local-only.

- Session file extension: `.trink.json`
- Native save dialog suggests `TRInk-session-YYYY-MM-DD-HH-mm.trink.json`
- Native open dialog accepts `.trink.json` and `.json`
- Session data is written only to the user-selected local path
- No cloud sync, upload, broker integration, or remote storage is performed

The session format includes:

- schema version
- app version
- timestamps
- session name
- serialized drawables
- optional monitor/canvas snapshot metadata

Malformed drawable entries are ignored on load instead of crashing the app.

Compatibility notes:

- Unknown or malformed drawables are skipped safely during load
- Legacy vertical-marker compatibility data remains loadable but is not user-creatable
- Timer state is never loaded from session files
- The drawable compatibility matrix is documented in [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)

## Local Export

Exports are local-only and must be triggered by the user.

- Annotation PNG export writes a transparent `.png` with drawings only
- Annotation JSON export writes a local `.json` payload with sanitized drawables
- Native save dialogs are used for export destination selection
- No background capture, no continuous recording, and no automatic upload is performed
- Annotated screenshot export is not implemented in `v0.3.2`

If malformed or unsupported annotations are encountered during export, TRInk skips them safely and shows a compact notice instead of crashing.

Default export filenames:

- `TRInk-annotations-YYYY-MM-DD-HH-mm.png`
- `TRInk-annotations-YYYY-MM-DD-HH-mm.json`

## Editable Objects

TRInk now supports lightweight post-creation editing.

- Use the `Select` tool to select and move an object
- Drag blue anchor handles to edit supported geometry
- `Ctrl+click` still selects an object directly
- `Delete` removes the selected object
- `Esc` clears selection or cancels the current edit drag
- `V` switches to the Select tool while a TRInk window is focused

The compact property panel appears in the settings window only when an object is selected.

- Stroke color
- Fill color where applicable
- Stroke width
- Opacity
- Text content for text objects
- Label field for supported markers/zones
- Font size for text
- Duplicate selected
- Delete selected

Text objects now support:

- multiline text content
- font size
- font weight
- alignment
- text color
- optional background color and opacity
- optional border color and radius
- padding

New object management actions:

- Bring forward
- Send backward
- Bring to front
- Send to back
- Lock object
- Unlock object

Lock behavior:

- Locked objects still render normally
- Locked objects can still be selected
- Locked objects cannot be moved
- Locked anchors cannot be dragged
- Locked property fields are disabled until unlocked
- Locked objects must be unlocked before deletion

Ordering behavior:

- Ordering changes affect render stacking
- Ordering changes affect hit-testing
- Ordering changes affect annotation PNG export
- Ordering is preserved in sessions and annotation JSON export

## QM / Quasimodo

QM is manual educational markup only.

- TRInk does not read broker/chart data
- TRInk does not detect QM automatically
- TRInk does not validate the pattern or produce a trading signal

Creation flow:

- Choose `QM Bullish` or `QM Bearish`
- Left click places each point
- Cursor hints show the current placement step
- `Backspace` removes the last point
- `Esc` cancels the pattern
- Right click finishes once enough points are placed
- The 5th point also finishes automatically

Editing support:

- move whole QM pattern
- drag each of the 5 anchors
- edit label
- toggle labels
- toggle neckline
- toggle retest zone
- toggle direction arrow
- change color, stroke width, and opacity

## Structured Price Action

The following tools are also manual educational annotations only:

- `BOS`
- `CHoCH`
- `FVG`
- `Liquidity Sweep`

Tool behavior:

- `BOS`: 2-point structure break annotation
- `CHoCH`: 2-point structure change annotation
- `FVG`: 2-corner gap zone
- `Liquidity Sweep`: 3-point level plus sweep wick marker

All four support:

- selection
- move
- anchor editing
- property edits
- duplicate/delete
- session save/load
- annotation PNG export
- annotation JSON export

## Core Chart Tools Pack

These tools are manual visual annotations only.

- `Horizontal Line`: single-click horizontal level across the overlay width
- `Vertical Marker`: single-click neutral vertical marker across the overlay height
- `Ray`: 2-point ray that extends to the canvas edge
- `Fibonacci Retracement`: 2-point retracement with editable levels, optional percentage labels, and optional extend left/right
- `Fibonacci Fan`: 2-point fan with editable levels and optional percentage labels
- `Andrew's Pitchfork`: 3-point pitchfork with median and parallel lines plus Standard, Schiff, and Modified Schiff variants

All six support:

- selection
- move
- anchor editing
- property edits
- duplicate/delete
- session save/load
- annotation PNG export
- annotation JSON export

`Vertical Marker` is generic chart/video markup only. It does not imply expiry, expiration, trade timing, or broker timing.

Fibonacci level behavior:

- Defaults remain available for quick reset
- Levels can be edited from the selected-object property panel
- Levels are sorted numerically
- Duplicate or malformed values are ignored safely
- Excessive level counts are capped for rendering stability

Pitchfork polish:

- Variant options: `Standard`, `Schiff`, `Modified Schiff`
- Toggle `Show labels`
- Toggle `Show median line`
- Toggle `Show outer lines`
- Toggle `Show anchor line`
- All options remain manual visual annotations only

## Text Editing

Text remains a manual annotation object only.

Creation flow:

- Choose the `Text` tool
- Click on the canvas
- A compact inline editor appears near the click point
- `Enter` confirms
- `Shift+Enter` inserts a newline
- `Esc` cancels
- Empty text is ignored safely

Editing support:

- Move text with the existing `Select` tool
- Double-click an unlocked text object to edit its content inline
- Edit the same content from the selected-object property panel
- Adjust font size, font weight, alignment, text color, background, border, padding, and border radius
- Locking, duplicate/delete, ordering, save/load, and export all continue to work with styled text objects

Multiline support:

- `\n` line breaks render correctly
- Text bounds and hit-testing account for multiple lines
- Background and border boxes account for multiple lines
- Session save/load preserves line breaks
- Annotation JSON export preserves line breaks
- Annotation PNG export renders multiline text from the same drawable model

## Keybinds

TRInk now supports local-only customizable shortcuts.

- Open `Settings -> Keybinds`
- Shortcuts are grouped into `Overlay`, `Drawing Tools`, `Edit Actions`, `Sessions / Export`, and `Timer`
- Use `Change` to record the next shortcut combination
- Press `Escape` while recording to cancel
- Press `Backspace` or `Delete` with no modifiers while recording to clear a shortcut
- Use `Reset` to restore one shortcut or `Reset all shortcuts` to restore the full default set
- Duplicate active accelerators are rejected before they are saved
- Malformed accelerators are ignored safely and fall back to defaults during settings migration

Default global shortcuts remain focused on the most common actions:

- `Ctrl+Shift+Space`: Toggle overlay visibility
- `Ctrl+Shift+X`: Toggle click-through
- `Ctrl+Shift+V`: Select / Move
- `Ctrl+Shift+P`: Pen
- `Ctrl+Shift+H`: Highlighter
- `Ctrl+Shift+A`: Arrow
- `Ctrl+Shift+R`: Rectangle
- `Ctrl+Shift+T`: Text
- `Ctrl+Shift+E`: Eraser
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Ctrl+Shift+Backspace`: Clear

Focused local shortcuts stay separate from global shortcuts.

- `V` still switches to `Select` while a TRInk window is focused
- Focused local shortcuts are not registered system-wide and therefore do not participate in global conflict reporting

If a shortcut is already owned by another application, TRInk now keeps running and marks that binding as unavailable in the keybind settings.

## Timer

The timer is manual and local-only.

- Use `Timer` controls from the overflow menu or settings panel
- Presets: `1m`, `5m`, `15m`
- Custom duration: set your own minutes and seconds
- Controls: start, pause, resume, reset, show/hide
- The widget is draggable on the overlay and its position is stored locally
- TRInk does not read broker time, chart time, platform time, or website content

Persistence rules:

- TRInk stores timer visibility, position, duration, preset, size, and opacity locally
- Active running countdown state does not persist across restarts
- Session save/load does not include the timer
- Annotation PNG/JSON export does not include the timer

## Tool Palette

TRInk now separates quick access from discovery.

- The main toolbar stays compact and favors up to 8 favorite tools
- The palette groups tools into `Basic`, `Chart`, `Price Action`, and `Binary / Utility`
- The palette includes a lightweight filter input for fast lookup
- Recently used tools are shown in the palette when available
- Utility actions such as save/load/export remain available from the same palette area
- Expiry is not present anywhere in the user-facing palette

Default favorites in `v0.2.6`:

- `Select / Move`
- `Pen`
- `Arrow`
- `Rectangle`
- `Trend Line`
- `Parallel Channel`
- `Horizontal Line`
- `FVG`

Favorites rules:

- Favorites are limited to 8 tools
- Only user-facing tools can be favorited
- Duplicate favorites are removed automatically
- Legacy/internal tools such as old Expiry markers cannot appear in favorites

## Branding

- Primary logo source: [public/logo.svg](public/logo.svg)
- Generated Tauri bundle icons are derived from `public/logo.svg`
- Toolbar branding now uses `public/logo.svg`
- Installer, Start Menu, taskbar/window, executable, and tray icons use the generated bundle icon set where Tauri/Windows applies the normal app icon metadata

Legacy source assets remain in `src/assets` only as older project artifacts and are no longer the primary branding source.

## Internal Distribution

Build the installer first:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
cargo check
pnpm tauri build --debug
```

Then package the internal release folder:

```bash
pnpm release:internal
```

Expected package structure:

```txt
release/
  TRInk-0.3.2-internal/
    TradeReality Ink_0.3.2_x64-setup.exe
    README.md
    PRIVACY.md
    EULA.md
    ROADMAP.md
    RELEASE_NOTES.md
    TESTING.md
    COMPATIBILITY.md
    CHECKSUMS.txt
    logo.svg
```

Then package the beta review folder:

```bash
pnpm release:beta
```

Expected beta package structure:

```txt
release/
  TRInk-0.3.2-beta/
    TradeReality Ink_0.3.2_x64-setup.exe
    README.md
    PRIVACY.md
    EULA.md
    RELEASE_NOTES.md
    TESTING.md
    COMPATIBILITY.md
    BETA_README.md
    RC_CHECKLIST.md
    SIGNING.md
    CHECKSUMS.txt
    logo.svg
    tools-handoff/
```

## Artifact Output Paths

After `pnpm tauri build --debug`, the main Windows outputs are expected at:

- `src-tauri/target/debug/trink.exe`
- `src-tauri/target/debug/bundle/nsis/TradeReality Ink_0.3.2_x64-setup.exe`

After `pnpm release:internal`, the internal handoff folder is expected at:

- `release/TRInk-0.3.2-internal/`

After `pnpm release:beta`, the beta handoff folder is expected at:

- `release/TRInk-0.3.2-beta/`

## Installer Metadata Notes

- Product name: `TradeReality Ink`
- Short UI name: `TRInk`
- Publisher: `TradeReality`
- Executable name: `trink.exe`
- Installer is generated by the normal Tauri NSIS bundle flow
- Uninstaller is generated by the same normal NSIS flow
- No obfuscation, no packers, and no stealth installation behavior are used

`EULA.md` is included in the repository and in the packaged release folders. A dedicated installer EULA screen is not wired in this beta-prep build and should be added later if product distribution requires it.

Tauri/NSIS does not currently have a separate uninstaller icon override configured here. The build relies on the normal generated app/bundle icon metadata flow.

## Unsigned Installer Note

The current beta-prep installer is unsigned.

- Windows SmartScreen warnings are expected on test machines
- Do not use bypasses, obfuscation, or packers to suppress those warnings
- Production distribution should use a proper code-signing certificate
- See [docs/SIGNING.md](docs/SIGNING.md) for the signing preparation checklist
- See [BETA_README.md](BETA_README.md) for the beta tester handoff notes

## Session Usage

- Open the settings panel or overflow tools menu
- Use `Save Session` to write the current drawings to a local `.trink.json` file
- Use `Load Session` to replace current drawings with a saved local session
- If the current session has unsaved changes, TRInk asks for confirmation before load
- A subtle amber indicator means the current session has unsaved changes

## Export Usage

- Open the overflow menu or settings panel
- Use `Export annotations PNG` for a transparent overlay-only PNG
- Use `Export annotations JSON` for a local sanitized drawable export
- Exports are created only after you explicitly trigger them
- Exporting does not capture the underlying broker/chart window in `v0.3.2`

## Timer Usage

- Open the overflow menu or settings panel
- Show the timer and choose `1m`, `5m`, `15m`, or a custom duration
- Start, pause, resume, or reset it manually
- Drag the timer widget to keep it out of the way on the current drawing monitor
- The timer is generic and does not infer timing from any third-party app or platform

## Edit Usage

- Switch to `Select` from the toolbar or press `V` while a TRInk window is focused
- Click an object to select it
- Drag the selected object to move it
- Drag blue anchor handles to edit supported geometry
- Open the settings panel to adjust selected object properties
- Undo and redo work after move, anchor, duplicate, delete, and property edits
- QM and the structured price-action tools use the same selection/edit flow after creation

## Tester Instructions

1. Verify the checksum in `CHECKSUMS.txt` if your team requires artifact verification.
2. Run `TradeReality Ink_0.3.2_x64-setup.exe`.
3. Launch TRInk from the Start Menu or installed executable.
4. Follow [TESTING.md](TESTING.md) for the runtime checklist.
5. Report issues with:
   - TRInk version
   - Windows version
   - monitor layout
   - steps to reproduce
   - session or export file used if relevant
   - screenshots if relevant
   - hotkey conflicts if observed

## Troubleshooting

- If `pnpm` fails in PowerShell because script execution is disabled, use `pnpm.cmd ...` instead.
- If `pnpm release:internal` or `pnpm release:beta` fails, verify `pnpm tauri build --debug` already produced the NSIS installer. The packaging scripts retry installer discovery for a few seconds before failing.
- If a global hotkey is already owned by another application, TRInk keeps running and marks that binding as unavailable in `Settings -> Keybinds`.
- If the toolbar window appears missing after monitor layout changes, restart the app. TRInk clamps the saved toolbar position back into the visible virtual desktop bounds.
- If the overlay appears on the wrong screen, open settings and change the drawing target monitor.
- If click-through seems to disable drawing, that is expected. Return to draw mode from the toolbar, tray, or `Ctrl+Shift+X`.
- If the timer seems inaccurate after pausing, use `Reset` and start it again; TRInk recalculates remaining time from a local monotonic clock rather than any external time source.
- If the timer is missing after monitor or size changes, re-enable `Show timer` in settings and drag it back into view.
- If selection feels inactive, switch to the `Select` tool before trying to move or anchor-edit objects.
- If QM placement does not finish, either place the 5th point or right-click once enough points exist.
- If BOS, CHoCH, FVG, or Sweep do not appear, confirm the full point sequence was placed manually.
- If a session file fails to load, verify it is valid JSON and matches TRInk session schema version `1`.
- If a session file contains malformed drawables, TRInk ignores those entries and loads the valid ones.
- If annotation PNG export fails, verify the selected monitor size/scaling is not extremely large and retry.
- If JSON export appears incomplete, check whether malformed drawables were ignored for safety.
- If settings appear corrupted, remove the `trink.settings.v0.1` local storage entry used by the app profile.
- If Windows SmartScreen warns on the installer, that is expected for an unsigned beta-prep build.
- If Tauri build fails on Windows, verify WebView2 Runtime and Visual Studio C++ Build Tools are installed.

## Known Limitations

- Multi-monitor behavior is Windows-first and still basic compared with a future multi-overlay design.
- Only one overlay window is active at a time.
- Recent sessions are not implemented yet.
- Annotated screenshot export is not implemented yet.
- The timer is fully manual and does not persist a running countdown across app restarts.
- Freehand strokes can be moved and restyled, but not edited point-by-point.
- Trend point add/remove after creation is not implemented yet.
- Channel editing currently supports existing anchors only.
- Text editing stays intentionally lightweight and is not a rich-text system.
- Text alignment/background/border options are per object only and are not global presets yet.
- QM point add/remove after creation is limited to dragging the existing 5 anchors.
- BOS/CHoCH/FVG/Sweep are manual annotations only and do not infer market structure automatically.
- Fibonacci percentage labels use the current compact decimal-or-percent formatting only; there is not yet a richer label layout mode.
- Fibonacci level editing is intentionally capped for stability instead of allowing unbounded level counts.
- Andrew's Pitchfork variants use simplified stable geometry rather than a larger fork-variant system.
- Recent tools are lightweight only and not user-pinned separately from favorites.
- Per-object hide/show is not implemented yet because `v0.3.2` still does not include a dedicated layers list.
- Older internal files that contain legacy vertical markers still load safely, but TRInk no longer exposes a creation tool for them.
- Some global hotkeys may conflict with other desktop software, although they can now be remapped or disabled from the settings panel.
- The installer is not code-signed yet.
- No separate tray-specific mini-mark is configured; the current tray icon derives from the generated app icon set based on `public/logo.svg`.

## Additional Docs

- [BETA_README.md](BETA_README.md)
- [RC_CHECKLIST.md](RC_CHECKLIST.md)
- [docs/SIGNING.md](docs/SIGNING.md)
- [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)
- [RELEASE_NOTES.md](RELEASE_NOTES.md)
- [TESTING.md](TESTING.md)
- [PRIVACY.md](PRIVACY.md)
- [EULA.md](EULA.md)
- [ROADMAP.md](ROADMAP.md)
