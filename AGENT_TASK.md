# AGENT_TASK.md — TradeReality Ink

You are building a production-ready Windows-first desktop overlay app called TradeReality Ink.

## Product

TradeReality Ink is a fast, minimal, modern screen annotation overlay for traders, educators, and trading video creators. It should work over browsers, broker platforms, TradingView, video players, and screen recording software as a normal desktop overlay.

It must not inject into browsers, broker apps, games, or third-party processes. It must not bypass anti-cheat, security, DRM, or platform protection. It must not read credentials, cookies, broker DOM content, or automate trading. It is an educational annotation tool only.

## Stack

Use:

- Tauri v2
- Rust backend
- React + TypeScript + Vite frontend
- TailwindCSS
- Lucide React icons
- HTML Canvas or SVG for drawing
- Local settings persistence
- Windows-first implementation

Avoid Electron.

## Branding

Product name: TradeReality Ink  
Brand: TradeReality  
Style: minimalist, dark, premium, compact  
Colors:
- background: #020817 / #030712
- accent: #3B82F6
- accent secondary: #8B5CF6
- text: #E5E7EB
- muted text: #94A3B8

Logo direction:
Minimal TR / ink stroke / chart line / crosshair concept. Keep it original. Do not copy Epic Pen branding.

## Core Features

Implement MVP:

1. Transparent always-on-top overlay window.
2. Floating draggable toolbar.
3. Draw mode and click-through mode.
4. Drawing tools:
   - Pen
   - Highlighter
   - Line
   - Arrow
   - Rectangle
   - Circle
   - Text label
   - Eraser
   - Undo
   - Redo
   - Clear
   - Hide/show drawings
5. Trading tools:
   - Entry line
   - Stop-loss line
   - Take-profit line
   - Risk/reward box
   - Zone rectangle
6. Hotkeys:
   - Ctrl+Shift+Space: toggle overlay visibility
   - Ctrl+Shift+P: pen
   - Ctrl+Shift+H: highlighter
   - Ctrl+Shift+A: arrow
   - Ctrl+Shift+R: rectangle
   - Ctrl+Shift+T: text
   - Ctrl+Shift+E: eraser
   - Ctrl+Shift+X: toggle click-through mode
   - Ctrl+Z: undo
   - Ctrl+Y: redo
   - Ctrl+Shift+Backspace: clear
7. Settings panel:
   - color
   - stroke size
   - toolbar opacity
   - default tool
   - keybind list
   - start minimized
   - always on top
8. Tray icon:
   - show/hide overlay
   - open settings
   - quit

## UX Requirements

- App must feel instant.
- Toolbar must be compact and readable.
- No heavy animations.
- No clutter.
- Use keyboard-first workflow.
- Good for video recording and live teaching.
- Do not block the broker/browser while click-through mode is enabled.
- Do not capture or transmit screen content.

## Security / Compliance

Hard rules:

- No process injection.
- No DLL injection.
- No browser extension.
- No automation of clicks or trades.
- No credential access.
- No stealth behavior.
- No anti-cheat bypass.
- No suspicious packers.
- No telemetry by default.
- Local-only settings.

Add clear text to README:
"TradeReality Ink is an educational annotation overlay. It does not provide financial advice, trading signals, broker automation, or platform bypass functionality."

## Implementation Tasks

1. Scaffold Tauri v2 + React + TypeScript + Vite + Tailwind.
2. Configure transparent, frameless, always-on-top main overlay window.
3. Create draggable floating toolbar.
4. Implement drawing canvas layer.
5. Implement tool state machine.
6. Implement undo/redo using immutable stroke history.
7. Implement click-through mode via platform-safe window behavior.
8. Register global shortcuts with Tauri global-shortcut plugin.
9. Add local settings persistence.
10. Add tray menu.
11. Add app icon assets placeholders.
12. Add README, PRIVACY.md, EULA.md, and ROADMAP.md.
13. Add build scripts for Windows.
14. Run typecheck, lint, and build.
15. Fix all errors.

## Acceptance Criteria

- `pnpm install` works.
- `pnpm tauri dev` launches the app.
- Overlay appears above other windows.
- Toolbar is visible and draggable.
- Drawing works.
- Undo/redo works.
- Clear works.
- Hide/show works.
- Click-through mode works.
- Hotkeys work globally.
- Settings persist locally.
- Build succeeds.
- README documents safe/legal usage.

Proceed with implementation using small, reviewable commits.

## Product Rename

The product is called:

- Full name: TradeReality Ink
- Short name: TRInk

Use "TRInk" in compact UI areas such as tray menu, toolbar, and splash screen. Use "TradeReality Ink" in README, EULA, installer metadata, and settings.

## Main Product Direction

TRInk is not only a generic screen annotation tool. It is a trading-first educational overlay for explaining price action, binary options setups, trading patterns, and chart logic.

It must remain an annotation tool only. It must not provide financial advice, trading signals, broker integration, broker automation, or anti-cheat bypass functionality.

## UX Modes

Implement tool modes:

