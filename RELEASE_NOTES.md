# TRInk Release Notes

## v0.3.2 TradeReality Tools Integration Package and RC QA

This release prepares TRInk for TradeReality Tools upload review without adding in-app login, telemetry, broker connectivity, or cloud behavior.

- Version aligned to `0.3.2` across app, bundle, docs, and handoff assets
- Added `tools-handoff/trink-release-manifest.json` for machine-readable TradeReality Tools metadata
- Expanded TradeReality Tools handoff copy with install guidance, FAQ, and changelog summary
- Added `RC_CHECKLIST.md` for beta release-candidate manual QA
- Updated beta packaging so the manifest, handoff files, and RC checklist ship with the beta review folder

## v0.3.1 Brand Launch Polish and TradeReality Tools Handoff

This release prepares TRInk for TradeReality Tools distribution without adding login, telemetry, broker connectivity, or cloud behavior.

- Version aligned to `0.3.1` across app, bundle, docs, and handoff assets
- Added a lightweight branded toolbar startup state with compact `Starting TRInk…` and `Ready` feedback
- Added a one-time first-run welcome and safety notice with quick access to Settings and Keybinds
- Added an About section with version, publisher, build channel, distribution identity, and local-only safety summary
- Added `tools-handoff/` assets for the TradeReality app/web Tools area
- Updated beta packaging to include the handoff files alongside `BETA_README.md` and `SIGNING.md`
- Kept TRInk local-only, free for registered TradeReality users under the current distribution model, and free of Expiry UI

## v0.3.0 Beta Packaging Prep

This release prepares TRInk for future public beta packaging review.

- Version aligned to `0.3.0` across app, bundle, and docs
- Added `pnpm release:beta` for a beta review package alongside `pnpm release:internal`
- Added `BETA_README.md` for tester-facing handoff instructions
- Added `docs/SIGNING.md` for proper production signing preparation
- Beta and internal release packages now include checksums, logo assets, and compatibility documentation
- TRInk remains unsigned in this build; no fake signing, obfuscation, packers, or SmartScreen bypasses were added

## v0.2.11 Internal Release

This release hardens compatibility across sessions and annotation exports.

- Version aligned to `0.2.11` across app, bundle, and docs
- Added `docs/COMPATIBILITY.md` as a drawable support matrix for internal testing
- Added fixture-backed compatibility coverage for full-session roundtrips, malformed files, Fib/Pitchfork custom properties, styled text, and legacy vertical marker compatibility
- Session load, annotation JSON export, and annotation PNG export now report skipped unsupported annotations more consistently
- Timer state remains excluded from sessions and annotation exports

## v0.2.10 Internal Release

This release improves text creation, editing, and rendering.

- Version aligned to `0.2.10` across app, bundle, and docs
- Added multiline text entry with `Enter` confirm and `Shift+Enter` newline
- Added richer text properties for weight, alignment, background, border, padding, and radius
- Added double-click editing for unlocked text objects
- Updated text bounds, hit-testing, session save/load, and annotation PNG/JSON export to preserve styled text

## v0.2.9 Internal Release

This release improves Fibonacci and Pitchfork chart-tool quality.

- Version aligned to `0.2.9` across app, bundle, and docs
- Added custom Fibonacci level editing for retracement and fan objects
- Added normalized Fib level sorting, deduplication, malformed-value fallback, and level caps
- Added optional Fibonacci percentage labels
- Added Fib Retracement `extend left` and `extend right`
- Added Andrew's Pitchfork variants: `Standard`, `Schiff`, and `Modified Schiff`
- Added Pitchfork toggles for median, outer, and anchor lines
- Save/load and annotation PNG/JSON export now preserve these new Fib and Pitchfork properties

## v0.2.8 Internal Release

This release adds custom keybinds and conflict-aware shortcut handling.

- Version aligned to `0.2.8` across app, bundle, and docs
- Added a grouped keybind settings section with recording, clear, reset-one, and reset-all controls
- Added validation for malformed accelerators, duplicate bindings, and unknown shortcut actions
- Global shortcuts now re-register dynamically from settings instead of relying on a hardcoded Rust list
- Conflicting shortcuts remain non-fatal and are now shown as unavailable in the UI
- The internal release packaging script now retries installer discovery so `pnpm release:internal` works reliably right after bundling

