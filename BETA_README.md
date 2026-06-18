# TRInk Beta Readme

TradeReality Ink (`TRInk`) is a local Windows annotation overlay distributed through the TradeReality Tools area for registered users.

Version: `0.3.11`

## Quick Summary

TRInk helps with:

- chart markup
- trade review
- education
- video walkthroughs

TRInk does not provide:

- financial advice
- trading signals
- broker integration
- trading automation
- platform bypasses
- in-app login

## Install

1. Download `TradeReality Ink_0.3.10_x64-setup.exe`.
2. Run the installer.
3. Launch `TradeReality Ink` from Start Menu or the installed shortcut.
4. Review the short first-run welcome panel.

## Uninstall

1. Close TRInk.
2. Open Windows Installed Apps / Apps & Features.
3. Find `TradeReality Ink`.
4. Run the normal uninstall flow.

## Unsigned Beta Note

Current beta installers are unsigned.

- Windows SmartScreen warnings are expected.
- This is normal for the current beta phase.
- Do not use repacked or unofficial installers.

## First-Run Expectations

- Overlay window appears on the selected drawing monitor and covers it fully edge to edge
- Toolbar window appears
- Toolbar briefly shows `Starting TRInk...`, then `Ready`
- TRInk starts in click-through mode so your desktop or browser remains usable
- `Select / Move` is the default tool on a fresh profile
- Use the click-through toggle or pick a drawing tool when you want to draw
- Save/load/export actions open native dialogs

## Moving the Toolbar

Grab the grip handle on the left side of the toolbar (the dot-grid icon) and drag it anywhere on screen.
The toolbar can be repositioned freely.

## Opening the Tool Palette

Click the **chevron (▾)** button on the toolbar to open the full tool palette. The palette opens in its own floating window next to the toolbar. Click any tool to select it — the palette closes automatically. Click the chevron again (or click outside) to close without selecting.

## Opening Settings

Click the **gear icon** on the right side of the toolbar to open the Settings window. Settings has three tabs: General (toolbar options, monitor, debug), Keybinds (shortcut customization), and About (version, publisher, channel). Close the Settings window by clicking the ✕ button.

## Save, Load, and Export

- **Save session**: use the keybind (default Ctrl+S) or the Settings > Keybinds section to trigger it. A native file dialog opens. Sessions are saved as `.trink.json` files.
- **Load session**: use the keybind (default Ctrl+O) or the menu. A native file dialog opens. Loading replaces the current canvas.
- **Export PNG**: exports annotation-only PNG to a file you choose. Timer and toolbar UI are not included.
- **Export JSON**: exports a sanitized JSON annotation file. Malformed drawables are skipped safely.

## Quitting

Click the **Power icon** on the right side of the toolbar, or right-click the system tray icon and choose **Quit**.

## Update Behavior

TRInk does not auto-update. When a new version is released through the TradeReality Tools area, download the new installer and run it. The installer replaces the existing install in-place.

## Cancelling a Drawing in Progress

While using Trend, Fib, Channel, Pitchfork, or other multi-point tools:

- Press **Esc** to cancel the partial drawing at any time
- Click any other tool button to switch away — the partial drawing is cancelled automatically
- Right-click finalises some tools early (Trend, QM, Sweep)

## Known Limits

- Windows-only build
- No in-app login
- No broker/platform connection
- No cloud sync
- No annotated screenshot capture
- Installer is still unsigned, so SmartScreen warnings are expected

## Bug Reports

Include:

- version number
- what you were doing
- exact error text if visible
- whether the issue involved hotkeys, monitors, sessions, or exports

## Local-Only Safety

- No broker integration
- No trading automation
- No chart DOM reading
- No telemetry by default
- No cloud sync
- No Expiry UI
