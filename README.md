# TradeReality Ink

TradeReality Ink (`TRInk`) is a Windows-first desktop overlay for local screen annotation.

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

- Two-window overlay architecture: `overlay` + `toolbar`
- Compact grouped tool palette and favorites
- Local session save/load using `.trink.json`
- Local PNG and JSON annotation export
- Editable objects with anchors, ordering, and locking
- Better text editing with multiline support and styling
- Manual countdown timer with neutral wording
- Custom keybinds with conflict-aware registration
- Windows NSIS installer packaging

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
- A one-time welcome panel explains the safety scope and links to Settings and Keybinds
- The About section shows version, publisher, build channel, and distribution identity

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

- `src-tauri/target/debug/trink.exe`
- `src-tauri/target/debug/bundle/nsis/TradeReality Ink_0.3.2_x64-setup.exe`
- `release/TRInk-0.3.2-internal/`
- `release/TRInk-0.3.2-beta/`

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
- Multi-monitor behavior is stable but still not a full multi-overlay system
- Annotated screenshot capture is intentionally not included
