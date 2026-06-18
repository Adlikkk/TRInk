import { createId } from "./id";
import { distance, normalizeRect } from "./geometry";
import { getLegacyVerticalMarkerLabel, isLegacyVerticalMarker } from "./legacy-markers";
import { sanitizeDrawable } from "./drawable-validation";
import {
  DEFAULT_FIBONACCI_FAN_LEVELS,
  DEFAULT_FIBONACCI_RETRACEMENT_LEVELS,
  normalizeFibLevels,
  sanitizePitchforkVariant,
  type PitchforkVariant
} from "./chart-patterns";
import {
  clampTextBorderRadius,
  clampTextFontSize,
  clampTextOpacity,
  clampTextPadding,
  DEFAULT_TEXT_BACKGROUND_COLOR,
  DEFAULT_TEXT_BORDER_COLOR,
  estimateTextLayout,
  sanitizeTextAlign,
  sanitizeTextFontWeight
} from "./text-drawable";
import type { Drawable, Point } from "../types/drawables";

export type SelectedObjectSummary = {
  id: string;
  type: string;
  locked: boolean;
  label?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  textAlign?: "left" | "center" | "right";
  backgroundEnabled?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  padding?: number;
  borderEnabled?: boolean;
  borderColor?: string;
  borderRadius?: number;
  showLabels?: boolean;
  showNeckline?: boolean;
  showRetestZone?: boolean;
  showDirectionArrow?: boolean;
  extendRight?: boolean;
  extendLeft?: boolean;
  showSweepMarker?: boolean;
  showPercentages?: boolean;
  levels?: number[];
  pitchforkVariant?: PitchforkVariant;
  showMedianLine?: boolean;
  showOuterLines?: boolean;
  showAnchorLine?: boolean;
};

export type EditablePropertiesPatch = {
  locked?: boolean;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  opacity?: number;
  text?: string;
  label?: string;
  fontSize?: number;
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  textAlign?: "left" | "center" | "right";
  backgroundEnabled?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  padding?: number;
  borderEnabled?: boolean;
  borderColor?: string;
  borderRadius?: number;
  showLabels?: boolean;
  showNeckline?: boolean;
  showRetestZone?: boolean;
  showDirectionArrow?: boolean;
  extendRight?: boolean;
  extendLeft?: boolean;
  showSweepMarker?: boolean;
  showPercentages?: boolean;
  levels?: number[];
  pitchforkVariant?: PitchforkVariant;
  showMedianLine?: boolean;
  showOuterLines?: boolean;
  showAnchorLine?: boolean;
};

export type AnchorHandle = {
  id: string;
  point: Point;
  disabled?: boolean;
};

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function clampOpacity(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0.05, Math.min(1, value))
    : fallback;
}

function clampStrokeWidth(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(24, value))
    : fallback;
}

function clampFontSize(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(10, Math.min(72, value))
    : fallback;
}

function translatePoint(point: Point, delta: Point): Point {
  return { x: point.x + delta.x, y: point.y + delta.y };
}

function getPointsBounds(points: Point[], minSize = 12): Bounds {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(minSize, maxX - minX);
  const height = Math.max(minSize, maxY - minY);

  return {
    x: minX - Math.max(0, (width - (maxX - minX)) / 2),
    y: minY - Math.max(0, (height - (maxY - minY)) / 2),
    width,
    height
  };
}

function getViewportSize() {
  return {
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080
  };
}

