# TRInk Release Candidate Checklist

## Installer

- Installer launches
- Product name is `TradeReality Ink`
- Installer filename is `TradeReality Ink_0.3.11_x64-setup.exe`
- Installer sidebar is not crowded or clipped
- Installer branding is visible on welcome/progress pages
- SmartScreen warning is expected while the installer is unsigned

## Uninstall

- App appears in Windows Installed Apps / Apps & Features
- Uninstall completes cleanly
- Start Menu entry is removed

## Startup

- App starts quickly
- Toolbar shows `Starting TRInk...`
- Toolbar reaches `Ready`
- Installed build does not show an extra CMD / console window
- App starts in click-through mode
- `Select / Move` is the default tool on a fresh profile
- Overlay sync problems are visible in the toolbar if they occur
- Shortcut registration conflicts do not block launch

## First Run

- Welcome panel appears once on a fresh profile
- Welcome panel does not reappear after dismissal
- Welcome panel is short, clean, and not clipped
- Welcome panel explains click-through startup clearly
- "Got it, don't show again", Keybinds, and About buttons all work

## About / Identity

- About shows version `0.3.11`
- About shows publisher `TradeReality`
- About shows channel `beta`
- No login prompt appears anywhere in the desktop app

## Core Safety

- No network requirement to launch and draw
- No Expiry UI appears
- Timer wording remains neutral and manual
- No broker integration or automation behavior appears

## Key UX

- Keybind customization works
- Click-through works
- Drawing reaches all screen edges on the selected monitor (full-screen coverage)
- Toolbar drag handle (grip icon) is visible and dragging is stable
- Toolbar drag does not trigger accidental tool button actions
- System tray icon is visible in the Windows tray
- Tray menu shows Show/Hide, Open Settings, Quit
- Power/quit button on toolbar quits the app cleanly
- Palette window opens via chevron button, closes after tool selection, does not clip
- Settings window opens via gear icon, shows three tabs (General, Keybinds, About), closes via ✕
- Selecting Trend / Fib / Channel does not trap the user
- Pressing Esc cancels any in-progress partial drawing
- Switching tools while a drawing is in progress cancels it cleanly
- Sessions save/load using native file dialogs
- PNG/JSON export opens native file dialogs
- Better text editing works
- All core tool categories remain available

## Update Behavior

- No auto-update prompt appears anywhere in the desktop app
- About section confirms "Updates: manual download from TradeReality Tools" or equivalent
- UPDATER.md is present in the release package and correctly describes manual-only beta updates

## Release Package

- Beta package folder is `release/TRInk-0.3.11-beta/`
- `TradeReality Ink_0.3.11_x64-setup.exe` is present
- `CHECKSUMS.txt` is present and checksums match package contents
- `README.md`, `BETA_README.md`, `LICENSE.md`, `EULA.md`, `PRIVACY.md` are present
- `RELEASE_NOTES.md`, `TESTING.md`, `RC_CHECKLIST.md` are present
- `COMPATIBILITY.md`, `SIGNING.md`, `UPDATER.md` are present
- `logo.svg` and `logo-bg.svg` are present
- `tools-handoff/` directory is present with all 7 handoff files
- Release manifest confirms: no in-app login, no telemetry by default, no broker integration, no trading automation, local-only sessions and exports, Windows beta, free for registered users
