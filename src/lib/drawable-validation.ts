import type {
  BinaryMarker,
  ChannelPattern,
  Drawable,
  DrawingStyle,
  Point,
  RectangleShape,
  TextShape,
  TrendPattern,
  ZoneShape
} from "../types/drawables";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

  return { ...drawable, style };
}

function sanitizeText(drawable: TextShape): TextShape | null {
  if (!isPoint(drawable.point)) {
    return null;
  }

  const style = sanitizeStyle(drawable.style);
  if (!style) {
    return null;
  }

  const text = typeof drawable.text === "string" ? drawable.text.trim() : "";
  if (!text) {
    return null;
  }

  return {
    ...drawable,
    text,
    fontSize: isFiniteNumber(drawable.fontSize) ? Math.max(10, Math.min(72, drawable.fontSize)) : 18,
    style
  };
}

function sanitizeTrend(drawable: TrendPattern): TrendPattern | null {
  const points = sanitizePoints(drawable.points, 2);
  const style = sanitizeStyle(drawable.style);
  if (!points || !style) {
    return null;
  }

  return { ...drawable, points, style };
}

function sanitizeChannel(drawable: ChannelPattern): ChannelPattern | null {
  if (!isPoint(drawable.baseStart) || !isPoint(drawable.baseEnd) || !isPoint(drawable.parallelPoint)) {
    return null;
  }

  const style = sanitizeStyle(drawable.style);
  if (!style) {
    return null;
  }

  return { ...drawable, style };
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
    style
  };
}

export function sanitizeDrawable(drawable: Drawable): Drawable | null {
  if (!drawable || typeof drawable !== "object" || typeof drawable.id !== "string") {
    return null;
  }

  switch (drawable.type) {
    case "freehand": {
      const points = sanitizePoints(drawable.points, 2);
      const style = sanitizeStyle(drawable.style);
      if (!points || !style || (drawable.tool !== "pen" && drawable.tool !== "highlighter")) {
        return null;
      }

      return { ...drawable, points, style };
    }
    case "arrow": {
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

      return { ...drawable, style };
    }
    case "rectangle":
      return sanitizeRectLike(drawable);
    case "support_resistance_zone":
      return sanitizeRectLike({
        ...drawable,
        label: typeof drawable.label === "string" && drawable.label.trim() ? drawable.label.trim() : "S/R Zone"
      });
    case "text":
      return sanitizeText(drawable);
    case "trend":
      return sanitizeTrend(drawable);
    case "channel":
      return sanitizeChannel(drawable);
    case "binary_marker":
      return sanitizeBinaryMarker(drawable);
    default:
      return null;
  }
}

export function sanitizeDrawables(drawables: Drawable[]): Drawable[] {
  return drawables.map(sanitizeDrawable).filter((drawable): drawable is Drawable => drawable !== null);
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
