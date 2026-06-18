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
  StructureBreakPattern,
  DrawingStyle,
  Point,
  PreviewShape,
  QMPattern,
  RayPattern,
  TrendPattern
} from "../types/drawables";
import {
  formatFibLevelLabel,
  getPitchforkVisibleLines,
  getRayEnd,
} from "./chart-patterns";
import { sanitizeDrawable } from "./drawable-validation";
import { normalizeRect } from "./geometry";
import { getLegacyVerticalMarkerLabel, isLegacyVerticalMarker } from "./legacy-markers";
import { getAnchorHandles, getDrawableBounds } from "./object-editing";
import {
  DEFAULT_TEXT_BACKGROUND_COLOR,
  DEFAULT_TEXT_BORDER_COLOR,
  estimateTextLayout,
  getTextFontDeclaration,
  getTextLineX,
  sanitizeTextAlign
} from "./text-drawable";

function applyStyle(ctx: CanvasRenderingContext2D, style: DrawingStyle) {
  ctx.strokeStyle = style.strokeColor;
  ctx.fillStyle = style.fillColor ?? style.strokeColor;
  ctx.lineWidth = style.strokeWidth;
  ctx.globalAlpha = style.opacity;
  ctx.setLineDash(style.dashed ? [8, 6] : []);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function drawPolyline(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length === 0) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }

  ctx.stroke();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, from: Point, to: Point, size: number) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const wing = Math.PI / 7;

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - Math.cos(angle - wing) * size,
    to.y - Math.sin(angle - wing) * size
  );
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - Math.cos(angle + wing) * size,
    to.y - Math.sin(angle + wing) * size
  );
  ctx.stroke();
}

function getCanvasSize(ctx: CanvasRenderingContext2D) {
  const width = typeof window !== "undefined" ? window.innerWidth : ctx.canvas.width;
  const height = typeof window !== "undefined" ? window.innerHeight : ctx.canvas.height;
  return { width, height };
}

function drawHorizontalLine(ctx: CanvasRenderingContext2D, line: HorizontalLineShape) {
  const { width } = getCanvasSize(ctx);
  ctx.beginPath();
  ctx.moveTo(0, line.y);
  ctx.lineTo(width, line.y);
  ctx.stroke();

  if (line.label?.trim()) {
    drawTextTag(ctx, line.label, { x: Math.max(76, width * 0.18), y: line.y - 6 }, line.style);
  }
}

function drawVerticalMarker(ctx: CanvasRenderingContext2D, marker: { x: number; label?: string; style: DrawingStyle }) {
  const { height } = getCanvasSize(ctx);
  ctx.beginPath();
  ctx.moveTo(marker.x, 0);
  ctx.lineTo(marker.x, height);
  ctx.stroke();

  if (marker.label?.trim()) {
    drawTextTag(ctx, marker.label, { x: marker.x, y: 48 }, marker.style);
  }
}

function drawRay(ctx: CanvasRenderingContext2D, ray: RayPattern) {
  const [start, through] = ray.points;
  const { width, height } = getCanvasSize(ctx);
  const end = getRayEnd(start, through, width, height);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  drawArrowHead(ctx, start, end, Math.max(10, ray.style.strokeWidth * 3));

  if (ray.label?.trim()) {
    drawTextTag(ctx, ray.label, start, ray.style);
  }
}

function getQMLabels(pattern: QMPattern) {
  return pattern.type === "qm_bearish"
    ? ["LS", "Low", "HH", "LL", "Retest"]
    : ["LS", "High", "LL", "HH", "Retest"];
}

function getQMRetestRect(pattern: QMPattern) {
  const anchor = pattern.points[4];
  const reference = pattern.points[3] ?? pattern.points[4];
  const zoneWidth = Math.max(48, Math.abs(anchor.x - reference.x) * 0.35);
  const zoneHeight = Math.max(14, pattern.style.strokeWidth * 4);

  return {
    x: anchor.x - zoneWidth / 2,
    y: anchor.y - zoneHeight / 2,
    width: zoneWidth,
    height: zoneHeight
  };
}

