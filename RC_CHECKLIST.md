# TRInk Release Candidate Checklist

## Installer

- Installer launches
- Product name is `TradeReality Ink`
- Installer filename is `TradeReality Ink_0.3.2_x64-setup.exe`
- SmartScreen warning is expected while the installer is unsigned

## Uninstall

- App appears in Windows Installed Apps / Apps & Features
- Uninstall completes cleanly
- Start Menu entry is removed

## Startup

- App starts quickly
- Toolbar shows `Starting TRInk...`
- Toolbar reaches `Ready`
- Overlay sync problems are visible in the toolbar if they occur
- Shortcut registration conflicts do not block launch

## First Run

- Welcome panel appears once on a fresh profile
- Welcome panel does not reappear after dismissal
- `Open settings` and `View shortcuts` actions work

## About / Identity

- About shows version `0.3.2`
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
- Sessions save/load
- PNG/JSON export
- Better text editing works
- All core tool categories remain available

## Release Package

- Beta package contains all required docs
- `tools-handoff/` contains the manifest and handoff copy files
- `CHECKSUMS.txt` is present
- Checksums match package contents
