# Roadmap

## v0.1

- Tauri v2 Windows-first overlay shell
- Floating toolbar
- Basic drawing tools
- Trading annotations
- Binary options annotations
- Tray menu
- Local settings persistence with validation
- Reducer/settings/drawable validation tests
- Internal stabilization pass for local desktop reliability

## v0.1.1

- Split architecture into dedicated `overlay` and `toolbar` windows
- Keep toolbar clickable while canvas overlay is click-through
- Window-targeted event sync between toolbar and overlay
- Persist and clamp native toolbar window position

## v0.1.2

- Compact horizontal toolbar redesign
- Toolbar size modes with local persistence
- Drawing target monitor setting for the overlay canvas
- Independent toolbar placement across monitors
- Expandable settings panel inside the toolbar window
- Updated TRInk icon asset and bundle metadata
- Windows-first installer/output polish

## v0.1.3

- Internal release packaging script
- Release folder structure for tester handoff
- SHA256 checksums for internal artifacts
- README cleanup and relative asset links
- Release notes and tester checklist
- Version consistency across app, bundle, and docs
- Distribution safety notes for unsigned internal builds

## v0.1.4

- Local save/load drawing sessions
- Session schema validation and malformed drawable fallback
- Dirty session tracking and unsaved indicator
- Native file dialogs for session save/load
- Local-only session storage documentation
## v0.1.5

- User-triggered annotation PNG export
- User-triggered annotation JSON export
- Local-only export documentation and tester checklist
- Safe export sanitization for malformed drawables

## v0.2.0

- Editable anchors and object properties
- Select and move workflow for existing objects
- Compact selected-object property panel
- Undoable move/anchor/property edits
- Save/load/export compatibility for edited objects

## v0.2.1

- Manual editable QM / Quasimodo bullish and bearish tools
- Guided 5-point QM placement flow
- QM rendering, anchors, property toggles, and export/session compatibility

## v0.2.2

- Manual editable BOS / CHoCH / FVG / Liquidity Sweep tools
- Structured price-action hit-testing and property editing
- Session/export compatibility for the new price-action drawables

## v0.2.3

- Manual local countdown timer widget
- Toolbar and settings timer controls
- Local-only timer persistence for visibility, position, duration, size, and opacity
- Explicit exclusion of timer state from sessions and annotation exports
- Legacy Expiry tool demoted from promoted UI paths

## v0.2.4

- Removed legacy Expiry from all user-facing UI
- Kept safe compatibility handling for older files with legacy vertical markers
- Timer wording audit to keep countdown UX generic and neutral

## v0.2.5

- Core Chart Tools Pack
- Horizontal Line
- Vertical Marker
- Ray
- Fibonacci Retracement
- Fibonacci Fan
- Andrew's Pitchfork
- Selection/edit/export/session compatibility for all six chart tools

## v0.2.6

- Grouped tool palette
- Compact grouped overflow sections
- Favorites polish with grouped picker and reset flow
- Lightweight recent tools
- Keep Expiry excluded from all user-facing tool lists

## v0.2.7

- Object ordering controls
- Bring forward / backward
- Bring to front / send to back
- Object locking
- Order and lock compatibility with save/load/export/undo
- Keep per-object hidden state deferred until a real layers list exists

## v0.2.8

- Custom keybind settings
- Conflict-aware global shortcut registration
- Shortcut recording, reset controls, and settings migration
- Internal release packaging script retry/polling polish

## v0.2.9

- Custom Fibonacci levels for retracement and fan
- Fibonacci label formatting polish
- Fib Retracement extend left/right
- Andrew's Pitchfork variant and line-visibility polish
- Save/load/export compatibility for the new Fib/Pitchfork properties

## v0.3.0

- Public beta packaging preparation
- Beta release package structure and handoff docs
- Signing-preparation documentation
- Legal/safety doc consistency pass

## v0.3.1

- Brand launch polish
- Lightweight startup state and first-run welcome
- About/build info panel
- TradeReality Tools handoff assets
- TradeReality app/web distribution wording
- Beta package updates for TradeReality Tools review

## v0.3.2

- TradeReality Tools release manifest
- Expanded TradeReality Tools handoff files
- Release-candidate QA checklist
- Beta package structure polish for upload review

## v0.3.6

- Window architecture fix for RC blockers
- Palette and settings promoted to separate Tauri windows (no more window-bounds clipping)
- Toolbar click-through fix: toolbar always receives pointer events; z-order re-asserted in setup
- Session notice toasts: compact banner below the toolbar with auto-dismiss
- Welcome panel moved into settings window; shown on first install only
- Settings sync broadcasts to all four windows (overlay, toolbar, palette, settings)
- Toolbar snapshot includes shortcutStatuses for settings window display
- Tray overlay toggle also hides palette and settings windows
- Overlay debug bounds card retains all diagnostic fields from v0.3.5

## v0.3.5