export function getDrawableBounds(drawable: Drawable): Bounds | null {
  const safeDrawable = sanitizeDrawable(drawable);
  if (!safeDrawable) {
    return null;
  }

  switch (safeDrawable.type) {
    case "freehand":
    case "trend":
      return getPointsBounds(safeDrawable.points);
    case "line":
    case "arrow":
      return getPointsBounds([safeDrawable.start, safeDrawable.end]);
    case "rectangle":
    case "support_resistance_zone":
      return normalizeRect(safeDrawable.start, safeDrawable.end);
    case "text":
      return estimateTextLayout(safeDrawable);
    case "horizontal_line": {
      const { width } = getViewportSize();
      return { x: 0, y: safeDrawable.y - 6, width, height: 12 };
    }
    case "vertical_marker": {
      const { height } = getViewportSize();
      return { x: safeDrawable.x - 6, y: 0, width: 12, height };
    }
    case "ray": {
      const { width, height } = getViewportSize();
      return getPointsBounds([...safeDrawable.points, { x: width, y: height }], 24);
    }
    case "channel": {
      const delta = {
        x: safeDrawable.parallelPoint.x - safeDrawable.baseStart.x,
        y: safeDrawable.parallelPoint.y - safeDrawable.baseStart.y
      };
      return getPointsBounds([
        safeDrawable.baseStart,
        safeDrawable.baseEnd,
        safeDrawable.parallelPoint,
        { x: safeDrawable.baseEnd.x + delta.x, y: safeDrawable.baseEnd.y + delta.y }
      ]);
    }
    case "qm_bullish":
    case "qm_bearish":
      return getPointsBounds(safeDrawable.points, 24);
    case "bos":
    case "choch":
      return getPointsBounds(safeDrawable.points, 20);
    case "fvg": {
      const rect = normalizeRect(safeDrawable.points[0], safeDrawable.points[1]);
      return {
        x: rect.x,
        y: rect.y,
        width: safeDrawable.extendRight ? Math.max(rect.width, 120) : rect.width,
        height: rect.height
      };
    }
    case "fibonacci_retracement": {
      const bounds = getPointsBounds(safeDrawable.points, 24);
      const { width } = getViewportSize();
      return {
        ...bounds,
        x: safeDrawable.extendLeft ? 0 : bounds.x,
        width:
          (safeDrawable.extendRight ? width : bounds.x + bounds.width) -
          (safeDrawable.extendLeft ? 0 : bounds.x)
      };
    }
    case "fibonacci_fan":
      return getPointsBounds(safeDrawable.points, 24);
    case "andrews_pitchfork":
      return getPointsBounds(safeDrawable.points, 24);
    case "liquidity_sweep":
      return getPointsBounds(safeDrawable.points, 24);
    case "binary_marker":
      return getPointsBounds(safeDrawable.points, 24);
  }
}

export function getAnchorHandles(drawable: Drawable): AnchorHandle[] {
  const safeDrawable = sanitizeDrawable(drawable);
  if (!safeDrawable) {
    return [];
  }

  switch (safeDrawable.type) {
    case "freehand":
      return [];
    case "line":
    case "arrow":
      return [
        { id: "start", point: safeDrawable.start },
        { id: "end", point: safeDrawable.end }
      ];
    case "rectangle":
    case "support_resistance_zone": {
      const rect = normalizeRect(safeDrawable.start, safeDrawable.end);
      return [
        { id: "nw", point: { x: rect.x, y: rect.y } },
        { id: "ne", point: { x: rect.x + rect.width, y: rect.y } },
        { id: "se", point: { x: rect.x + rect.width, y: rect.y + rect.height } },
        { id: "sw", point: { x: rect.x, y: rect.y + rect.height } }
      ];
    }
    case "text":
      return [{ id: "position", point: safeDrawable.point }];
    case "horizontal_line":
      return [{ id: "position", point: { x: getViewportSize().width / 2, y: safeDrawable.y } }];
    case "vertical_marker":
      return [{ id: "position", point: { x: safeDrawable.x, y: getViewportSize().height / 2 } }];
    case "ray":
      return safeDrawable.points.map((point, index) => ({ id: `point-${index}`, point }));
    case "trend":
      return safeDrawable.points.map((point, index) => ({ id: `point-${index}`, point }));
    case "channel":
      return [
        { id: "base-start", point: safeDrawable.baseStart },
        { id: "base-end", point: safeDrawable.baseEnd },
        { id: "parallel", point: safeDrawable.parallelPoint }
      ];
    case "qm_bullish":
    case "qm_bearish":
      return safeDrawable.points.map((point, index) => ({ id: `point-${index}`, point }));
    case "bos":
    case "choch":
      return safeDrawable.points.map((point, index) => ({ id: `point-${index}`, point }));
    case "fvg": {
      const rect = normalizeRect(safeDrawable.points[0], safeDrawable.points[1]);
      return [
        { id: "nw", point: { x: rect.x, y: rect.y } },
        { id: "ne", point: { x: rect.x + rect.width, y: rect.y } },
        { id: "se", point: { x: rect.x + rect.width, y: rect.y + rect.height } },
        { id: "sw", point: { x: rect.x, y: rect.y + rect.height } }
      ];
    }
    case "fibonacci_retracement":
    case "fibonacci_fan":
      return safeDrawable.points.map((point, index) => ({ id: `point-${index}`, point }));
    case "andrews_pitchfork":
      return safeDrawable.points.map((point, index) => ({ id: `point-${index}`, point }));
    case "liquidity_sweep":
      return safeDrawable.points.map((point, index) => ({ id: `point-${index}`, point }));
    case "binary_marker":
      return isLegacyVerticalMarker(safeDrawable)
        ? [{ id: "position", point: safeDrawable.points[0] }]
        : safeDrawable.points.map((point, index) => ({ id: `point-${index}`, point }));
  }
}

