# TRInk Testing Checklist

See [RC_CHECKLIST.md](RC_CHECKLIST.md) for the final release-candidate pass.

## Install and Launch

- Installer launches
- Product name is `TradeReality Ink`
- App starts after install
- Overlay window appears
- Toolbar window appears
- Toolbar briefly shows `Starting TRInk...`, then `Ready`
- Tray menu is available
- No login prompt appears
- No network connection is required to open the app

## Core UX

- Toolbar drag works
- Click-through works
- Compact and normal toolbar modes render correctly
- Settings panel opens and closes cleanly
- About panel shows version, build channel, publisher, and distribution identity

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

- `release/TRInk-0.3.2-beta/` is created
- `TradeReality Ink_0.3.2_x64-setup.exe` is present
- `CHECKSUMS.txt` is present
- `README.md`, `BETA_README.md`, `LICENSE.md`, `PRIVACY.md`, `EULA.md`, `RELEASE_NOTES.md`, `TESTING.md`, `COMPATIBILITY.md`, `RC_CHECKLIST.md`, and `SIGNING.md` are present
- `tools-handoff/` is present
- `tools-handoff/trink-tool-card.json` is present
- `tools-handoff/trink-release-manifest.json` is present
- `tools-handoff/trink-tool-card.md` is present
- `tools-handoff/trink-short-description.txt` is present
- `tools-handoff/trink-install-instructions.md` is present
- `tools-handoff/trink-faq.md` is present
- `tools-handoff/trink-changelog-summary.md` is present