function drawTextTag(ctx: CanvasRenderingContext2D, label: string, point: Point, style: DrawingStyle) {
  ctx.save();
  ctx.font = "600 14px Segoe UI";
  const metrics = ctx.measureText(label);
  const width = metrics.width + 12;
  const height = 22;
  ctx.fillStyle = "rgba(2, 8, 23, 0.86)";
  ctx.globalAlpha = 0.9;
  ctx.fillRect(point.x - width / 2, point.y - height - 8, width, height);
  ctx.strokeStyle = style.strokeColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(point.x - width / 2, point.y - height - 8, width, height);
  ctx.fillStyle = "#E5E7EB";
  ctx.globalAlpha = 1;
  ctx.fillText(label, point.x - metrics.width / 2, point.y - 13);
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function renderTextDrawable(ctx: CanvasRenderingContext2D, textDrawable: Extract<Drawable, { type: "text" }>) {
  const metrics = estimateTextLayout(textDrawable);
  const align = sanitizeTextAlign(textDrawable.align);
  const fontDeclaration = getTextFontDeclaration(textDrawable);
  ctx.save();
  ctx.font = fontDeclaration;
  const measuredWidths = metrics.lines.map((line) => ctx.measureText(line || " ").width);
  const contentWidth = Math.max(metrics.contentWidth, ...measuredWidths);
  const liveMetrics = {
    ...metrics,
    contentWidth,
    width: contentWidth + metrics.padding * 2
  };

  if (textDrawable.backgroundEnabled) {
    ctx.save();
    ctx.globalAlpha *= textDrawable.backgroundOpacity ?? 0.82;
    ctx.fillStyle = textDrawable.backgroundColor ?? DEFAULT_TEXT_BACKGROUND_COLOR;
    drawRoundedRect(
      ctx,
      liveMetrics.x,
      liveMetrics.y,
      liveMetrics.width,
      liveMetrics.height,
      textDrawable.borderRadius ?? 10
    );
    ctx.fill();
    ctx.restore();
  }

  if (textDrawable.borderEnabled) {
    ctx.save();
    ctx.strokeStyle = textDrawable.borderColor ?? DEFAULT_TEXT_BORDER_COLOR;
    ctx.lineWidth = 1;
    drawRoundedRect(
      ctx,
      liveMetrics.x,
      liveMetrics.y,
      liveMetrics.width,
      liveMetrics.height,
      textDrawable.borderRadius ?? 10
    );
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = textDrawable.style.strokeColor;
  ctx.textBaseline = "alphabetic";
  metrics.lines.forEach((line, index) => {
    const lineWidth = measuredWidths[index] ?? ctx.measureText(line || " ").width;
    const x = getTextLineX(liveMetrics, lineWidth, align);
    const baselineY = liveMetrics.firstBaselineY + liveMetrics.lineHeight * index;
    ctx.fillText(line || " ", x, baselineY);
  });
  ctx.restore();
}

function renderTrendLabels(ctx: CanvasRenderingContext2D, pattern: TrendPattern) {
  if (!pattern.showLabels || pattern.points.length < 2) {
    return;
  }

  const labels =
    pattern.direction === "bullish"
      ? ["HL", "HH"]
      : pattern.direction === "bearish"
        ? ["LH", "LL"]
        : ["P1", "P2"];

  pattern.points.forEach((point, index) => {
    const label = labels[index % labels.length];
    drawTextTag(ctx, label, point, pattern.style);
  });
}

function getFibRange(points: Point[]) {
  const [start, end] = points;
  const left = Math.min(start.x, end.x);
  const right = Math.max(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const bottom = Math.max(start.y, end.y);
  return { start, end, left, right, top, bottom };
}

function getRetracementLineRange(
  left: number,
  right: number,
  canvasWidth: number,
  extendLeft?: boolean,
  extendRight?: boolean
) {
  return {
    left: extendLeft ? 0 : left,
    right: extendRight ? canvasWidth : right
  };
}

function getFibLabelPosition(lineLeft: number, lineRight: number, y: number, index: number) {
  const center = lineLeft + (lineRight - lineLeft) / 2;
  const x = lineLeft + Math.min(56, Math.max(28, (lineRight - lineLeft) * 0.08));
  const offset = index % 2 === 0 ? -4 : 14;
  return {
    left: { x, y: y + offset },
    center: { x: center, y: y + offset }
  };
}

function renderFibonacciRetracement(ctx: CanvasRenderingContext2D, fib: FibonacciRetracementPattern) {
  const { left, right, top, bottom } = getFibRange(fib.points);
  const range = getRetracementLineRange(left, right, ctx.canvas.width, fib.extendLeft, fib.extendRight);

  for (const [index, level] of fib.levels.entries()) {
    const y = top + (bottom - top) * level;
    ctx.beginPath();
    ctx.moveTo(range.left, y);
    ctx.lineTo(range.right, y);
    ctx.stroke();

    if (fib.showLabels) {
      const positions = getFibLabelPosition(range.left, range.right, y, index);
      const label = formatFibLevelLabel(level, fib.showPercentages === true);
      drawTextTag(ctx, label, positions.left, fib.style);
    }
  }
}

function renderFibonacciFan(ctx: CanvasRenderingContext2D, fib: FibonacciFanPattern) {
  const [start, end] = fib.points;
  const { width, height } = getCanvasSize(ctx);
  for (const [index, level] of fib.levels.entries()) {
    const through = {
      x: end.x,
      y: start.y + (end.y - start.y) * level
    };
    const rayEnd = getRayEnd(start, through, width, height);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(rayEnd.x, rayEnd.y);
    ctx.stroke();

    if (fib.showLabels) {
      drawTextTag(
        ctx,
        formatFibLevelLabel(level, fib.showPercentages === true),
        { x: through.x, y: through.y + (index % 2 === 0 ? -4 : 14) },
        fib.style
      );
    }
  }
}

function renderAndrewsPitchfork(ctx: CanvasRenderingContext2D, pitchfork: AndrewsPitchforkPattern) {
  const { width, height } = getCanvasSize(ctx);
  const geometry = getPitchforkVisibleLines(
    pitchfork.points,
    pitchfork.variant ?? "standard",
    width,
    height
  );

  if (pitchfork.showMedianLine !== false && geometry.medianLine) {
    ctx.beginPath();
    ctx.moveTo(geometry.medianLine.start.x, geometry.medianLine.start.y);
    ctx.lineTo(geometry.medianLine.end.x, geometry.medianLine.end.y);
    ctx.stroke();
  }

  if (pitchfork.showOuterLines !== false) {
    for (const line of geometry.outerLines) {
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();
    }
  }

  if (pitchfork.showAnchorLine === true) {
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(geometry.anchor.x, geometry.anchor.y);
    ctx.lineTo(geometry.medianTarget.x, geometry.medianTarget.y);
    ctx.stroke();
    ctx.restore();
  }

  if (pitchfork.showLabels) {
    drawTextTag(ctx, "A", pitchfork.points[0], pitchfork.style);
    drawTextTag(ctx, "B", pitchfork.points[1], pitchfork.style);
    drawTextTag(ctx, "C", pitchfork.points[2], pitchfork.style);
    if ((pitchfork.variant ?? "standard") !== "standard") {
      drawTextTag(
        ctx,
        pitchfork.variant === "schiff" ? "Schiff" : "Modified Schiff",
        geometry.anchor,
        pitchfork.style
      );
    }
  }
}

function renderChannel(ctx: CanvasRenderingContext2D, pattern: ChannelPattern) {
  const delta = {
    x: pattern.parallelPoint.x - pattern.baseStart.x,
    y: pattern.parallelPoint.y - pattern.baseStart.y
  };
  const secondaryStart = {
    x: pattern.baseStart.x + delta.x,
    y: pattern.baseStart.y + delta.y
  };
  const secondaryEnd = {
    x: pattern.baseEnd.x + delta.x,
    y: pattern.baseEnd.y + delta.y
  };

  ctx.beginPath();
  ctx.moveTo(pattern.baseStart.x, pattern.baseStart.y);
  ctx.lineTo(pattern.baseEnd.x, pattern.baseEnd.y);
  ctx.moveTo(secondaryStart.x, secondaryStart.y);
  ctx.lineTo(secondaryEnd.x, secondaryEnd.y);
  ctx.stroke();

  if (pattern.showMidline) {
    ctx.save();
    ctx.globalAlpha *= 0.7;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo((pattern.baseStart.x + secondaryStart.x) / 2, (pattern.baseStart.y + secondaryStart.y) / 2);
    ctx.lineTo((pattern.baseEnd.x + secondaryEnd.x) / 2, (pattern.baseEnd.y + secondaryEnd.y) / 2);
    ctx.stroke();
    ctx.restore();
  }
}

function renderBinaryMarker(ctx: CanvasRenderingContext2D, marker: BinaryMarker) {
  const [anchor, second] = marker.points;
  if (!anchor) {
    return;
  }

  switch (marker.markerType) {
    case "call_marker":
    case "put_marker": {
      const direction = marker.markerType === "call_marker" ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.lineTo(anchor.x, anchor.y + direction * 42);
      ctx.stroke();
      drawArrowHead(
        ctx,
        { x: anchor.x, y: anchor.y + direction * 20 },
        { x: anchor.x, y: anchor.y + direction * 42 },
        12
      );
      drawTextTag(
        ctx,
        marker.label ?? (marker.markerType === "call_marker" ? "CALL" : "PUT"),
        { x: anchor.x, y: anchor.y + direction * 58 },
        marker.style
      );
      break;
    }
    case "expiry_line": {
      const topY = 36;
      const bottomY = ctx.canvas.height - 36;
      ctx.beginPath();
      ctx.moveTo(anchor.x, topY);
      ctx.lineTo(anchor.x, bottomY);
      ctx.stroke();
      drawTextTag(
        ctx,
        getLegacyVerticalMarkerLabel(marker),
        { x: anchor.x, y: Math.max(50, (second?.y ?? 84)) },
        marker.style
      );
      break;
    }
  }
}

function inferBreakDirection(pattern: StructureBreakPattern) {
  const [start, end] = pattern.points;
  if (!start || !end) {
    return "neutral";
  }
  if (end.y < start.y) {
    return "bullish";
  }
  if (end.y > start.y) {
    return "bearish";
  }
  return "neutral";
}

function renderStructureBreak(ctx: CanvasRenderingContext2D, pattern: StructureBreakPattern) {
  const [start, end] = pattern.points;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  const direction = pattern.direction ?? inferBreakDirection(pattern);
  if (pattern.showArrow) {
    drawArrowHead(ctx, start, end, Math.max(10, pattern.style.strokeWidth * 3));
  }

  drawTextTag(
    ctx,
    pattern.label?.trim() || pattern.type.toUpperCase(),
    { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - (direction === "bearish" ? -18 : 18) },
    pattern.style
  );
}

function getFVGRect(pattern: FVGPattern, canvasWidth: number) {
  const rect = normalizeRect(pattern.points[0], pattern.points[1]);
  if (!pattern.extendRight) {
    return rect;
  }

  return {
    x: rect.x,
    y: rect.y,
    width: Math.max(rect.width, canvasWidth - rect.x - 24),
    height: rect.height
  };
}

function renderFVG(ctx: CanvasRenderingContext2D, pattern: FVGPattern) {
  const rect = getFVGRect(pattern, ctx.canvas.width);
  ctx.save();
  ctx.fillStyle = pattern.style.fillColor ?? pattern.style.strokeColor;
  ctx.globalAlpha = Math.max(0.08, pattern.style.opacity * 0.18);
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.globalAlpha = pattern.style.opacity;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
  drawTextTag(
    ctx,
    pattern.label?.trim() || "FVG",
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 + 12 },
    pattern.style
  );
}

function renderLiquiditySweep(ctx: CanvasRenderingContext2D, pattern: LiquiditySweepPattern) {
  const [start, end, sweep] = pattern.points;
  ctx.save();
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo((start.x + end.x) / 2, (start.y + end.y) / 2);
  ctx.lineTo(sweep.x, sweep.y);
  ctx.stroke();

  if (pattern.showSweepMarker) {
    ctx.beginPath();
    ctx.arc(sweep.x, sweep.y, Math.max(4, pattern.style.strokeWidth + 1.5), 0, Math.PI * 2);
    ctx.fillStyle = pattern.style.strokeColor;
    ctx.fill();
    drawArrowHead(
      ctx,
      { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
      sweep,
      Math.max(10, pattern.style.strokeWidth * 3)
    );
  }

  drawTextTag(ctx, pattern.label?.trim() || "Sweep", sweep, pattern.style);
}

function renderQM(ctx: CanvasRenderingContext2D, pattern: QMPattern) {
  drawPolyline(ctx, pattern.points);

  for (const point of pattern.points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(3, pattern.style.strokeWidth + 1.5), 0, Math.PI * 2);
    ctx.fillStyle = pattern.style.strokeColor;
    ctx.globalAlpha = Math.min(1, pattern.style.opacity);
    ctx.fill();
  }

  if (pattern.showLabels) {
    const labels = getQMLabels(pattern);
    pattern.points.forEach((point, index) => {
      drawTextTag(ctx, labels[index] ?? `P${index + 1}`, point, pattern.style);
    });
  }

  if (pattern.showNeckline) {
    const start = pattern.points[1];
    const end = pattern.points[4];
    ctx.save();
    ctx.globalAlpha *= 0.7;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, start.y);
    ctx.stroke();
    ctx.restore();
  }

  if (pattern.showRetestZone) {
    const rect = getQMRetestRect(pattern);
    ctx.save();
    ctx.fillStyle = pattern.style.fillColor ?? pattern.style.strokeColor;
    ctx.globalAlpha = Math.max(0.08, pattern.style.opacity * 0.16);
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.globalAlpha = pattern.style.opacity;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  if (pattern.showDirectionArrow) {
    const anchor = pattern.points[4];
    const direction = pattern.type === "qm_bearish" ? 1 : -1;
    const target = { x: anchor.x + 48, y: anchor.y + direction * 30 };
    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    drawArrowHead(ctx, anchor, target, Math.max(10, pattern.style.strokeWidth * 3));
  }

  drawTextTag(
    ctx,
    pattern.label?.trim() || (pattern.type === "qm_bearish" ? "Bearish QM" : "Bullish QM"),
    pattern.points[4],
    pattern.style
  );
}

export function renderDrawable(ctx: CanvasRenderingContext2D, drawable: Drawable) {
  const safeDrawable = sanitizeDrawable(drawable);
  if (!safeDrawable) {
    return;
  }

  ctx.save();
  applyStyle(ctx, safeDrawable.style);

  switch (safeDrawable.type) {
    case "freehand":
      drawPolyline(ctx, safeDrawable.points);
      break;
    case "line":
      ctx.beginPath();
      ctx.moveTo(safeDrawable.start.x, safeDrawable.start.y);
      ctx.lineTo(safeDrawable.end.x, safeDrawable.end.y);
      ctx.stroke();
      break;
    case "arrow":
      ctx.beginPath();
      ctx.moveTo(safeDrawable.start.x, safeDrawable.start.y);
      ctx.lineTo(safeDrawable.end.x, safeDrawable.end.y);
      ctx.stroke();
      drawArrowHead(
        ctx,
        safeDrawable.start,
        safeDrawable.end,
        Math.max(10, safeDrawable.style.strokeWidth * 3)
      );
      break;
    case "rectangle": {
      const rect = normalizeRect(safeDrawable.start, safeDrawable.end);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      break;
    }
    case "support_resistance_zone": {
      const rect = normalizeRect(safeDrawable.start, safeDrawable.end);
      ctx.fillStyle = safeDrawable.style.fillColor ?? safeDrawable.style.strokeColor;
      ctx.globalAlpha = Math.max(0.08, safeDrawable.style.opacity * 0.18);
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.globalAlpha = safeDrawable.style.opacity;
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      drawTextTag(ctx, safeDrawable.label, { x: rect.x + rect.width / 2, y: rect.y + 28 }, safeDrawable.style);
      break;
    }
    case "text":
      renderTextDrawable(ctx, safeDrawable);
      break;
    case "horizontal_line":
      drawHorizontalLine(ctx, safeDrawable);
      break;
    case "vertical_marker":
      drawVerticalMarker(ctx, safeDrawable);
      break;
    case "ray":
      drawRay(ctx, safeDrawable);
      break;
    case "trend":
      drawPolyline(ctx, safeDrawable.points);
      if (safeDrawable.showArrows && safeDrawable.points.length > 1) {
        const last = safeDrawable.points[safeDrawable.points.length - 1];
        const prev = safeDrawable.points[safeDrawable.points.length - 2];
        drawArrowHead(ctx, prev, last, Math.max(10, safeDrawable.style.strokeWidth * 3));
      }
      renderTrendLabels(ctx, safeDrawable);
      break;
    case "channel":
      renderChannel(ctx, safeDrawable);
      break;
    case "fibonacci_retracement":
      renderFibonacciRetracement(ctx, safeDrawable);
      break;
    case "fibonacci_fan":
      renderFibonacciFan(ctx, safeDrawable);
      break;
    case "andrews_pitchfork":
      renderAndrewsPitchfork(ctx, safeDrawable);
      break;
    case "qm_bullish":
    case "qm_bearish":
      renderQM(ctx, safeDrawable);
      break;
    case "bos":
    case "choch":
      if (safeDrawable.type === "choch") {
        ctx.save();
        ctx.setLineDash([10, 6]);
        renderStructureBreak(ctx, safeDrawable);
        ctx.restore();
      } else {
        renderStructureBreak(ctx, safeDrawable);
      }
      break;
    case "fvg":
      renderFVG(ctx, safeDrawable);
      break;
    case "liquidity_sweep":
      renderLiquiditySweep(ctx, safeDrawable);
      break;
    case "binary_marker":
      if (isLegacyVerticalMarker(safeDrawable)) {
        renderBinaryMarker(ctx, safeDrawable);
        break;
      }
      renderBinaryMarker(ctx, safeDrawable);
      break;
  }

  ctx.restore();
}

export function renderPreview(ctx: CanvasRenderingContext2D, preview: PreviewShape | null) {
  if (!preview) {
    return;
  }

  ctx.save();

  if (preview.type === "trend_preview") {
    applyStyle(ctx, preview.style);
    drawPolyline(ctx, preview.points);
    ctx.restore();
    return;
  }

  if (preview.type === "channel_preview") {
    applyStyle(ctx, preview.style);
    renderChannel(ctx, {
      id: "preview",
      type: "channel",
      mode: "range",
      baseStart: preview.baseStart,
      baseEnd: preview.baseEnd,
      parallelPoint: preview.parallelPoint,
      showMidline: true,
      extendRight: false,
      style: preview.style,
      createdAt: Date.now()
    });
    ctx.restore();
    return;
  }

  if (preview.type === "qm_preview") {
    applyStyle(ctx, preview.style);
    if (preview.points.length > 1) {
      drawPolyline(ctx, preview.points);
    }
    for (const point of preview.points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(3, preview.style.strokeWidth + 1.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  renderDrawable(ctx, preview);
  ctx.restore();
}

export function renderSelectionOverlay(ctx: CanvasRenderingContext2D, drawable: Drawable) {
  const safeDrawable = sanitizeDrawable(drawable);
  if (!safeDrawable) {
    return;
  }

  ctx.save();
  const locked = safeDrawable.locked === true;
  ctx.strokeStyle = locked ? "#f59e0b" : "#60a5fa";
  ctx.fillStyle = locked ? "#f59e0b" : "#3b82f6";
  ctx.lineWidth = 1.5;
  ctx.setLineDash(locked ? [4, 4] : [8, 6]);
  ctx.globalAlpha = 0.95;

  const bounds = getDrawableBounds(safeDrawable);
  if (bounds) {
    ctx.strokeRect(bounds.x - 6, bounds.y - 6, bounds.width + 12, bounds.height + 12);
  }

  if (locked && bounds) {
    drawTextTag(ctx, "Locked", { x: bounds.x + bounds.width / 2, y: bounds.y - 2 }, safeDrawable.style);
  }

  if (!locked) {
    ctx.setLineDash([]);
    for (const anchor of getAnchorHandles(safeDrawable)) {
      ctx.beginPath();
      ctx.arc(anchor.point.x, anchor.point.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1.5;
    }
  }

  ctx.restore();
}