export function getSelectedObjectSummary(drawable: Drawable | null): SelectedObjectSummary | null {
  const safeDrawable = drawable ? sanitizeDrawable(drawable) : null;
  if (!safeDrawable) {
    return null;
  }

  return {
    id: safeDrawable.id,
    type: safeDrawable.type === "binary_marker" && isLegacyVerticalMarker(safeDrawable) ? "legacy_marker" : safeDrawable.type,
    locked: safeDrawable.locked === true,
    label:
      safeDrawable.type === "support_resistance_zone"
        ? safeDrawable.label
        : safeDrawable.type === "qm_bullish" || safeDrawable.type === "qm_bearish"
          ? safeDrawable.label
        : safeDrawable.type === "bos" || safeDrawable.type === "choch" || safeDrawable.type === "fvg" || safeDrawable.type === "liquidity_sweep"
          ? safeDrawable.label
        : safeDrawable.type === "horizontal_line" || safeDrawable.type === "vertical_marker" || safeDrawable.type === "ray"
          ? safeDrawable.label
        : safeDrawable.type === "binary_marker"
          ? isLegacyVerticalMarker(safeDrawable)
            ? getLegacyVerticalMarkerLabel(safeDrawable)
            : safeDrawable.label
          : undefined,
    strokeColor: safeDrawable.style.strokeColor,
    fillColor: safeDrawable.style.fillColor,
    strokeWidth: safeDrawable.style.strokeWidth,
    opacity: safeDrawable.style.opacity,
    text: safeDrawable.type === "text" ? safeDrawable.text : undefined,
    fontSize: safeDrawable.type === "text" ? safeDrawable.fontSize : undefined,
    fontWeight: safeDrawable.type === "text" ? safeDrawable.fontWeight : undefined,
    textAlign: safeDrawable.type === "text" ? safeDrawable.align : undefined,
    backgroundEnabled: safeDrawable.type === "text" ? safeDrawable.backgroundEnabled === true : undefined,
    backgroundColor: safeDrawable.type === "text" ? safeDrawable.backgroundColor : undefined,
    backgroundOpacity: safeDrawable.type === "text" ? safeDrawable.backgroundOpacity : undefined,
    padding: safeDrawable.type === "text" ? safeDrawable.padding : undefined,
    borderEnabled: safeDrawable.type === "text" ? safeDrawable.borderEnabled === true : undefined,
    borderColor: safeDrawable.type === "text" ? safeDrawable.borderColor : undefined,
    borderRadius: safeDrawable.type === "text" ? safeDrawable.borderRadius : undefined,
    showNeckline:
      safeDrawable.type === "qm_bullish" || safeDrawable.type === "qm_bearish"
        ? safeDrawable.showNeckline
        : undefined,
    showRetestZone:
      safeDrawable.type === "qm_bullish" || safeDrawable.type === "qm_bearish"
        ? safeDrawable.showRetestZone
        : undefined,
    showDirectionArrow:
      safeDrawable.type === "qm_bullish" || safeDrawable.type === "qm_bearish"
        ? safeDrawable.showDirectionArrow
        : undefined,
    showLabels:
      safeDrawable.type === "trend" ||
      safeDrawable.type === "qm_bullish" ||
      safeDrawable.type === "qm_bearish" ||
      safeDrawable.type === "fibonacci_retracement" ||
      safeDrawable.type === "fibonacci_fan" ||
      safeDrawable.type === "andrews_pitchfork"
        ? safeDrawable.showLabels
        : undefined,
    extendRight:
      safeDrawable.type === "fvg" || safeDrawable.type === "fibonacci_retracement"
        ? Boolean(safeDrawable.extendRight)
        : undefined,
    extendLeft: safeDrawable.type === "fibonacci_retracement" ? Boolean(safeDrawable.extendLeft) : undefined,
    showSweepMarker: safeDrawable.type === "liquidity_sweep" ? safeDrawable.showSweepMarker : undefined,
    showPercentages:
      safeDrawable.type === "fibonacci_retracement" || safeDrawable.type === "fibonacci_fan"
        ? safeDrawable.showPercentages === true
        : undefined,
    levels:
      safeDrawable.type === "fibonacci_retracement" || safeDrawable.type === "fibonacci_fan"
        ? [...safeDrawable.levels]
        : undefined,
    pitchforkVariant: safeDrawable.type === "andrews_pitchfork" ? safeDrawable.variant : undefined,
    showMedianLine: safeDrawable.type === "andrews_pitchfork" ? safeDrawable.showMedianLine : undefined,
    showOuterLines: safeDrawable.type === "andrews_pitchfork" ? safeDrawable.showOuterLines : undefined,
    showAnchorLine: safeDrawable.type === "andrews_pitchfork" ? safeDrawable.showAnchorLine : undefined
  };
}

