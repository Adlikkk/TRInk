# TRInk Beta Summary

TRInk is a local TradeReality annotation overlay for Windows.

Current beta version: **v0.3.11** — Emergency Overlay Bounds and Palette Tool Routing Fix.

## What's in This Release

v0.3.11 is an emergency bugfix pass addressing three critical Windows blockers. No new drawing tools. No broker integration, telemetry, cloud sync, or trading automation was introduced at any point in the TRInk beta.

Key fixes:
- Full-screen canvas fixed: overlay window starts at position `0,0`; CSS uses `position: fixed` so the canvas always covers the entire viewport
- Palette tool routing fixed: tools selected from the palette now draw correctly — settings-sync race condition eliminated
- Toolbar drag jitter fixed: RAF throttle on `setPosition` calls eliminates IPC flooding and edge-of-screen flicker
- Overlay debug display expanded with Tauri window outer/inner size; yellow corner markers added

## Cumulative Beta Highlights

- **4-window architecture**: palette and settings are separate Tauri windows — no more clipping
- Toolbar click-through fixed: toolbar always receives pointer events regardless of overlay draw mode
- Palette window: opens next to the toolbar, closes after tool selection
- Settings window: tabbed sections (General, Keybinds, Timer, Session, About)
- Welcome panel: shown inside the settings window on first install only
- Session notice toasts: compact banner below the toolbar, auto-dismiss after 4 seconds
- Full-screen overlay coverage: drawing spans the selected monitor edge to edge
- Toolbar drag handle with visible grip indicator
- System tray icon correctly displayed on Windows
- Tool switch cancels any in-progress partial drawing
- Branded NSIS installer with proper Windows DIB BMPs and no format warnings
- Local save/load sessions (`.trink.json`), PNG and JSON annotation export
- Editable objects with anchor editing, ordering, and locking
- Manual countdown timer with neutral wording
- Custom keybinds with conflict-aware registration; conflicts shown as a dot on the Settings button

## Beta Limits

- Windows-only distribution
- Unsigned installer — Windows SmartScreen warnings are expected
- No cloud sync
- No broker/platform connection
- No in-app login or account check
- No telemetry by default
- Automatic update system not active — manual download only