- Real Windows RC fix pass
- Overlay debug bounds mode (canvas CSS size, backing size, DPR, pointer coords)
- Toolbar quit button (Power icon) for clean process exit
- Compact shortcut conflict badge ("N conflicts"); full detail in Settings > Keybinds
- `returnToSelectAfterDraw` setting: auto-return to Select after any structured drawing
- `overlayDebugBounds`, `returnToSelectAfterDraw`, `checkForUpdates` settings; SETTINGS_VERSION 7
- `logo-bg.svg` used throughout toolbar, settings, welcome panel, and installer
- `pnpm assets:installer` script to regenerate NSIS BMPs from SVG using sharp
- `docs/UPDATER.md`: safe update strategy documentation
- `quit_app` Tauri command registered and wired to toolbar button
- Welcome panel text shortened; primary dismiss button renamed

## v0.3.4

- Final Windows RC UX polish pass
- Installer branding cleanup direction (sidebar less crowded, logo-bg.svg asset added)
- Welcome panel simplified: shorter text, cleaner layout, reduced window size
- Toolbar drag handle with visible grip indicator; compact mode removes text label
- System tray icon wired to app window icon for correct Windows tray display
- Full-screen overlay coverage: PhysicalPosition/PhysicalSize fix for correct cross-DPI monitor placement
- Tool interaction recovery: switching tools cancels any in-progress partial drawing
- `getMonitorPhysicalFrame` utility and expanded monitor-utils tests

## v0.3.3

- Critical startup defaults polish
- Full-screen overlay monitor coverage fixes
- Stable toolbar dragging and expanded window sizing for palette/settings
- Shortcut conflict dedupe in the toolbar UI
- Branded NSIS installer assets and metadata polish
- Installed Windows launch without an extra console window

## v0.2.11

- Save/load/export compatibility hardening
- Drawable compatibility matrix
- Fixture-backed session/export regression coverage
- Consistent malformed-file fallback and compact skipped-annotation notices

## v0.2.10

- Better text editing polish
- Multiline text entry
- Styled text properties for weight, alignment, background, border, padding, and radius
- Save/load/export compatibility for styled text objects

## v0.3.8

- Hard RC bugfix pass based on real Windows screenshots
- Toolbar window widened (compact 760→860 px, normal 920→1040 px) to stop right-side controls clipping
- Drag/logo handle gets `shrink-0` to prevent collapse and overlap with tool buttons
- Palette tool routing fix: selecting any drawing tool from palette now auto-exits click-through mode
- Toolbar z-order re-asserted on every click-through toggle
- Settings panel five-tab layout (General, Keybinds, Timer, Session, About)
- NSIS BMP assets rewritten as proper Windows DIB 24-bit BMPs; eliminates warning 5040
- SETTINGS_VERSION bumped to 8; welcome panel migration for existing users

## v0.3.7

- Final beta package lock for first TradeReality Tools distribution
- UPDATER.md added to beta release package
- README and BETA_README expanded with palette/settings workflow, save/load/export, quit, and update behavior
- RC_CHECKLIST expanded with update-behavior and package-contents sections
- Docs version stamps aligned across UPDATER.md, COMPATIBILITY.md, SIGNING.md
- Release manifest and handoff files aligned to 0.3.7
- No new features; no broker integration, telemetry, cloud sync, or trading automation

## v0.3.9

- Surgical RC fix pass: toolbar clipping and Quit button visibility
- Conflict badge replaced with amber dot on Settings button — variable-width badge removed
- Favorite tools capped: compact 6, normal 8 — prevents layout overflow
- Esc key cancels any in-progress partial drawing on the overlay canvas
- `cancel-active-drawing` overlay command added to protocol and wired in overlay handler

## v0.3.10

- Core input and overlay bounds fix based on real Windows RC testing
- First-click race fixed: reactive `setClickThrough` effect so OS flag is set after React commits CSS change
- Full-screen overlay fixed: `applyMonitorBounds` falls back to first available monitor when `primaryMonitor()` returns null
- Toolbar drag jitter fixed: pointer capture replaces native `startDragging()`, eliminating the `onMoved` feedback loop
- Overlay debug bounds panel expanded with wrapper rect, document dimensions, and screen pointer coordinates

## v0.3.11

- Emergency overlay bounds and palette tool routing fix
- Full-screen canvas: overlay window starts at `0,0`; CSS uses `position: fixed; inset: 0; 100vw/100vh`
- Palette tool routing: settings-sync race eliminated — toolbar includes correct `defaultMode` on tool select
- Toolbar drag jitter: RAF throttle on `setPosition` calls eliminates IPC flooding and edge flicker
- Overlay debug panel: window outer/inner size from Tauri API; yellow corner markers; `isDrawableTool` helper added
- `setFullscreen(false)` removed from `applyMonitorBounds`; overlay window set `resizable: true`

## Next

- Actual code signing once a certificate is available
- TradeReality Tools upload and listing
- First registered-user beta release through the TradeReality Tools area

## Later

- Plugin-style tool packs
- Collaboration-safe import/export formats
- Optional updater flow
