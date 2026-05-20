# TradeReality Ink

TradeReality Ink, short name `TRInk`, is a Windows-first Tauri desktop overlay for local screen annotation. This MVP is built for educational chart markup, live teaching, and trading-video workflows.

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

## MVP Features

- Tauri v2 + React + TypeScript + Vite + TailwindCSS
- Transparent frameless always-on-top overlay window
- Floating draggable toolbar
- Canvas drawing layer with serializable drawables
- Basic tools: pen, highlighter, arrow, rectangle, text, eraser
- Editing actions: undo, redo, clear, hide/show drawings
- Overlay modes: draw mode and click-through mode
- Global hotkeys for visibility, tools, edit actions, and click-through toggle
- Trading-first tools: trend, channel, support/resistance zone
- Binary options annotation tools: CALL marker, PUT marker, expiry line
- Local settings persistence using browser local storage
- System tray menu for show/hide, settings, and quit

## Tech Structure

- `src/types`: serializable object model and settings types
- `src/state`: reducer-based drawing state and history
- `src/lib`: tool definitions, geometry, rendering, settings persistence, Tauri bridge
- `src/components`: canvas surface, toolbar, settings panel
- `src-tauri`: desktop shell, tray, commands, and global shortcuts

## Commands

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm tauri dev
```

## Global Hotkeys

- `Ctrl+Shift+Space`: toggle overlay visibility
- `Ctrl+Shift+P`: pen
- `Ctrl+Shift+H`: highlighter
- `Ctrl+Shift+A`: arrow
- `Ctrl+Shift+R`: rectangle
- `Ctrl+Shift+T`: text
- `Ctrl+Shift+E`: eraser
- `Ctrl+Shift+X`: toggle click-through mode
- `Ctrl+Z`: undo
- `Ctrl+Y`: redo
- `Ctrl+Shift+Backspace`: clear

## Local Development

1. Install prerequisites:
   - Node.js 20+
   - `pnpm`
   - Rust toolchain
   - Microsoft Visual Studio C++ Build Tools for Tauri on Windows
   - WebView2 Runtime
2. Install dependencies:

```bash
pnpm install
```

3. Start the desktop app:

```bash
pnpm tauri dev
```

4. Create a production frontend build:

```bash
pnpm build
```

## Current Notes

- Settings are stored locally in browser local storage for the overlay webview.
- The toolbar is draggable within the overlay surface.
- Click-through mode uses the Tauri window cursor-ignore API on the main overlay window.
- Placeholder branding asset: [src/assets/trink-mark.svg](src/assets/trink-mark.svg)

## Still Missing After v0.1

- Rich text editing controls
- Additional trading patterns from the full product vision
- Settings import/export
- Multi-monitor window presets
- Save/load drawing sessions
- Dedicated countdown timer
- Automated tests
