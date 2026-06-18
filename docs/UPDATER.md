# TRInk Update Strategy

## Current Status (v0.3.11 beta)

Automatic updates are **not active** in the current beta.

- `createUpdaterArtifacts` is `false` in `tauri.conf.json`
- The `checkForUpdates` setting exists in AppSettings but does nothing in beta builds
- The Settings panel shows a placeholder message when the setting is enabled

## Manual Update Process

During beta, users update manually:

1. Download the new installer from the TradeReality Tools area
2. Run the installer — it replaces the existing install in-place
3. Launch TRInk as normal

## Production Update Requirements (future)

Before enabling automatic updates:

- Code-sign the installer (see `docs/SIGNING.md`)
- Configure a Tauri updater endpoint
- Set `createUpdaterArtifacts: true` in `tauri.conf.json`
- Implement signature verification for update payloads
- Never auto-install without a valid signature

## Safety Constraints

The update system must never:

- Download or execute unsigned payloads
- Silently replace binaries without user confirmation
- Connect to any endpoint other than the designated TradeReality update server
- Read broker data, DOM, credentials, or user files as part of any update check
