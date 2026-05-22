import type {
  AndrewsPitchforkPattern,
  BinaryMarker,
  ChannelPattern,
  Drawable,
  FibonacciFanPattern,
  FibonacciRetracementPattern,
  FVGPattern,
  HorizontalLineShape,
  LiquiditySweepPattern,
  RayPattern,
  StructureBreakPattern,
  DrawingStyle,
  Point,
  QMPattern,
  RectangleShape,
  TextShape,
  TrendPattern,
  VerticalMarkerShape,
  ZoneShape
} from "../types/drawables";
import {
  DEFAULT_FIBONACCI_FAN_LEVELS,
  DEFAULT_FIBONACCI_RETRACEMENT_LEVELS,
  normalizeFibLevels,
  sanitizePitchforkVariant
} from "./chart-patterns";
import {
  clampTextBorderRadius,
  clampTextFontSize,
  clampTextOpacity,
  clampTextPadding,
  DEFAULT_TEXT_BACKGROUND_COLOR,
  DEFAULT_TEXT_BORDER_COLOR,
  normalizeTextContent,
  sanitizeTextAlign,
  sanitizeTextFontWeight
} from "./text-drawable";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeLocked(value: unknown) {
  return value === true;
}

export function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as Partial<Point>;
  return isFiniteNumber(point.x) && isFiniteNumber(point.y);
}

function sanitizeStyle(style: DrawingStyle | undefined): DrawingStyle | null {
  if (!style) {
    return null;
  }

  if (typeof style.strokeColor !== "string" || style.strokeColor.length === 0) {
    return null;
  }

  return {
    strokeColor: style.strokeColor,
    fillColor: typeof style.fillColor === "string" ? style.fillColor : style.strokeColor,
    strokeWidth: isFiniteNumber(style.strokeWidth) ? Math.max(1, Math.min(24, style.strokeWidth)) : 2,
    opacity: isFiniteNumber(style.opacity) ? Math.max(0.05, Math.min(1, style.opacity)) : 1,
    dashed: Boolean(style.dashed)
  };
}

function sanitizePoints(points: unknown, minPoints = 1): Point[] | null {
  if (!Array.isArray(points)) {
    return null;
  }

  const normalized = points.filter(isPoint);
  return normalized.length >= minPoints ? normalized : null;
}

function sanitizeRectLike<T extends RectangleShape | ZoneShape>(drawable: T): T | null {
  if (!isPoint(drawable.start) || !isPoint(drawable.end)) {
    return null;
  }

  const style = sanitizeStyle(drawable.style);
  if (!style) {
    return null;
  }

  if (drawable.start.x === drawable.end.x && drawable.start.y === drawable.end.y) {
    return null;
  }

  return { ...drawable, style, locked: sanitizeLocked(drawable.locked) };
}

