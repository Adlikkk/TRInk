# TradeReality Ink

TradeReality Ink (`TRInk`) is a Windows-first desktop overlay for local screen annotation.

## Editions

This repository now builds two editions from one codebase.

| Edition | Audience | Scope |
| --- | --- | --- |
| `TRInk Basic` | presenters, educators, video creators, simple markup users | lightweight local annotation overlay with basic drawing tools only |
| `TRInk Trading` | traders and trading educators | the current full TradeReality edition with chart, price-action, session, export, and timer tools |

Build commands:

- `pnpm dev:basic`
- `pnpm dev:trading`
- `pnpm build:basic`
- `pnpm build:trading`
- `pnpm release:basic`
- `pnpm release:trading`

It is distributed as a free bonus tool through the TradeReality app/web Tools area for registered users. The desktop app itself remains local-only and does not require in-app login, cloud access, or broker connectivity.

## What TRInk Is

- A fast local overlay for chart markup, review, education, and trading video workflows
- A manual annotation tool with sessions, exports, text, chart tools, and structured markup tools
- A standalone desktop app built with Tauri, React, TypeScript, and Rust

## What TRInk Is Not

- Not financial advice
- Not a trading signal product
- Not broker integration
- Not trading automation
- Not a browser extension
- Not a platform bypass tool
- Not a cloud sync product
- Not an Expiry or trade-timing tool

## Safety Scope

TRInk is intentionally limited to normal desktop overlay behavior.

- No broker DOM reading
- No screen scraping
- No credential access
- No process injection or DLL injection
- No anti-cheat bypass
- No stealth behavior
- No telemetry by default
- No cloud sync
- No automatic upload
- No obfuscation or suspicious packers

## Core Capabilities

- Four-window overlay architecture: `overlay`, `toolbar`, `palette`, `settings`
- Compact grouped tool palette and favorites
- Local session save/load using `.trink.json`
- Local PNG and JSON annotation export
- Editable objects with anchors, ordering, and locking
- Better text editing with multiline support and styling
- Manual countdown timer with neutral wording
- Custom keybinds with conflict-aware registration
- Branded Windows NSIS installer packaging

## Included Tool Groups

- Basic: Select, Pen, Highlighter, Arrow, Rectangle, Text, Eraser
- Chart: Horizontal Line, Vertical Marker, Ray, Trend Line, Parallel Channel, Fibonacci Retracement, Fibonacci Fan, Andrew's Pitchfork
- Price Action: Support/Resistance, QM Bullish/Bearish, BOS, CHoCH, FVG, Liquidity Sweep
- Utility: CALL marker, PUT marker, manual timer

## Local-Only Sessions and Exports

Sessions and exports stay on the local machine.

- Sessions use `.trink.json`
- PNG export contains annotations only
- JSON export contains sanitized annotations only
- Timer state is excluded from sessions and exports
- Unsupported or malformed drawables are skipped safely instead of crashing

## Launch and First Run

- Toolbar startup is lightweight and local-only
- The toolbar can show `Starting TRInk...` while overlay sync completes
- A short `Ready` state appears after the first successful sync
- TRInk starts in click-through mode by default so the desktop remains usable on launch
- `Select / Move` is the default tool on a fresh profile, not `Pen`
- A one-time welcome panel explains the safety scope and links to Settings and Keybinds
- The About section shows version, publisher, build channel, and distribution identity
- Installed builds should launch without an extra CMD or console window

## Moving the Toolbar

The toolbar has a grip handle on its left side (dot-grid icon). Drag that area to reposition the toolbar anywhere on screen. The handle is visually distinct from the tool buttons so dragging does not accidentally activate tools.

## Opening the Tool Palette and Settings

Click the **chevron (▾)** button on the toolbar to open the full tool palette in its own floating window. Click any tool to select it — the palette closes automatically.

Click the **gear icon** on the right side of the toolbar to open the Settings window. Settings tabs: General, Keybinds, About. Close with the ✕ button.

## Save, Load, and Export

- **Save session** (default Ctrl+S): opens a native file dialog; saves as `.trink.json`
- **Load session** (default Ctrl+O): opens a native file dialog; replaces the current canvas
- **Export PNG**: annotation-only PNG; toolbar UI and timer are excluded
- **Export JSON**: sanitized annotation JSON; malformed drawables skipped safely

## Quitting

Click the **Power icon** on the right side of the toolbar, or right-click the system tray icon and choose **Quit**.

## Update Behavior

TRInk does not auto-update in beta. When a new version is available through the TradeReality Tools area, download the new installer and run it in-place. Automatic installation will require signed update packages from a TradeReality-controlled endpoint — this is not yet active.

## Cancelling a Drawing in Progress

While using Trend, Fib, Channel, Pitchfork, QM, or Sweep:

- Press **Esc** to cancel the current partial drawing at any point
- Click any other tool in the toolbar to switch — the partial drawing is cancelled automatically
- Right-click finalises some tools early (Trend, QM, Sweep)

## Full-Screen Overlay Coverage

The overlay window is positioned using physical pixel coordinates so it correctly spans the selected monitor edge to edge, including on multi-monitor setups with different DPI scales.

## Distribution

TRInk does not have a standalone landing page.

Distribution is intended to happen through the TradeReality app/web Tools area, which can provide:

- download access
- version information
- checksums
- release notes
- install instructions

TRInk itself does not perform account checks or network authentication.

## Packaging

Build the debug installer:

```bash
pnpm install
pnpm build
cargo check
pnpm tauri build --debug
```

Create release folders:

```bash
pnpm release:internal
pnpm release:beta
```

Key outputs:

- `src-tauri/target/debug/trink.exe` (debug build)
- `src-tauri/target/debug/bundle/nsis/TradeReality Ink_0.3.11_x64-setup.exe`
- `release/TRInk-0.3.11-internal/`
- `release/TRInk-0.3.11-beta/`

## Main Docs

- [BETA_README.md](BETA_README.md)
- [RC_CHECKLIST.md](RC_CHECKLIST.md)
- [RELEASE_NOTES.md](RELEASE_NOTES.md)
- [TESTING.md](TESTING.md)
- [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)
- [docs/SIGNING.md](docs/SIGNING.md)
- [EULA.md](EULA.md)
- [LICENSE.md](LICENSE.md)
- [PRIVACY.md](PRIVACY.md)

## Current Limitations

- Windows-first implementation
- Installer is still unsigned
- SmartScreen warnings are expected until production signing is in place
- The NSIS installer is branded, but it still uses the normal NSIS page structure
- Multi-monitor behavior is stable but still not a full multi-overlay system
- Annotated screenshot capture is intentionally not included
