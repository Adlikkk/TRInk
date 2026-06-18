# TRInk Versioning

TRInk Basic and TRInk Trading share one repository.

## Tag Convention

- `trink-basic-v0.1.0`
- `trink-trading-v0.3.11`
- `trink-editions-v0.4.0`

## Release Folder Convention

- `release/TRInk-Basic-<version>-<channel>/`
- `release/TRInk-Trading-<version>-<channel>/`

## Build Convention

- Edition is selected at build time through `TRINK_EDITION` and `VITE_TRINK_EDITION`.
- `pnpm prepare:edition:basic` and `pnpm prepare:edition:trading` must run before Tauri dev/build/package flows.
- `trading` is the default edition when no edition env var is supplied.

## Edition Versions

- `basic`
  - Version: `0.1.0`
  - Installer: `TRInk Basic_0.1.0_x64-setup.exe`
  - Release folder: `release/TRInk-Basic-0.1.0-beta/`
- `trading`
  - Version: `0.3.11`
  - Installer: `TradeReality Ink_0.3.11_x64-setup.exe`
  - Release folder: `release/TRInk-Trading-0.3.11-beta/`

## Product Positioning

- `basic`: simpler local screen annotation overlay
- `trading`: current TradeReality Tools product with the full chart/trading workflow
