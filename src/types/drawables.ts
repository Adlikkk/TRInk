export type Point = {
  x: number;
  y: number;
};

export type DrawingStyle = {
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
  dashed?: boolean;
};

export type TextFontWeight = "normal" | "medium" | "semibold" | "bold";
export type TextAlign = "left" | "center" | "right";

export type ToolMode = "basic" | "trading" | "binary";

export type ToolKind =
  | "select"
  | "pen"
  | "highlighter"
  | "line"
  | "arrow"
  | "rectangle"
  | "text"
  | "eraser"
  | "horizontal_line"
  | "vertical_marker"
  | "ray"
  | "trend"
  | "channel"
  | "support_resistance_zone"
  | "fibonacci_retracement"
  | "fibonacci_fan"
  | "andrews_pitchfork"
  | "qm_bullish"
  | "qm_bearish"
  | "bos"
  | "choch"
  | "fvg"
  | "liquidity_sweep"
  | "call_marker"
  | "put_marker"
  | "expiry_line";

export type DrawableBase = {
  id: string;
  style: DrawingStyle;
  createdAt: number;
  locked?: boolean;
};

export type FreehandStroke = DrawableBase & {
  type: "freehand";
  tool: "pen" | "highlighter";
  points: Point[];
};

export type LineShape = DrawableBase & {
  type: "line";
  start: Point;
  end: Point;
};

export type ArrowShape = DrawableBase & {
  type: "arrow";
  start: Point;
  end: Point;
};

export type RectangleShape = DrawableBase & {
  type: "rectangle";
  start: Point;
  end: Point;
};

export type TextShape = DrawableBase & {
  type: "text";
  point: Point;
  text: string;
  fontSize: number;
  fontWeight?: TextFontWeight;
  align?: TextAlign;
  backgroundEnabled?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  padding?: number;
  borderEnabled?: boolean;
  borderColor?: string;
  borderRadius?: number;
};

export type HorizontalLineShape = DrawableBase & {
  type: "horizontal_line";
  y: number;
  label?: string;
};

export type VerticalMarkerShape = DrawableBase & {
  type: "vertical_marker";
  x: number;
  label?: string;
};

export type RayPattern = DrawableBase & {
  type: "ray";
  points: Point[];
  label?: string;
};

export type TrendPattern = DrawableBase & {
  type: "trend";
  direction: "bullish" | "bearish" | "neutral";
  points: Point[];
  showLabels: boolean;
  showArrows: boolean;
};

export type ChannelPattern = DrawableBase & {
  type: "channel";
  mode: "uptrend" | "downtrend" | "range";
  baseStart: Point;
  baseEnd: Point;
  parallelPoint: Point;
  showMidline: boolean;
  extendRight: boolean;
};

export type FibonacciRetracementPattern = DrawableBase & {
  type: "fibonacci_retracement";
  points: Point[];
  levels: number[];
  showLabels: boolean;
  showPercentages?: boolean;
  extendLeft?: boolean;
  extendRight?: boolean;
};

export type FibonacciFanPattern = DrawableBase & {
  type: "fibonacci_fan";
  points: Point[];
  levels: number[];
  showLabels: boolean;
  showPercentages?: boolean;
};

export type AndrewsPitchforkPattern = DrawableBase & {
  type: "andrews_pitchfork";
  points: Point[];
  showLabels: boolean;
  variant?: "standard" | "schiff" | "modified_schiff";
  showMedianLine?: boolean;
  showOuterLines?: boolean;
  showAnchorLine?: boolean;
};

export type QMPattern = DrawableBase & {
  type: "qm_bullish" | "qm_bearish";
  points: Point[];
  label?: string;
  showLabels: boolean;
  showNeckline: boolean;
  showRetestZone: boolean;
  showDirectionArrow: boolean;
};

export type StructureBreakPattern = DrawableBase & {
  type: "bos" | "choch";
  points: Point[];
  label?: string;
  direction?: "bullish" | "bearish" | "neutral";
  showArrow: boolean;
};

export type FVGPattern = DrawableBase & {
  type: "fvg";
  points: Point[];
  label?: string;
  extendRight?: boolean;
};

export type LiquiditySweepPattern = DrawableBase & {
  type: "liquidity_sweep";
  points: Point[];
  label?: string;
  showSweepMarker: boolean;
};

export type BinaryMarker = DrawableBase & {
  type: "binary_marker";
  markerType: "call_marker" | "put_marker" | "expiry_line";
  points: Point[];
  label?: string;
  expiry?: "M1" | "M5" | "M15" | "custom";
  customExpiryText?: string;
};

export type ZoneShape = DrawableBase & {
  type: "support_resistance_zone";
  start: Point;
  end: Point;
  label: string;
};

export type Drawable =
  | FreehandStroke
  | LineShape
  | ArrowShape
  | RectangleShape
  | TextShape
  | HorizontalLineShape
  | VerticalMarkerShape
  | RayPattern
  | TrendPattern
  | ChannelPattern
  | FibonacciRetracementPattern
  | FibonacciFanPattern
  | AndrewsPitchforkPattern
  | QMPattern
  | StructureBreakPattern
  | FVGPattern
  | LiquiditySweepPattern
  | BinaryMarker
  | ZoneShape;

export type PreviewShape =
  | Drawable
  | {
      type: "trend_preview";
      points: Point[];
      style: DrawingStyle;
    }
  | {
      type: "channel_preview";
      baseStart: Point;
      baseEnd: Point;
      parallelPoint: Point;
      style: DrawingStyle;
    }
  | {
      type: "qm_preview";
      patternType: "qm_bullish" | "qm_bearish";
      points: Point[];
      style: DrawingStyle;
    };
