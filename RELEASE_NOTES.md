# TRInk Release Notes

## v0.3.11 Emergency Overlay Bounds and Palette Tool Routing Fix

- Version aligned to `0.3.11`
- **Full-screen canvas fix**: overlay window now starts at position `0,0` with initial size `1920×1080`; CSS uses `100vw/100vh` with `position: fixed; inset: 0` (`.overlay-root`) so the canvas always covers the full viewport regardless of the percentage-chain inheritance depth
- **Palette tool routing fix**: settings-sync race condition eliminated — toolbar now includes the correct `defaultMode: "draw"` when syncing after a drawing tool selection; overlay no longer overwrites `defaultMode` in its `set-tool` handler, preventing the next toolbar sync from reverting the overlay back to click-through before the first drawing click
- **Toolbar drag jitter fix**: `handleDragPointerMove` now throttles `setPosition` calls through `requestAnimationFrame`, and pending RAF is cancelled in `handleDragPointerUp` — eliminates IPC flooding and edge-of-screen flicker
- **Overlay debug display expanded**: window outer position, outer size, and inner size polled every 2 seconds and shown in the debug panel; yellow corner markers added to the canvas border; `isDrawableTool` helper exported from tool-definitions
- **`setFullscreen(false)` removed**: call removed from `applyMonitorBounds` — it could interfere with subsequent `setPosition`/`setSize` calls on Windows
- **Overlay window `resizable: true`**: allows Tauri to correctly resize the overlay window when `applyMonitorBounds` runs for non-primary monitors
- No new drawing tools; no broker integration, telemetry, cloud sync, or trading automation

## v0.3.10 Core Input and Overlay Bounds Fix

- Version aligned to `0.3.10`
- **First-click race fixed**: `setClickThrough` is now driven by a reactive `useEffect` on `overlayMode` state — the OS click-through flag is set only after React commits the CSS `pointer-events` change, eliminating the race where the first click after tool selection was swallowed
- **Full-screen overlay fixed**: `applyMonitorBounds` now falls back to the first available monitor when `primaryMonitor()` returns null, preventing the overlay from staying at 1600×900 on systems where the Tauri primary monitor query fails
- **Toolbar drag jitter fixed**: drag handles now use pointer capture (`onPointerDown`/`onPointerMove`/`onPointerUp`) instead of native `startDragging()` — clamping happens client-side and the `onMoved` feedback loop is eliminated
- **Debug display expanded**: overlay debug bounds panel now shows wrapper `getBoundingClientRect`, document client dimensions, and screen pointer coordinates in addition to CSS/canvas/DPR
- No new drawing tools; no broker integration, telemetry, cloud sync, or trading automation

## v0.3.9 Surgical RC Fix Pass

- Version aligned to `0.3.9`
- **Toolbar clipping fixed**: conflict badge and "Ready" pill removed from main toolbar; Quit button is now always visible regardless of shortcut conflict state
- **Shortcut conflicts indicator**: replaced the variable-width conflict badge with a small amber dot on the Settings button — conflicts are still actionable from Settings > Keybinds
- **Favorites capped**: compact toolbar shows at most 6 favorite tools; normal toolbar shows at most 8 — prevents layout overflow when many favorites are set
- **Esc cancels drawing**: pressing Esc on the overlay canvas cancels any in-progress partial drawing (trend, channel, Fibonacci, pitchfork, QM, etc.)
- **`cancel-active-drawing` command added**: new `OverlayCommand` type for future toolbar-initiated drawing cancellation; wired into the overlay command handler
- No new drawing tools; no broker integration, telemetry, cloud sync, or trading automation

## v0.3.8 Hard RC Bugfix Pass

- Version aligned to `0.3.8`
- **Toolbar clipping fixed**: compact window widened from 760 to 860 px, normal from 920 to 1040 px so right-side controls are no longer cut off
- **Drag handle fixed**: drag/logo div gets `shrink-0` so it can no longer collapse and visually overlap the tool buttons
- **Palette tool routing fixed**: selecting any non-select drawing tool from the palette now automatically exits click-through mode and enters draw mode so the tool actually draws
- **Toolbar z-order hardened**: `set_click_through` in Rust re-asserts `toolbar.set_always_on_top(true)` after every overlay cursor event change
- **Settings panel tabs**: five tabs (General, Keybinds, Timer, Session, About) replace the single long scroll; `focusSection` now switches the active tab instead of scroll-into-view
- **NSIS installer BMP fix**: `scripts/assets-installer.js` rewritten to generate proper Windows DIB 24-bit BMPs manually, eliminating NSIS warning 5040 "Unsupported format"
- **Settings migration**: `SETTINGS_VERSION` bumped to 8; existing users with stored settings below version 8 get `welcomeDismissed` forced to `true` so the welcome panel does not re-appear after upgrade
- No new drawing tools; no broker integration, telemetry, cloud sync, or trading automation

## v0.3.7 Final Beta Package Lock