## v0.2.7 Internal Release

This release adds ordering and lock safety for editable objects.

- Version aligned to `0.2.7` across app, bundle, and docs
- Added `Bring Forward`, `Send Backward`, `Bring To Front`, and `Send To Back`
- Added per-object `locked` state with selection allowed but geometry/property edits blocked until unlocked
- Ordering changes now flow through hit-testing, export rendering, session save/load, and undo/redo
- Locked objects are preserved in sessions and annotation JSON exports
- Expiry remains absent from all user-facing tool lists

## v0.2.6 Internal Release

This release reorganizes the growing toolset into a compact grouped palette.

- Version aligned to `0.2.6` across app, bundle, and docs
- Added grouped palette sections for `Basic`, `Chart`, `Price Action`, and `Binary / Utility`
- Added palette search and lightweight recent tools
- Added grouped favorites editing with compact preview and reset flow
- Legacy/internal tools remain excluded from favorites and palette UI
- Expiry remains absent from all user-facing tool lists

## v0.2.5 Internal Release

This release adds the manual core chart tools pack.

- Version aligned to `0.2.5` across app, bundle, and docs
- Added `Horizontal Line`, `Vertical Marker`, `Ray`, `Fibonacci Retracement`, `Fibonacci Fan`, and `Andrew's Pitchfork`
- Added rendering, hit-testing, selection, anchor editing, and compact property editing for all six tools
- Session save/load and annotation PNG/JSON export now preserve the new chart tool drawables
- `Vertical Marker` remains neutral markup only, with no expiry or trade-timing language
- Expiry remains absent from user-facing UI

## v0.2.4 Internal Release

This release removes the legacy Expiry tool from all user-facing UI.

- Version aligned to `0.2.4` across app, bundle, and docs
- Removed Expiry from toolbar, overflow, favorites, default tool selection, and settings UI
- Kept safe backward compatibility for older files that contain legacy vertical markers
- Timer wording remains neutral: `Timer`, `Countdown`, `1m`, `5m`, `15m`, and `Custom`
- No new Expiry behavior was added

## v0.2.3 Internal Release

This release adds a manual local countdown timer.

- Version aligned to `0.2.3` across app, bundle, and docs
- Added a draggable timer overlay widget with `1m`, `5m`, `15m`, and custom duration support
- Added timer controls in the toolbar overflow and settings panel
- Timer state remains local-only and manual, with no broker/chart/platform time reading
- Sessions and annotation exports continue to exclude timer UI/runtime state
- The legacy Expiry vertical line tool was demoted from promoted UI paths

## v0.2.2 Internal Release

This release adds manual editable structured price-action tools.

- Version aligned to `0.2.2` across app, bundle, and docs
- Added `BOS`, `CHoCH`, `FVG`, and `Liquidity Sweep`
- Added placement hints, rendering, hit-testing, and property editing for all four tools
- Session save/load and annotation export now preserve these structured drawables
- These tools remain manual educational annotations only, with no automatic detection or chart analysis

## v0.2.1 Internal Release

This release adds manual editable QM / Quasimodo patterns.

- Version aligned to `0.2.1` across app, bundle, and docs
- Added `QM Bullish` and `QM Bearish` tools with guided 5-point placement
- Added QM rendering with labels, neckline, retest zone, and direction arrow
- Added QM support to the existing selection, anchor editing, and property panel flow
- Session save/load and annotation export now preserve QM drawables
- QM remains manual educational annotation only, with no automatic detection or trading signal behavior

## v0.2.0 Internal Release

This release adds editable objects on top of the existing overlay and session/export workflow.

- Version aligned to `0.2.0` across app, bundle, and docs
- Added explicit `Select` tool for object selection and movement
- Added anchor handle editing for supported objects
- Added compact selected-object property panel in the toolbar/settings window
- Move, anchor edit, duplicate, delete, and property updates are undoable
- Session save/load and annotation export continue to use the edited drawable state

## v0.1.5 Internal Release

