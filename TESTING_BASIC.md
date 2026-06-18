# TRInk Basic Testing

## Launch

- About screen shows `TRInk Basic`
- About screen shows `Edition: Basic`
- About screen shows `Version: 0.1.0`
- About screen shows `Publisher: TradeReality`
- Starts in click-through mode
- Default tool is `Select / Move`
- Toolbar is visible and compact
- Toolbar shows only Basic tools and core actions
- Quit button is visible
- Toolbar clicks do not create drawing points

## Basic Tools

- Select / Move works
- Pen draws on the first click after selection
- Highlighter works
- Line starts on the first click after selection
- Arrow starts on the first click after selection
- Rectangle starts on the first click after selection
- Eraser works
- Esc cancels an active drawing and returns to `Select / Move`
- Switching tools cancels any partial drawing
- Click-through toggle switches between `Pass` and `Draw`

## Exclusions

- No Trend, Channel, QM, BOS, CHoCH, FVG, Fibonacci, Pitchfork, CALL, PUT, timer, or trading labels appear
- No session/export buttons appear in the Basic UI
- No telemetry, login, or broker behavior appears

## Overlay Bounds

- Debug bounds ring reaches all screen edges when enabled
- Pen can draw at each screen edge
- Line can span the full monitor
- Rectangle can cover the full monitor
- Clear removes all drawings

## Packaging

- `pnpm tauri:build:basic` emits `src-tauri/target/debug/trink-basic.exe`
- `pnpm tauri:build:basic` emits `src-tauri/target/debug/bundle/nsis/TRInk Basic_0.1.0_x64-setup.exe`
- `pnpm release:basic` emits `release/TRInk-Basic-0.1.0-beta/`