1. Basic Mode
   - Pen
   - Highlighter
   - Arrow
   - Rectangle
   - Text
   - Eraser
   - Undo
   - Clear
   - Hide

2. Trading Mode
   - Trend Tool
   - Channel Tool
   - Support/Resistance Zone
   - Supply/Demand Zone
   - Risk/Reward Box
   - BOS Label
   - CHoCH Label
   - Liquidity Sweep Marker
   - FVG Box
   - Order Block Box

3. Binary Options Mode
   - CALL marker
   - PUT marker
   - Expiry vertical line
   - Entry candle box
   - Confirmation candle label
   - Rejection zone
   - Touch zone
   - No-trade marker
   - Manual countdown timer

The user can choose the default mode in settings.

## Favorites Bar

Add a compact favorites toolbar.

Requirements:
- User can pin up to 8 tools.
- Favorites persist locally.
- Default favorites:
  - Pen
  - Arrow
  - Rectangle
  - Text
  - Trend
  - Channel
  - Zone
  - Clear

## Smart Drawing Tools

### Trend Tool

The Trend Tool creates a multi-segment trend annotation.

Interaction:
- Left click places the first point.
- Each next left click adds a new connected segment.
- Right click finishes the trend.
- Esc cancels the tool.
- Backspace removes the last point.
- Shift constrains the angle.

Options:
- Uptrend
- Downtrend
- Neutral
- Show swing labels
- Show direction arrows

Auto labels:
- For bullish trend: HH / HL
- For bearish trend: LH / LL

### Channel Tool

The Channel Tool creates a parallel price channel.

Interaction:
- Click 1: start of base line.
- Click 2: end of base line.
- Click 3: channel width / parallel line position.
- Right click confirms.
- Esc cancels.
- Shift constrains the base line angle.

Options:
- Uptrend channel
- Downtrend channel
- Range channel
- Show midline
- Extend right
- Show labels

### QM Tool

Implement Quasimodo pattern tools:

- QM Bullish
- QM Bearish

Interaction:
- User places 5 points manually.
- Right click finishes.
- Esc cancels.
- Backspace removes last point.

For QM Bearish:
1. Left shoulder
2. Low
3. Higher high
4. Lower low / structure break
5. Retest / entry area

For QM Bullish:
1. Left shoulder
2. High
3. Lower low
4. Higher high / structure break
5. Retest / entry area

Render:
- Connected lines
- Point labels
- Neckline
- Retest zone
- Direction arrow
- Pattern label: "Bearish QM" or "Bullish QM"

The tool must not validate or predict the setup. It only visualizes user-selected points.

## Binary Options Tools

Implement binary options annotations as manual educational overlays.

### CALL Marker

- Up arrow
- Label "CALL"
- Optional expiry text such as M1, M5, M15

### PUT Marker

- Down arrow
- Label "PUT"
- Optional expiry text such as M1, M5, M15

### Expiry Line

- Vertical line
- Label:
  - M1
  - M5
  - M15
  - Custom

### Entry Candle Box

- Rectangle around selected candle area
- Label "Entry"

### Rejection Zone

- Semi-transparent zone
- Optional wick marker
- Label "Rejection"

### Touch Zone

- Horizontal zone
- Label "Touch Zone"

### No-Trade Marker

- X marker
- Label "No Trade"

### Manual Countdown

- User can set a local countdown timer manually.
- Do not read time from broker websites or trading platforms.
- Do not automate trading.

## Pattern Object Model

Represent every drawing as a serializable object.

Use a model similar to:

```ts
type Point = {
  x: number;
  y: number;
};

type DrawingStyle = {
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
  dashed?: boolean;
};

type Drawable =
  | FreehandStroke
  | LineShape
  | ArrowShape
  | RectangleShape
  | TextShape
  | TrendPattern
  | ChannelPattern
  | QMPattern
  | BinaryMarker;

type TrendPattern = {
  id: string;
  type: "trend";
  direction: "bullish" | "bearish" | "neutral";
  points: Point[];
  showLabels: boolean;
  showArrows: boolean;
  style: DrawingStyle;
};

type ChannelPattern = {
  id: string;
  type: "channel";
  mode: "uptrend" | "downtrend" | "range";
  baseStart: Point;
  baseEnd: Point;
  parallelPoint: Point;
  showMidline: boolean;
  extendRight: boolean;
  style: DrawingStyle;
};

type QMPattern = {
  id: string;
  type: "qm_bullish" | "qm_bearish";
  points: Point[];
  showLabels: boolean;
  showNeckline: boolean;
  showRetestZone: boolean;
  showDirectionArrow: boolean;
  style: DrawingStyle;
};

type BinaryMarker = {
  id: string;
  type:
    | "call_marker"
    | "put_marker"
    | "expiry_line"
    | "entry_candle"
    | "rejection_zone"
    | "touch_zone"
    | "no_trade";
  points: Point[];
  label?: string;
  expiry?: "M1" | "M5" | "M15" | "custom";
  customExpiryText?: string;
  style: DrawingStyle;
};