export function moveDrawable(drawable: Drawable, delta: Point): Drawable {
  if (drawable.locked) {
    return drawable;
  }
  switch (drawable.type) {
    case "freehand":
      return { ...drawable, points: drawable.points.map((point) => translatePoint(point, delta)) };
    case "line":
    case "arrow":
      return {
        ...drawable,
        start: translatePoint(drawable.start, delta),
        end: translatePoint(drawable.end, delta)
      };
    case "rectangle":
    case "support_resistance_zone":
      return {
        ...drawable,
        start: translatePoint(drawable.start, delta),
        end: translatePoint(drawable.end, delta)
      };
    case "text":
      return { ...drawable, point: translatePoint(drawable.point, delta) };
    case "horizontal_line":
      return { ...drawable, y: drawable.y + delta.y };
    case "vertical_marker":
      return { ...drawable, x: drawable.x + delta.x };
    case "ray":
      return { ...drawable, points: drawable.points.map((point) => translatePoint(point, delta)) };
    case "trend":
      return { ...drawable, points: drawable.points.map((point) => translatePoint(point, delta)) };
    case "channel":
      return {
        ...drawable,
        baseStart: translatePoint(drawable.baseStart, delta),
        baseEnd: translatePoint(drawable.baseEnd, delta),
        parallelPoint: translatePoint(drawable.parallelPoint, delta)
      };
    case "qm_bullish":
    case "qm_bearish":
      return { ...drawable, points: drawable.points.map((point) => translatePoint(point, delta)) };
    case "bos":
    case "choch":
    case "fvg":
    case "fibonacci_retracement":
    case "fibonacci_fan":
    case "andrews_pitchfork":
    case "liquidity_sweep":
      return { ...drawable, points: drawable.points.map((point) => translatePoint(point, delta)) };
    case "binary_marker":
      return { ...drawable, points: drawable.points.map((point) => translatePoint(point, delta)) };
  }
}