- Version aligned to `0.3.7`
- First TradeReality Tools public beta release — no new features; package and documentation consistency pass
- UPDATER.md added to the beta release package
- README and BETA_README expanded: palette/settings open workflow, save/load/export steps, quit instructions, and update behavior documented
- RC_CHECKLIST expanded with update-behavior section, palette/settings window checks, and explicit package contents list
- Docs version stamps updated: UPDATER.md, COMPATIBILITY.md, and SIGNING.md aligned to current version
- Release manifest and handoff files aligned to 0.3.7
- No code changes; no new features; no broker integration, telemetry, cloud sync, or trading automation

## v0.3.6 Window Architecture Fix for RC Blockers

- Version aligned to `0.3.6`
- **4-window architecture**: palette and settings are now separate Tauri windows — no more clipping by toolbar window bounds
- Toolbar click-through fixed: toolbar always receives pointer events; z-order re-asserted in setup so toolbar sits above the overlay
- Palette window: opens adjacent to the toolbar, closes automatically after tool selection; never clipped
- Settings window: opens as a standalone scrollable window; tabbed sections; close button always visible
- Welcome panel: moved into the settings window; shown automatically on first install; "Got it, don't show again" dismisses it permanently
- Session notice toasts: compact banner below the toolbar row; window height adjusts for notice/no-notice states
- Overlay hide/show via tray now also hides palette and settings windows
- Settings sync broadcasts to all four windows (overlay, toolbar, palette, settings) to keep state consistent
- Toolbar snapshot now includes `shortcutStatuses` so the settings window can display keybind conflict info
- Overlay debug bounds mode: CSS size, backing store size, DPR, active tool, pointer coords

## v0.3.5 Real Windows RC Fix Pass

- Version aligned to `0.3.5`
- Overlay debug bounds mode: enable in Settings to see canvas CSS size, backing store size, DPR, and pointer coordinates as a compact diagnostic panel with a cyan border
- Toolbar quit button: Power icon on the far right of both the ready toolbar and startup toolbar
- Compact shortcut conflict badge: shows "N conflicts" instead of the full shortcut name; full detail available in Settings > Keybinds
- `returnToSelectAfterDraw` setting (default true): automatically switches back to Select after completing any structured drawing (excludes freehand pen, highlighter, text, and eraser)
- `overlayDebugBounds` and `checkForUpdates` settings added; `SETTINGS_VERSION` bumped to 7
- `logo-bg.svg` used in toolbar, settings header, about section, and welcome panel
- Welcome panel shortened further; primary button renamed "Got it, don't show again"
- Settings panel: overlay debug toggle, returnToSelectAfterDraw toggle, update check placeholder in About section
- `pnpm assets:installer` script added: generates NSIS BMPs from `public/logo-bg.svg` using sharp
- `docs/UPDATER.md` added: documents safe update requirements for future production release
- `quit_app` Tauri command added; toolbar Power button invokes it for clean process exit

## v0.3.4 Final Windows RC UX Fixes

- Version aligned to `0.3.4`
- Simplified welcome panel: shorter text, cleaner layout, no clipping
- Toolbar drag handle now shows a visible grip indicator (GripVertical); text label removed from compact mode so the logo has more breathing room
- Full-screen overlay coverage fixed: window positioning now uses `PhysicalPosition` and `PhysicalSize` so the overlay correctly spans the selected monitor regardless of DPI or which monitor the window was on when the resize call executed
- Tray icon is now explicitly wired to the app window icon so it appears correctly on Windows
- Switching tools while a partial drawing is active now cancels the incomplete drawing cleanly — no more stuck interaction states after selecting Trend, Fib, Channel, etc.
- Added `getMonitorPhysicalFrame` utility; existing `getMonitorFrame` documented as returning logical CSS pixels
- Added monitor-utils tests covering physical frame, negative-coordinate monitors, and HiDPI logical dimensions

## v0.3.3 Critical UX, Overlay, Installer, and Startup Fixes

- Version aligned to `0.3.3`
- Changed first-run defaults to `Select / Move` plus click-through startup
- Hardened overlay monitor sizing and canvas resize sync for full-screen drawing coverage
- Stabilized toolbar dragging and expanded toolbar window sizing for palette/settings visibility
- Reduced shortcut conflict notice noise with per-session dedupe
- Added branded NSIS installer images and installer metadata polish
- Configured installed Windows app launches to avoid showing an extra console window

## v0.3.2 TradeReality Tools Integration Package and RC QA

- Version aligned to `0.3.2`
- Added a machine-readable TradeReality Tools release manifest
- Added RC checklist and expanded handoff docs
- Kept the desktop app local-only with no in-app login, no telemetry, and no broker connectivity

## v0.3.1 Brand Launch Polish and TradeReality Tools Handoff

- Added branded startup feedback with `Starting TRInk...` and `Ready`
- Added first-run welcome and About panel
- Added initial TradeReality Tools handoff assets

## v0.3.0 Beta Packaging Prep

- Added beta packaging flow
- Added signing-preparation docs
- Added beta handoff docs and checksums

## Earlier Releases

`v0.1.0` through `v0.2.11` built the current overlay architecture, drawing/editing system, local sessions/exports, timer, chart tools, structured markup tools, object ordering/locking, compatibility hardening, and text editing improvements.
