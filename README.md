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
- Object selection with `Ctrl+click` and `Delete`
- Overlay modes: draw mode and click-through mode
- Global hotkeys for visibility, tools, edit actions, and click-through toggle
- Trading-first tools: trend, channel, support/resistance zone
- Binary options annotation tools: CALL marker, PUT marker, expiry line
- Local settings persistence with validation and fallback defaults
- System tray menu for show/hide, settings, and quit
- Lightweight tests for reducer, settings normalization, and drawable validation

## Tech Structure

- `src/types`: serializable object model and settings types
- `src/state`: reducer-based drawing state and immutable history
- `src/lib`: tool definitions, geometry, drawable validation, rendering, settings persistence, Tauri bridge
- `src/components`: canvas surface, toolbar, settings panel
- `src-tauri`: desktop shell, tray, commands, and global shortcuts

## Commands

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
cargo check
pnpm tauri dev
pnpm tauri build --debug
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

## Click-Through Mode

Click-through mode makes the overlay window ignore mouse input at the native window level so the underlying chart, browser, or desktop app can be clicked normally.

- Toggle it with `Ctrl+Shift+X`
- Exit it again with `Ctrl+Shift+X` or the tray menu
- The app stays visible while the mouse passes through it
- This mode does not inspect or read the underlying application

## Internal Testing Checklist

- `pnpm tauri dev` launches the overlay window on Windows
- Toolbar renders and can be dragged without leaving the visible screen
- Pen and highlighter strokes draw correctly and stop cleanly
- Rectangle, arrow, and S/R zone previews match final shapes
- Text input can be placed, confirmed, and cancelled with `Esc`
- Eraser removes objects predictably without corrupting undo/redo history
- Trend tool supports add point, `Backspace`, `Esc`, and right-click finish
- Channel tool supports staged placement, `Backspace`, `Esc`, and finish
- CALL, PUT, and expiry markers remain readable on dark and bright backgrounds
- `Ctrl+click` selects an object and `Delete` removes it
- Undo, redo, clear, hide/show, and click-through work after multiple edits
- Settings survive restart and recover from invalid stored values
- Tray menu can show/hide the overlay, open settings, and quit

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

4. Run the lightweight tests:

```bash
pnpm test
```

5. Create a debug desktop build:

```bash
pnpm tauri build --debug
```

## Windows Debug Build Output

After `pnpm tauri build --debug`, the main outputs are:

- `src-tauri/target/debug/trink.exe`
- `src-tauri/target/debug/bundle/nsis/TradeReality Ink_0.1.0_x64-setup.exe`

## Troubleshooting

- If `pnpm` fails in PowerShell because script execution is disabled, use `pnpm.cmd ...` instead.
- If a global hotkey is already owned by another application, TRInk logs the conflict and keeps running. Free the hotkey in the other app or use the toolbar/tray as a fallback.
- If settings appear broken, close the app and remove the `trink.settings.v0.1` entry from the WebView local storage used by the app profile.
- If click-through mode seems to make the app unclickable, that is expected native behavior. Use `Ctrl+Shift+X` or the tray menu to return to draw mode.
- If Tauri build fails on Windows, verify WebView2 Runtime and Visual Studio C++ Build Tools are installed.

## Known Limitations

- Click-through mode is global for the overlay window; the toolbar is not mouse-usable until draw mode is restored.
- Multi-monitor behavior is still basic and not yet tuned for complex desktop layouts.
- Drawings are serializable in memory, but save/load sessions are not implemented yet.
- Text editing is intentionally minimal for v0.1.
- Some hotkeys may conflict with other software on the machine.

## Current Notes

- Settings are stored locally and validated before use.
- Malformed drawables are ignored during rendering instead of crashing the canvas.
- Placeholder branding asset: [src/assets/trink-mark.svg](/d:/Bussines/MetaTrader/PROJECTS/TRInk/src/assets/trink-mark.svg)

## Still Missing After v0.1

- Save/load drawing sessions
- Better multi-monitor support
- Richer text editing
- More advanced structured trading patterns
- Dedicated countdown timer
