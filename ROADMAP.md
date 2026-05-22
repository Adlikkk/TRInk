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

## Next

- Actual code signing once a certificate is available
- TradeReality app/web integration for registered-user downloads
- First registered-user beta release through the TradeReality Tools area

## Later

- Plugin-style tool packs
- Collaboration-safe import/export formats
- Optional updater flow