export function updateDrawableAnchor(drawable: Drawable, anchorId: string, point: Point): Drawable {
  if (drawable.locked) {
    return drawable;
  }
  switch (drawable.type) {
    case "freehand":
      return drawable;
    case "line":
    case "arrow":
      return anchorId === "start" ? { ...drawable, start: point } : { ...drawable, end: point };
    case "rectangle":
    case "support_resistance_zone": {
      const rect = normalizeRect(drawable.start, drawable.end);
      const corners = {
        nw: { x: rect.x, y: rect.y },
        ne: { x: rect.x + rect.width, y: rect.y },
        se: { x: rect.x + rect.width, y: rect.y + rect.height },
        sw: { x: rect.x, y: rect.y + rect.height }
      };

      switch (anchorId) {
        case "nw":
          return { ...drawable, start: point, end: corners.se };
        case "ne":
          return { ...drawable, start: { x: corners.sw.x, y: point.y }, end: { x: point.x, y: corners.sw.y } };
        case "se":
          return { ...drawable, start: corners.nw, end: point };
        case "sw":
          return { ...drawable, start: { x: point.x, y: corners.ne.y }, end: { x: corners.ne.x, y: point.y } };
        default:
          return drawable;
      }
    }
    case "text":
      return { ...drawable, point };
    case "horizontal_line":
      return { ...drawable, y: point.y };
    case "vertical_marker":
      return { ...drawable, x: point.x };
    case "ray": {
      const index = Number(anchorId.replace("point-", ""));
      if (!Number.isInteger(index) || index < 0 || index >= drawable.points.length) {
        return drawable;
      }
      return {
        ...drawable,
        points: drawable.points.map((entry, entryIndex) => (entryIndex === index ? point : entry))
      };
    }
    case "trend": {
      const index = Number(anchorId.replace("point-", ""));
      if (!Number.isInteger(index) || index < 0 || index >= drawable.points.length) {
        return drawable;
      }

      return {
        ...drawable,
        points: drawable.points.map((entry, entryIndex) => (entryIndex === index ? point : entry))
      };
    }
    case "channel":
      if (anchorId === "base-start") {
        return { ...drawable, baseStart: point };
      }
      if (anchorId === "base-end") {
        return { ...drawable, baseEnd: point };
      }
      if (anchorId === "parallel") {
        return { ...drawable, parallelPoint: point };
      }
      return drawable;
    case "qm_bullish":
    case "qm_bearish": {
      const index = Number(anchorId.replace("point-", ""));
      if (!Number.isInteger(index) || index < 0 || index >= drawable.points.length) {
        return drawable;
      }

      return {
        ...drawable,
        points: drawable.points.map((entry, entryIndex) => (entryIndex === index ? point : entry))
      };
    }
    case "bos":
    case "choch":
    case "liquidity_sweep": {
      const index = Number(anchorId.replace("point-", ""));
      if (!Number.isInteger(index) || index < 0 || index >= drawable.points.length) {
        return drawable;
      }

      return {
        ...drawable,
        points: drawable.points.map((entry, entryIndex) => (entryIndex === index ? point : entry))
      };
    }
    case "fvg": {
      const rect = normalizeRect(drawable.points[0], drawable.points[1]);
      const corners = {
        nw: { x: rect.x, y: rect.y },
        ne: { x: rect.x + rect.width, y: rect.y },
        se: { x: rect.x + rect.width, y: rect.y + rect.height },
        sw: { x: rect.x, y: rect.y + rect.height }
      };

      switch (anchorId) {
        case "nw":
          return { ...drawable, points: [point, corners.se] };
        case "ne":
          return { ...drawable, points: [{ x: corners.sw.x, y: point.y }, { x: point.x, y: corners.sw.y }] };
        case "se":
          return { ...drawable, points: [corners.nw, point] };
        case "sw":
          return { ...drawable, points: [{ x: point.x, y: corners.ne.y }, { x: corners.ne.x, y: point.y }] };
        default:
          return drawable;
      }
    }
    case "fibonacci_retracement":
    case "fibonacci_fan":
    case "andrews_pitchfork": {
      const index = Number(anchorId.replace("point-", ""));
      if (!Number.isInteger(index) || index < 0 || index >= drawable.points.length) {
        return drawable;
      }
      return {
        ...drawable,
        points: drawable.points.map((entry, entryIndex) => (entryIndex === index ? point : entry))
      };
    }
    case "binary_marker":
      if (isLegacyVerticalMarker(drawable)) {
        const nextSecond = drawable.points[1]
          ? { ...drawable.points[1], x: point.x }
          : { x: point.x, y: point.y + 48 };
        return { ...drawable, points: [{ x: point.x, y: point.y }, nextSecond] };
      }
      if (!anchorId.startsWith("point-")) {
        return drawable;
      }
      const markerIndex = Number(anchorId.replace("point-", ""));
      if (!Number.isInteger(markerIndex) || markerIndex < 0 || markerIndex >= drawable.points.length) {
        return drawable;
      }
      return {
        ...drawable,
        points: drawable.points.map((entry, entryIndex) => (entryIndex === markerIndex ? point : entry))
      };
  }
}

