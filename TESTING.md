# TRInk Testing Checklist

See [RC_CHECKLIST.md](RC_CHECKLIST.md) for the final release-candidate pass.

## Install and Launch

- Installer launches
- Installer sidebar branding is visible and not clipped or crowded
- Installer branding is visible and not just the default tiny NSIS icon
- Product name is `TradeReality Ink`
- App starts after install
- Installed app launch does not show an extra CMD / console window
- Overlay window appears
- Toolbar window appears
- Toolbar briefly shows `Starting TRInk...`, then `Ready`
- App starts in click-through/passive mode
- `Pen` is not active by default (Select is default)
- Desktop/browser remains usable immediately after launch
- No login prompt appears
- No network connection is required to open the app

## Core UX

- Full-screen drawing reaches the full selected monitor — draw from edge to edge
- Toolbar drag handle (grip icon) is visible and moving it is intuitive
- Toolbar drag does not trigger accidental tool-button clicks
- System tray icon is visible in the Windows notification area
- Tray right-click shows Show/Hide, Open Settings, Quit
- Toolbar Power/quit button is visible and quits the app cleanly
- Click-through works
- Compact and normal toolbar modes render correctly
- Tool palette opens fully with no clipping
- Settings panel opens fully with scrolling and no clipping
- First-run welcome panel is short, clean, and not clipped
- Logo/branding is clearly visible in the toolbar and installer
- About panel shows version, build channel, publisher, and distribution identity

## Tool Interaction

- Selecting Trend, Channel, Fib, Pitchfork, QM, or Sweep does not trap the user
- Pressing Esc while a partial drawing is in progress cancels it safely
- Switching to a different tool while a partial drawing is active cancels the partial drawing
- After cancellation no ghost preview or broken state remains
- Completing a structured drawing returns cleanly to an idle state on the same tool

## Key Features

- Drawing tools work
- Chart tools work
- Price-action tools work
- Text creation and editing work
- Timer remains manual and neutral
- Object selection, ordering, locking, duplicate, and delete work
- Keybind customization works

## Local Data

- Session save works
- Session load works
- Annotation PNG export works
- Annotation JSON export works
- Styled text survives roundtrip
- Custom Fib/Pitchfork settings survive roundtrip
- Timer is excluded from sessions and exports

## Safety Checks

- No Expiry UI is visible
- No broker integration behavior appears
- No automation behavior appears
- No telemetry or cloud requirement appears

## Release Package

- `release/TRInk-0.3.11-beta/` is created
- `TradeReality Ink_0.3.11_x64-setup.exe` is present
- `CHECKSUMS.txt` is present
- `README.md`, `BETA_README.md`, `LICENSE.md`, `PRIVACY.md`, `EULA.md`, `RELEASE_NOTES.md`, `TESTING.md`, `COMPATIBILITY.md`, `RC_CHECKLIST.md`, and `SIGNING.md` are present
- `tools-handoff/` is present
- `UPDATER.md` is present
- `tools-handoff/trink-tool-card.json` is present
- `tools-handoff/trink-release-manifest.json` is present
- `tools-handoff/trink-tool-card.md` is present
- `tools-handoff/trink-short-description.txt` is present
- `tools-handoff/trink-install-instructions.md` is present
- `tools-handoff/trink-faq.md` is present
- `tools-handoff/trink-changelog-summary.md` is present
