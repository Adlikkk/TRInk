import type {
  BinaryMarker,
  ChannelPattern,
  Drawable,
  DrawingStyle,
  Point,
  PreviewShape,
  TrendPattern
} from "../types/drawables";
import { sanitizeDrawable } from "./drawable-validation";
import { normalizeRect } from "./geometry";

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
        marker.customExpiryText ?? marker.expiry ?? "M5",
        { x: anchor.x, y: Math.max(50, (second?.y ?? 84)) },
        marker.style
      );
      break;
    }
  }
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
      ctx.font = `600 ${safeDrawable.fontSize}px Segoe UI`;
      ctx.fillText(safeDrawable.text, safeDrawable.point.x, safeDrawable.point.y);
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
    case "binary_marker":
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

  renderDrawable(ctx, preview);
  ctx.restore();
}