This release adds user-triggered local export for current annotations.

- Version aligned to `0.1.5` across app, bundle, and docs
- Export annotations PNG writes a transparent local image with drawings only
- Export annotations JSON writes sanitized drawables to a local JSON file
- Export uses native save dialogs and local filesystem writes only
- Malformed drawables are ignored safely before export rendering/serialization
- Annotated screenshot export is intentionally deferred until a clean native capture path is added

## v0.1.4 Internal Release

This release adds local session persistence for drawing annotations.

- Version aligned to `0.1.4` across app, bundle, and docs
- Save Session writes local `.trink.json` files through native file dialogs
- Load Session reads local session files and validates them safely
- Malformed drawable entries are ignored instead of crashing the canvas
- Dirty session state is tracked and exposed through a subtle unsaved indicator
- No cloud sync or remote storage was added

## v0.1.3 Internal Release

This release prepares TRInk for cleaner internal tester distribution.

- Version aligned to `0.1.3` across app, Tauri bundle, and docs
- Internal release packaging script added: `pnpm release:internal`
- Release folder now bundles installer, product docs, release notes, testing checklist, and SHA256 checksums
- README cleaned up for tester-facing distribution and artifact handoff
- Windows bundle metadata kept consistent around `TradeReality Ink` and `TRInk`
- Unsigned-installer behavior documented clearly for internal testers
- Branding asset unification now uses `public/logo.svg` as the primary visible logo and bundle icon source

## v0.1.2 Summary

- Compact horizontal toolbar redesign
- Compact and normal toolbar size modes
- Drawing target monitor setting
- Better Windows-first multi-monitor toolbar placement
- Expandable settings panel
- Updated TRInk icon and bundle metadata

## v0.1.1 Summary

- Split app into separate `overlay` and `toolbar` windows
- Toolbar remains usable while overlay is click-through
- Safer event-based state sync between windows

## v0.1 Summary

- Initial Tauri desktop overlay MVP
- Basic drawing tools
- Trading tools and manual marker annotations
- Settings persistence
- Tray menu
- Global hotkeys

## Known Limitations

- Single overlay window at a time
- Multi-monitor support is functional but still basic
- No advanced structured trading patterns yet
- No recent sessions list yet
- Installer is unsigned
- Some hotkeys may conflict with other software

## Safety Scope

TRInk remains a normal local desktop annotation overlay.

- No broker integration
- No browser extension behavior
- No broker DOM reading
- No screen scraping
- No process injection
- No DLL injection
- No anti-cheat bypass
- No stealth behavior
- No trading automation
- No credential access
- No telemetry by default
- No obfuscation
- No packers

## Install

1. Open the packaged release folder you intend to test.
2. Optionally verify `CHECKSUMS.txt`.
3. Run `TradeReality Ink_0.3.2_x64-setup.exe`.
4. Complete the normal Windows installer flow.
5. Launch TRInk from the Start Menu or installed executable.

## Uninstall

1. Close TRInk if it is running.
2. Open Windows Installed Apps / Apps & Features.
3. Find `TradeReality Ink`.
4. Run uninstall through the normal Windows flow.
5. Confirm the Start Menu entry and installed files are removed.

## How To Test

Use [TESTING.md](TESTING.md) as the runtime checklist. The highest-value internal checks are:

- install and first launch
- save and load session files
- export annotation PNG and JSON
- manual timer presets, drag, and pause/resume/reset
- select, move, and edit existing objects
- create and edit QM bullish/bearish patterns
- create and edit BOS / CHoCH / FVG / Sweep
- create and edit Horizontal Line / Vertical Marker / Ray / Fibonacci Retracement / Fibonacci Fan / Andrew's Pitchfork
- lock/unlock objects and reorder them
- invalid session file handling
- toolbar visibility and drag
- monitor target behavior
- click-through recovery
- drawing tools and undo/redo
- settings persistence
- uninstall and reinstall

## Reporting Issues

When reporting a bug, include:

- TRInk version
- Windows version
- monitor setup
- session file path if relevant
- exact steps to reproduce
- expected result
- actual result
- screenshots if relevant
- hotkey conflict details if relevant