export function patchDrawableProperties(drawable: Drawable, patch: EditablePropertiesPatch): Drawable {
  const nextLocked = typeof patch.locked === "boolean" ? patch.locked : drawable.locked === true;
  if (drawable.locked && patch.locked !== false) {
    return { ...drawable, locked: nextLocked };
  }

  const style = {
    ...drawable.style,
    strokeColor: patch.strokeColor ?? drawable.style.strokeColor,
    fillColor: patch.fillColor ?? drawable.style.fillColor ?? patch.strokeColor ?? drawable.style.strokeColor,
    strokeWidth: clampStrokeWidth(patch.strokeWidth, drawable.style.strokeWidth),
    opacity: clampOpacity(patch.opacity, drawable.style.opacity)
  };

  switch (drawable.type) {
    case "text":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        text: typeof patch.text === "string" ? patch.text : drawable.text,
        fontSize: clampTextFontSize(patch.fontSize ?? drawable.fontSize),
        fontWeight: sanitizeTextFontWeight(patch.fontWeight ?? drawable.fontWeight),
        align: sanitizeTextAlign(patch.textAlign ?? drawable.align),
        backgroundEnabled:
          typeof patch.backgroundEnabled === "boolean" ? patch.backgroundEnabled : drawable.backgroundEnabled,
        backgroundColor:
          typeof patch.backgroundColor === "string" && patch.backgroundColor.trim()
            ? patch.backgroundColor
            : drawable.backgroundColor ?? DEFAULT_TEXT_BACKGROUND_COLOR,
        backgroundOpacity: clampTextOpacity(
          patch.backgroundOpacity ?? drawable.backgroundOpacity,
          drawable.backgroundOpacity ?? 0.82
        ),
        padding: clampTextPadding(patch.padding ?? drawable.padding),
        borderEnabled:
          typeof patch.borderEnabled === "boolean" ? patch.borderEnabled : drawable.borderEnabled,
        borderColor:
          typeof patch.borderColor === "string" && patch.borderColor.trim()
            ? patch.borderColor
            : drawable.borderColor ?? DEFAULT_TEXT_BORDER_COLOR,
        borderRadius: clampTextBorderRadius(patch.borderRadius ?? drawable.borderRadius)
      };
    case "horizontal_line":
    case "vertical_marker":
    case "ray":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        label: typeof patch.label === "string" ? patch.label : drawable.label
      };
    case "support_resistance_zone":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        label: typeof patch.label === "string" && patch.label.trim() ? patch.label : drawable.label
      };
    case "trend":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        showLabels: typeof patch.showLabels === "boolean" ? patch.showLabels : drawable.showLabels
      };
    case "qm_bullish":
    case "qm_bearish":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        label: typeof patch.label === "string" ? patch.label : drawable.label,
        showLabels: typeof patch.showLabels === "boolean" ? patch.showLabels : drawable.showLabels,
        showNeckline:
          typeof patch.showNeckline === "boolean" ? patch.showNeckline : drawable.showNeckline,
        showRetestZone:
          typeof patch.showRetestZone === "boolean" ? patch.showRetestZone : drawable.showRetestZone,
        showDirectionArrow:
          typeof patch.showDirectionArrow === "boolean"
            ? patch.showDirectionArrow
            : drawable.showDirectionArrow
      };
    case "bos":
    case "choch":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        label: typeof patch.label === "string" ? patch.label : drawable.label
      };
    case "fvg":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        label: typeof patch.label === "string" ? patch.label : drawable.label,
        extendRight: typeof patch.extendRight === "boolean" ? patch.extendRight : drawable.extendRight
      };
    case "fibonacci_retracement":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        levels: normalizeFibLevels(
          patch.levels ?? drawable.levels,
          DEFAULT_FIBONACCI_RETRACEMENT_LEVELS
        ),
        showLabels: typeof patch.showLabels === "boolean" ? patch.showLabels : drawable.showLabels,
        showPercentages:
          typeof patch.showPercentages === "boolean" ? patch.showPercentages : drawable.showPercentages,
        extendLeft: typeof patch.extendLeft === "boolean" ? patch.extendLeft : drawable.extendLeft,
        extendRight: typeof patch.extendRight === "boolean" ? patch.extendRight : drawable.extendRight
      };
    case "fibonacci_fan":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        levels: normalizeFibLevels(patch.levels ?? drawable.levels, DEFAULT_FIBONACCI_FAN_LEVELS),
        showLabels: typeof patch.showLabels === "boolean" ? patch.showLabels : drawable.showLabels,
        showPercentages:
          typeof patch.showPercentages === "boolean" ? patch.showPercentages : drawable.showPercentages
      };
    case "andrews_pitchfork":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        showLabels: typeof patch.showLabels === "boolean" ? patch.showLabels : drawable.showLabels,
        variant: patch.pitchforkVariant ? sanitizePitchforkVariant(patch.pitchforkVariant) : drawable.variant,
        showMedianLine:
          typeof patch.showMedianLine === "boolean" ? patch.showMedianLine : drawable.showMedianLine,
        showOuterLines:
          typeof patch.showOuterLines === "boolean" ? patch.showOuterLines : drawable.showOuterLines,
        showAnchorLine:
          typeof patch.showAnchorLine === "boolean" ? patch.showAnchorLine : drawable.showAnchorLine
      };
    case "liquidity_sweep":
      return {
        ...drawable,
        locked: nextLocked,
        style,
        label: typeof patch.label === "string" ? patch.label : drawable.label,
        showSweepMarker:
          typeof patch.showSweepMarker === "boolean" ? patch.showSweepMarker : drawable.showSweepMarker
      };
    case "binary_marker":
      if (isLegacyVerticalMarker(drawable)) {
        return {
          ...drawable,
          locked: nextLocked,
          style,
          label: typeof patch.label === "string" ? patch.label : drawable.label,
          customExpiryText:
            typeof patch.label === "string" && patch.label.trim() ? patch.label : drawable.customExpiryText
        };
      }
      return {
        ...drawable,
        locked: nextLocked,
        style,
        label: typeof patch.label === "string" && patch.label.trim() ? patch.label : drawable.label
      };
    default:
      return { ...drawable, locked: nextLocked, style };
  }
}

export function duplicateDrawable(drawable: Drawable): Drawable {
  const duplicated = moveDrawable(drawable, { x: 24, y: 24 });
  return { ...duplicated, id: createId(`${drawable.type}-copy`), createdAt: Date.now() };
}

export function hitTestAnchorHandle(point: Point, drawable: Drawable, tolerance = 10) {
  const anchors = getAnchorHandles(drawable);
  return anchors.find((anchor) => distance(point, anchor.point) <= tolerance) ?? null;
}