function sanitizeText(drawable: TextShape): TextShape | null {
  if (!isPoint(drawable.point)) {
    return null;
  }

  const style = sanitizeStyle(drawable.style);
  if (!style) {
    return null;
  }

  const text = normalizeTextContent(drawable.text);
  if (!text) {
    return null;
  }

  return {
    ...drawable,
    text,
    fontSize: clampTextFontSize(drawable.fontSize),
    fontWeight: sanitizeTextFontWeight(drawable.fontWeight),
    align: sanitizeTextAlign(drawable.align),
    backgroundEnabled: drawable.backgroundEnabled === true,
    backgroundColor:
      typeof drawable.backgroundColor === "string" && drawable.backgroundColor.trim()
        ? drawable.backgroundColor
        : DEFAULT_TEXT_BACKGROUND_COLOR,
    backgroundOpacity: clampTextOpacity(drawable.backgroundOpacity, 0.82),
    padding: clampTextPadding(drawable.padding),
    borderEnabled: drawable.borderEnabled === true,
    borderColor:
      typeof drawable.borderColor === "string" && drawable.borderColor.trim()
        ? drawable.borderColor
        : DEFAULT_TEXT_BORDER_COLOR,
    borderRadius: clampTextBorderRadius(drawable.borderRadius),
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeHorizontalLine(drawable: HorizontalLineShape): HorizontalLineShape | null {
  const style = sanitizeStyle(drawable.style);
  if (!style || !isFiniteNumber(drawable.y)) {
    return null;
  }

  return {
    ...drawable,
    y: drawable.y,
    label: typeof drawable.label === "string" ? drawable.label.trim() : undefined,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeVerticalMarker(drawable: VerticalMarkerShape): VerticalMarkerShape | null {
  const style = sanitizeStyle(drawable.style);
  if (!style || !isFiniteNumber(drawable.x)) {
    return null;
  }

  return {
    ...drawable,
    x: drawable.x,
    label: typeof drawable.label === "string" ? drawable.label.trim() : undefined,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeRay(drawable: RayPattern): RayPattern | null {
  const points = sanitizePoints(drawable.points, 2);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style || points.length !== 2) {
    return null;
  }

  if (points[0].x === points[1].x && points[0].y === points[1].y) {
    return null;
  }

  return {
    ...drawable,
    points: points.slice(0, 2),
    label: typeof drawable.label === "string" ? drawable.label.trim() : undefined,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeTrend(drawable: TrendPattern): TrendPattern | null {
  const points = sanitizePoints(drawable.points, 2);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style) {
    return null;
  }

  return { ...drawable, points, style, locked: sanitizeLocked(drawable.locked) };
}

function sanitizeChannel(drawable: ChannelPattern): ChannelPattern | null {
  if (!isPoint(drawable.baseStart) || !isPoint(drawable.baseEnd) || !isPoint(drawable.parallelPoint)) {
    return null;
  }

  const style = sanitizeStyle(drawable.style);
  if (!style) {
    return null;
  }

  return { ...drawable, style, locked: sanitizeLocked(drawable.locked) };
}

function sanitizeFibonacciRetracement(drawable: FibonacciRetracementPattern): FibonacciRetracementPattern | null {
  const points = sanitizePoints(drawable.points, 2);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style || points.length !== 2) {
    return null;
  }

  if (points[0].x === points[1].x && points[0].y === points[1].y) {
    return null;
  }

  return {
    ...drawable,
    points: points.slice(0, 2),
    levels: normalizeFibLevels(drawable.levels, DEFAULT_FIBONACCI_RETRACEMENT_LEVELS),
    showLabels: drawable.showLabels !== false,
    showPercentages: drawable.showPercentages === true,
    extendLeft: drawable.extendLeft === true,
    extendRight: drawable.extendRight === true,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeFibonacciFan(drawable: FibonacciFanPattern): FibonacciFanPattern | null {
  const points = sanitizePoints(drawable.points, 2);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style || points.length !== 2) {
    return null;
  }

  if (points[0].x === points[1].x && points[0].y === points[1].y) {
    return null;
  }

  return {
    ...drawable,
    points: points.slice(0, 2),
    levels: normalizeFibLevels(drawable.levels, DEFAULT_FIBONACCI_FAN_LEVELS),
    showLabels: drawable.showLabels !== false,
    showPercentages: drawable.showPercentages === true,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeAndrewsPitchfork(drawable: AndrewsPitchforkPattern): AndrewsPitchforkPattern | null {
  const points = sanitizePoints(drawable.points, 3);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style || points.length !== 3) {
    return null;
  }

  return {
    ...drawable,
    points: points.slice(0, 3),
    showLabels: drawable.showLabels !== false,
    variant: sanitizePitchforkVariant(drawable.variant),
    showMedianLine: drawable.showMedianLine !== false,
    showOuterLines: drawable.showOuterLines !== false,
    showAnchorLine: drawable.showAnchorLine === true,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeQM(drawable: QMPattern): QMPattern | null {
  const points = sanitizePoints(drawable.points, 5);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style || points.length !== 5) {
    return null;
  }

  return {
    ...drawable,
    points: points.slice(0, 5),
    label: typeof drawable.label === "string" ? drawable.label.trim() : undefined,
    showLabels: drawable.showLabels !== false,
    showNeckline: drawable.showNeckline !== false,
    showRetestZone: drawable.showRetestZone !== false,
    showDirectionArrow: drawable.showDirectionArrow !== false,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeStructureBreak(drawable: StructureBreakPattern): StructureBreakPattern | null {
  const points = sanitizePoints(drawable.points, 2);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style || points.length !== 2) {
    return null;
  }

  return {
    ...drawable,
    points: points.slice(0, 2),
    label: typeof drawable.label === "string" ? drawable.label.trim() : undefined,
    direction:
      drawable.direction === "bullish" || drawable.direction === "bearish" || drawable.direction === "neutral"
        ? drawable.direction
        : "neutral",
    showArrow: drawable.showArrow !== false,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeFVG(drawable: FVGPattern): FVGPattern | null {
  const points = sanitizePoints(drawable.points, 2);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style || points.length !== 2) {
    return null;
  }

  if (points[0].x === points[1].x && points[0].y === points[1].y) {
    return null;
  }

  return {
    ...drawable,
    points: points.slice(0, 2),
    label: typeof drawable.label === "string" ? drawable.label.trim() : undefined,
    extendRight: Boolean(drawable.extendRight),
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeLiquiditySweep(drawable: LiquiditySweepPattern): LiquiditySweepPattern | null {
  const points = sanitizePoints(drawable.points, 3);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style || points.length !== 3) {
    return null;
  }

  return {
    ...drawable,
    points: points.slice(0, 3),
    label: typeof drawable.label === "string" ? drawable.label.trim() : undefined,
    showSweepMarker: drawable.showSweepMarker !== false,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

function sanitizeBinaryMarker(drawable: BinaryMarker): BinaryMarker | null {
  const points = sanitizePoints(drawable.points, 1);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style) {
    return null;
  }

  return {
    ...drawable,
    points,
    label: typeof drawable.label === "string" ? drawable.label.trim() : undefined,
    customExpiryText:
      typeof drawable.customExpiryText === "string" ? drawable.customExpiryText.trim() : undefined,
    style,
    locked: sanitizeLocked(drawable.locked)
  };
}

export function sanitizeDrawable(drawable: unknown): Drawable | null {
  if (!drawable || typeof drawable !== "object") {
    return null;
  }

  const record = drawable as Record<string, unknown>;
  if (typeof record.id !== "string") {
    return null;
  }

  const candidate = drawable as Drawable;

  switch (candidate.type) {
    case "freehand": {
      const points = sanitizePoints(candidate.points, 2);
      const style = sanitizeStyle(candidate.style);
      if (!points || !style || (candidate.tool !== "pen" && candidate.tool !== "highlighter")) {
        return null;
      }

      return { ...candidate, points, style, locked: sanitizeLocked(candidate.locked) };
    }
    case "arrow": {
      if (!isPoint(candidate.start) || !isPoint(candidate.end)) {
        return null;
      }

      const style = sanitizeStyle(candidate.style);
      if (!style) {
        return null;
      }

      if (candidate.start.x === candidate.end.x && candidate.start.y === candidate.end.y) {
        return null;
      }

      return { ...candidate, style, locked: sanitizeLocked(candidate.locked) };
    }
    case "rectangle":
      return sanitizeRectLike(candidate);
    case "support_resistance_zone":
      return sanitizeRectLike({
        ...candidate,
        label: typeof candidate.label === "string" && candidate.label.trim() ? candidate.label.trim() : "S/R Zone"
      });
    case "text":
      return sanitizeText(candidate);
    case "horizontal_line":
      return sanitizeHorizontalLine(candidate);
    case "vertical_marker":
      return sanitizeVerticalMarker(candidate);
    case "ray":
      return sanitizeRay(candidate);
    case "trend":
      return sanitizeTrend(candidate);
    case "channel":
      return sanitizeChannel(candidate);
    case "fibonacci_retracement":
      return sanitizeFibonacciRetracement(candidate);
    case "fibonacci_fan":
      return sanitizeFibonacciFan(candidate);
    case "andrews_pitchfork":
      return sanitizeAndrewsPitchfork(candidate);
    case "qm_bullish":
    case "qm_bearish":
      return sanitizeQM(candidate);
    case "bos":
    case "choch":
      return sanitizeStructureBreak(candidate);
    case "fvg":
      return sanitizeFVG(candidate);
    case "liquidity_sweep":
      return sanitizeLiquiditySweep(candidate);
    case "binary_marker":
      return sanitizeBinaryMarker(candidate);
    default:
      return null;
  }
}

export function sanitizeDrawablesWithReport(drawables: readonly unknown[]) {
  const sanitized = drawables.map(sanitizeDrawable).filter((drawable): drawable is Drawable => drawable !== null);
  return {
    drawables: sanitized,
    ignoredDrawables: drawables.length - sanitized.length
  };
}

export function sanitizeDrawables(drawables: readonly unknown[]): Drawable[] {
  return sanitizeDrawablesWithReport(drawables).drawables;
}

export function findTopmostDrawableAtPoint(drawables: Drawable[], predicate: (drawable: Drawable) => boolean) {
  for (let index = drawables.length - 1; index >= 0; index -= 1) {
    const drawable = sanitizeDrawable(drawables[index]);
    if (drawable && predicate(drawable)) {
      return drawable;
    }
  }

  return null;
}
