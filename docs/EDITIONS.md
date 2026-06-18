# TRInk Editions

TRInk ships from one repository with two build-time editions selected through `TRINK_EDITION` and `VITE_TRINK_EDITION`.

## Editions

| Edition | Purpose | Default Toolset | Timer | Sessions / Export |
| --- | --- | --- | --- | --- |
| `basic` | Local screen annotation for teaching, review, and presentation | Select, Pen, Highlighter, Line, Arrow, Rectangle, Text, Eraser | No | Disabled in UI for v0.1.0 |
| `trading` | Full TradeReality chart and price-action overlay | Basic tools plus chart, price-action, Fibonacci, pitchfork, and binary markers | Yes | Yes |

## Selection

- Prepare generated Tauri config: `pnpm prepare:edition:basic`, `pnpm prepare:edition:trading`
- Development: `pnpm dev:basic`, `pnpm dev:trading`
- Web build: `pnpm build:basic`, `pnpm build:trading`
- Tauri build: `pnpm tauri:build:basic`, `pnpm tauri:build:trading`
- Release packaging: `pnpm release:basic`, `pnpm release:trading`

## Architecture

- `src/editions/edition.ts` is the single edition registry.
- `config/edition-config.json` is the single source of truth for product name, identifier, version, executable name, installer name, and release folder metadata.
- `scripts/prepare-edition.mjs` generates `src-tauri/tauri.conf.json` from `src-tauri/tauri.conf.base.json`.
- Settings normalization sanitizes tools, favorites, recent tools, modes, and shortcuts against the active edition.
- Trading remains the default development/build flavor unless an edition env var overrides it.

## Build Identity

- `basic`
  - Product name: `TRInk Basic`
  - Identifier: `com.tradereality.trink.basic`
  - Executable: `trink-basic.exe`
  - Installer: `TRInk Basic_0.1.0_x64-setup.exe`
- `trading`
  - Product name: `TradeReality Ink`
  - Identifier: `com.tradereality.trink.trading`
  - Executable: `trink.exe`
  - Installer: `TradeReality Ink_0.3.11_x64-setup.exe`

## Safety Scope

Both editions stay local desktop overlays only.

- No broker integration
- No DOM reading
- No automation
- No OCR
- No telemetry by default
- No cloud sync
