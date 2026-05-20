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

export type ToolMode = "basic" | "trading" | "binary";

export type ToolKind =
  | "pen"
  | "highlighter"
  | "arrow"
  | "rectangle"
  | "text"
  | "eraser"
  | "trend"
  | "channel"
  | "support_resistance_zone"
  | "call_marker"
  | "put_marker"
  | "expiry_line";

export type DrawableBase = {
  id: string;
  style: DrawingStyle;
  createdAt: number;
};

export type FreehandStroke = DrawableBase & {
  type: "freehand";
  tool: "pen" | "highlighter";
  points: Point[];
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
  | ArrowShape
  | RectangleShape
  | TextShape
  | TrendPattern
  | ChannelPattern
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
    };
