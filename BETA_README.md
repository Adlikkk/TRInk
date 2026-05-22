# TRInk Beta Readme

TradeReality Ink (`TRInk`) is a Windows-first desktop overlay for manual chart and screen annotation. It is distributed through the TradeReality app/web Tools area as a free bonus tool for registered TradeReality users.

Version: `0.3.2`

What TRInk is:

- a local desktop annotation overlay
- a manual drawing and review tool
- useful for education, replay, presentation, and video workflows
- able to save sessions and export annotations to local files only

What TRInk is not:

- not financial advice
- not a trading signal product
- not a broker integration
- not a browser extension
- not a trade automation tool
- not a platform bypass tool
- not a cloud sync product
- not an Expiry or trade-timing tool

## Install

1. Open the beta release folder.
2. Run `TradeReality Ink_0.3.2_x64-setup.exe`.
3. Complete the normal Windows installer flow.
4. Launch `TradeReality Ink` from Start Menu or the installed app shortcut.
5. Review the short first-run welcome notice, then continue into the compact toolbar.

## Uninstall

1. Close TRInk if it is running.
2. Open Windows Installed Apps / Apps & Features.
3. Find `TradeReality Ink`.
4. Run the normal uninstall flow.

## Unsigned Beta Note

Current beta installers are unsigned.

- Windows SmartScreen warnings are expected.
- This is normal for the current beta package.
- Do not look for bypasses, repacked installers, or unofficial mirrors.

## First-Run Checklist

- Overlay window appears
- Toolbar window appears
- Toolbar shows a branded `Starting TRInk…` state briefly, then reaches `Ready`
- Tray menu appears
- Toolbar drag works
- Draw mode works
- Click-through toggle works
- Save/load/export actions open native dialogs

## Core Features

- manual overlay drawing tools
- chart tools and price-action annotations
- object editing, ordering, and locking
- local session save/load
- local annotation PNG/JSON export
- manual local countdown timer
- custom keybinds with conflict handling
- lightweight About panel with version, build channel, and safety summary

## Known Limitations

- The installer is unsigned.
- TRInk does not include login inside the desktop app. Access control belongs to the TradeReality download area.
- Multi-monitor behavior is Windows-first and still basic compared with a future deeper multi-overlay design.
- The timer is manual only and does not read broker, chart, or platform time.
- Annotated screenshot capture is not included in this build.

## Bug Reports

Include:

- what you were doing
- which tool or action was involved
- whether the issue happened during save/load/export
- whether a hotkey conflict was shown
- monitor layout if relevant
- the exact error text if any was shown
- the session or export file used if relevant

## Diagnostics Notes

- TRInk currently relies on local app/runtime output and visible error messages rather than a dedicated log file system.
- If an error dialog or notice appears, copy the exact message into the bug report.
- If the issue happens during local development, the Tauri/Vite terminal output is useful.

## Safety Scope

TRInk remains a local-only annotation overlay.

- no broker integration
- no trading automation
- no chart DOM reading
- no screen scraping
- no telemetry by default
- no cloud sync
- no Expiry UI
