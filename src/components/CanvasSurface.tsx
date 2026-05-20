import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Dispatch, PointerEvent as ReactPointerEvent } from "react";
import type {
  BinaryMarker,
  ChannelPattern,
  Drawable,
  DrawingStyle,
  Point,
  PreviewShape,
  TrendPattern
} from "../types/drawables";
import type { AppSettings } from "../types/settings";
import type { DrawingAction, DrawingState } from "../state/drawing-state";
import { createId } from "../lib/id";
import { clampPoint, constrainAngle, normalizeRect } from "../lib/geometry";
import { isPointNearDrawable } from "../lib/hit-test";
import { renderDrawable, renderPreview } from "../lib/rendering";
import { findTopmostDrawableAtPoint, sanitizeDrawable, sanitizeDrawables } from "../lib/drawable-validation";

type CanvasSurfaceProps = {
  state: DrawingState;
  dispatch: Dispatch<DrawingAction>;
  settings: AppSettings;
};

type PointerSession =
  | {
      kind: "freehand";
      points: Point[];
      tool: "pen" | "highlighter";
    }
  | {
      kind: "shape";
      tool: "arrow" | "rectangle" | "support_resistance_zone" | "expiry_line";
      start: Point;
    }
  | {
      kind: "eraser";
      baseline: Drawable[];
      working: Drawable[];
    }
  | {
      kind: "trend";
      points: Point[];
    }
  | {
      kind: "channel";
      step: 1 | 2;
      baseStart: Point;
      baseEnd?: Point;
    }
  | {
      kind: "text";
      point: Point;
    };

function buildStyle(settings: AppSettings, overrides?: Partial<DrawingStyle>): DrawingStyle {
  return {
    strokeColor: settings.defaultColor,
    fillColor: settings.defaultColor,
    strokeWidth: settings.strokeWidth,
    opacity: settings.opacity,
    ...overrides
  };
}

function inferTrendDirection(points: Point[]): TrendPattern["direction"] {
  if (points.length < 2) {
    return "neutral";
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (last.y < first.y) {
    return "bullish";
  }
  if (last.y > first.y) {
    return "bearish";
  }

  return "neutral";
}

function getPreviewStyle(tool: "pen" | "highlighter", settings: AppSettings) {
  return tool === "highlighter"
    ? buildStyle(settings, { strokeWidth: settings.strokeWidth * 2.4, opacity: 0.28 })
    : buildStyle(settings);
}

export function CanvasSurface({ state, dispatch, settings }: CanvasSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<PointerSession | null>(null);
  const [textDraft, setTextDraft] = useState<{ point: Point; value: string } | null>(null);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const [liveDrawables, setLiveDrawables] = useState<Drawable[] | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) {
      return;
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = wrapper.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.hidden) {
      return;
    }

    const sourceDrawables = liveDrawables ?? state.drawables;
    sourceDrawables.forEach((drawable) => renderDrawable(ctx, drawable));
    renderPreview(ctx, state.preview);

    if (!state.selectedDrawableId) {
      return;
    }

    const selected = sourceDrawables.find((drawable) => drawable.id === state.selectedDrawableId);
    const safeDrawable = selected ? sanitizeDrawable(selected) : null;
    if (!safeDrawable) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = "#93c5fd";
    ctx.globalAlpha = 0.9;
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1.5;

    switch (safeDrawable.type) {
      case "arrow":
        ctx.beginPath();
        ctx.moveTo(safeDrawable.start.x, safeDrawable.start.y);
        ctx.lineTo(safeDrawable.end.x, safeDrawable.end.y);
        ctx.stroke();
        break;
      case "rectangle":
      case "support_resistance_zone": {
        const rect = normalizeRect(safeDrawable.start, safeDrawable.end);
        ctx.strokeRect(rect.x - 4, rect.y - 4, rect.width + 8, rect.height + 8);
        break;
      }
      case "freehand":
      case "trend":
        safeDrawable.points.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.stroke();
        });
        break;
      case "channel":
        [safeDrawable.baseStart, safeDrawable.baseEnd, safeDrawable.parallelPoint].forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
          ctx.stroke();
        });
        break;
      case "binary_marker":
        safeDrawable.points.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
          ctx.stroke();
        });
        break;
      case "text":
        ctx.strokeRect(
          safeDrawable.point.x - 8,
          safeDrawable.point.y - safeDrawable.fontSize,
          Math.max(60, safeDrawable.text.length * 10),
          safeDrawable.fontSize + 12
        );
        break;
    }

    ctx.restore();
  }, [liveDrawables, state.drawables, state.hidden, state.preview, state.selectedDrawableId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const session = sessionRef.current;

      if (event.key === "Escape") {
        sessionRef.current = null;
        setLiveDrawables(null);
        setTextDraft(null);
        dispatch({ type: "set-preview", preview: null });
        return;
      }

      if (event.key === "Delete" && state.selectedDrawableId) {
        event.preventDefault();
        dispatch({ type: "delete-selected" });
        return;
      }

      if (event.key !== "Backspace") {
        return;
      }

      if (session?.kind === "trend") {
        event.preventDefault();
        session.points.pop();
        if (session.points.length === 0) {
          sessionRef.current = null;
          dispatch({ type: "set-preview", preview: null });
        } else {
          dispatch({
            type: "set-preview",
            preview: { type: "trend_preview", points: [...session.points], style: buildStyle(settings) }
          });
        }
      } else if (session?.kind === "channel") {
        event.preventDefault();
        if (session.step === 2) {
          sessionRef.current = { kind: "channel", step: 1, baseStart: session.baseStart };
          dispatch({ type: "set-preview", preview: null });
        } else {
          sessionRef.current = null;
          dispatch({ type: "set-preview", preview: null });
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, settings, state.selectedDrawableId]);

  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return clampPoint(
      {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      },
      rect.width,
      rect.height
    );
  };

  const previewShape = (preview: PreviewShape | null) => {
    dispatch({ type: "set-preview", preview });
  };

  const commitDrawable = (drawable: Drawable) => {
    const safeDrawable = sanitizeDrawable(drawable);
    if (safeDrawable) {
      dispatch({ type: "commit", drawable: safeDrawable });
    }
  };

  const eraseAtPoint = (drawables: Drawable[], point: Point) => {
    return sanitizeDrawables(drawables.filter((drawable) => !isPointNearDrawable(point, drawable, 14)));
  };

  const cancelSession = () => {
    sessionRef.current = null;
    setLiveDrawables(null);
    previewShape(null);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (state.overlayMode === "click-through" || state.hidden) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    if (event.button === 2 && sessionRef.current?.kind === "trend") {
      event.preventDefault();
      const trend = sessionRef.current;
      if (trend.points.length >= 2) {
        commitDrawable({
          id: createId("trend"),
          type: "trend",
          direction: inferTrendDirection(trend.points),
          points: [...trend.points],
          showLabels: true,
          showArrows: true,
          style: buildStyle(settings),
          createdAt: Date.now()
        });
      }
      cancelSession();
      return;
    }

    const point = getPoint(event);
    setCursorPoint(point);

    if (event.button === 2 && sessionRef.current?.kind === "channel") {
      event.preventDefault();
      const channel = sessionRef.current;
      if (channel.step === 2 && channel.baseEnd) {
        commitDrawable({
          id: createId("channel"),
          type: "channel",
          mode: "range",
          baseStart: channel.baseStart,
          baseEnd: channel.baseEnd,
          parallelPoint: point,
          showMidline: true,
          extendRight: true,
          style: buildStyle(settings),
          createdAt: Date.now()
        });
      }
      cancelSession();
      return;
    }

    if (event.ctrlKey) {
      const selected = findTopmostDrawableAtPoint(state.drawables, (drawable) =>
        isPointNearDrawable(point, drawable, 10)
      );
      dispatch({ type: "select-drawable", id: selected?.id ?? null });
      return;
    }

    dispatch({ type: "select-drawable", id: null });
    const style = buildStyle(settings);

    switch (state.activeTool) {
      case "pen":
      case "highlighter":
        if (event.button !== 0) {
          return;
        }
        sessionRef.current = { kind: "freehand", points: [point], tool: state.activeTool };
        previewShape({
          id: "preview",
          type: "freehand",
          tool: state.activeTool,
          points: [point],
          style: getPreviewStyle(state.activeTool, settings),
          createdAt: Date.now()
        });
        break;
      case "arrow":
      case "rectangle":
      case "support_resistance_zone":
      case "expiry_line":
        if (event.button !== 0) {
          return;
        }
        sessionRef.current = { kind: "shape", tool: state.activeTool, start: point };
        break;
      case "eraser":
        if (event.button !== 0) {
          return;
        }
        sessionRef.current = {
          kind: "eraser",
          baseline: state.drawables,
          working: eraseAtPoint(state.drawables, point)
        };
        setLiveDrawables(eraseAtPoint(state.drawables, point));
        break;
      case "text":
        if (event.button !== 0 || textDraft) {
          return;
        }
        sessionRef.current = { kind: "text", point };
        setTextDraft({ point, value: "" });
        break;
      case "call_marker":
      case "put_marker": {
        if (event.button !== 0) {
          return;
        }
        const drawable: BinaryMarker = {
          id: createId("marker"),
          type: "binary_marker",
          markerType: state.activeTool,
          points: [point],
          label: state.activeTool === "call_marker" ? "CALL" : "PUT",
          expiry: "M5",
          style,
          createdAt: Date.now()
        };
        commitDrawable(drawable);
        break;
      }
      case "trend": {
        if (event.button !== 0) {
          return;
        }
        const trend =
          sessionRef.current?.kind === "trend"
            ? sessionRef.current
            : { kind: "trend" as const, points: [] as Point[] };
        trend.points = [...trend.points, point];
        sessionRef.current = trend;
        previewShape({ type: "trend_preview", points: [...trend.points], style });
        break;
      }
      case "channel": {
        if (event.button !== 0) {
          return;
        }
        const channel = sessionRef.current;
        if (!channel || channel.kind !== "channel") {
          sessionRef.current = { kind: "channel", step: 1, baseStart: point };
          previewShape(null);
          break;
        }

        if (channel.step === 1) {
          sessionRef.current = {
            kind: "channel",
            step: 2,
            baseStart: channel.baseStart,
            baseEnd: point
          };
          previewShape({
            type: "channel_preview",
            baseStart: channel.baseStart,
            baseEnd: point,
            parallelPoint: point,
            style
          });
          break;
        }

        const baseEnd = channel.baseEnd ?? point;
        const drawable: ChannelPattern = {
          id: createId("channel"),
          type: "channel",
          mode: "range",
          baseStart: channel.baseStart,
          baseEnd,
          parallelPoint: point,
          showMidline: true,
          extendRight: true,
          style,
          createdAt: Date.now()
        };
        commitDrawable(drawable);
        cancelSession();
        break;
      }
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const session = sessionRef.current;
    const point = getPoint(event);
    setCursorPoint(point);

    if (!session) {
      return;
    }

    const baseStyle = buildStyle(settings);
    const maybeConstrained =
      event.shiftKey &&
      (session.kind === "shape" || session.kind === "trend" || session.kind === "channel")
        ? constrainAngle(
            session.kind === "shape"
              ? session.start
              : session.kind === "trend"
                ? session.points[session.points.length - 1]
                : session.baseStart,
            point
          )
        : point;

    switch (session.kind) {
      case "freehand":
        session.points.push(point);
        previewShape({
          id: "preview",
          type: "freehand",
          tool: session.tool,
          points: [...session.points],
          style: getPreviewStyle(session.tool, settings),
          createdAt: Date.now()
        });
        break;
      case "shape":
        if (session.tool === "rectangle") {
          previewShape({
            id: "preview-rect",
            type: "rectangle",
            start: session.start,
            end: maybeConstrained,
            style: baseStyle,
            createdAt: Date.now()
          });
        } else if (session.tool === "support_resistance_zone") {
          previewShape({
            id: "preview-zone",
            type: "support_resistance_zone",
            start: session.start,
            end: maybeConstrained,
            label: "S/R Zone",
            style: buildStyle(settings, { opacity: Math.min(settings.opacity, 0.8) }),
            createdAt: Date.now()
          });
        } else if (session.tool === "expiry_line") {
          previewShape({
            id: "preview-expiry",
            type: "binary_marker",
            markerType: "expiry_line",
            points: [session.start, maybeConstrained],
            expiry: "M5",
            style: buildStyle(settings, { dashed: true }),
            createdAt: Date.now()
          });
        } else {
          previewShape({
            id: "preview-arrow",
            type: "arrow",
            start: session.start,
            end: maybeConstrained,
            style: baseStyle,
            createdAt: Date.now()
          });
        }
        break;
      case "eraser":
        session.working = eraseAtPoint(session.working, point);
        setLiveDrawables(session.working);
        break;
      case "trend":
        previewShape({
          type: "trend_preview",
          points: [...session.points, maybeConstrained],
          style: baseStyle
        });
        break;
      case "channel":
        if (session.step === 2 && session.baseEnd) {
          previewShape({
            type: "channel_preview",
            baseStart: session.baseStart,
            baseEnd: session.baseEnd,
            parallelPoint: maybeConstrained,
            style: baseStyle
          });
        }
        break;
      case "text":
        break;
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }

    const point = getPoint(event);
    setCursorPoint(point);
    const style = buildStyle(settings);

    switch (session.kind) {
      case "freehand":
        commitDrawable({
          id: createId(session.tool),
          type: "freehand",
          tool: session.tool,
          points: [...session.points],
          style: getPreviewStyle(session.tool, settings),
          createdAt: Date.now()
        });
        cancelSession();
        break;
      case "shape":
        if (session.tool === "arrow") {
          commitDrawable({
            id: createId("arrow"),
            type: "arrow",
            start: session.start,
            end: point,
            style,
            createdAt: Date.now()
          });
        } else if (session.tool === "rectangle") {
          commitDrawable({
            id: createId("rect"),
            type: "rectangle",
            start: session.start,
            end: point,
            style,
            createdAt: Date.now()
          });
        } else if (session.tool === "support_resistance_zone") {
          commitDrawable({
            id: createId("zone"),
            type: "support_resistance_zone",
            start: session.start,
            end: point,
            label: "S/R Zone",
            style: buildStyle(settings, { opacity: Math.min(settings.opacity, 0.8) }),
            createdAt: Date.now()
          });
        } else if (session.tool === "expiry_line") {
          commitDrawable({
            id: createId("expiry"),
            type: "binary_marker",
            markerType: "expiry_line",
            points: [session.start, point],
            expiry: "M5",
            style: buildStyle(settings, { dashed: true }),
            createdAt: Date.now()
          });
        }
        cancelSession();
        break;
      case "eraser":
        dispatch({ type: "replace-drawables", drawables: session.working });
        cancelSession();
        break;
      case "text":
      case "trend":
      case "channel":
        break;
    }
  };

  const commitText = () => {
    if (!textDraft || !textDraft.value.trim()) {
      setTextDraft(null);
      sessionRef.current = null;
      return;
    }

    commitDrawable({
      id: createId("text"),
      type: "text",
      point: textDraft.point,
      text: textDraft.value.trim(),
      fontSize: 18,
      style: buildStyle(settings),
      createdAt: Date.now()
    });
    setTextDraft(null);
    sessionRef.current = null;
  };

  const hintText =
    sessionRef.current?.kind === "trend"
      ? "Trend: left click adds points, right click finishes, Esc cancels, Backspace removes last"
      : sessionRef.current?.kind === "channel"
        ? "Channel: click start, click end, move for width, click or right click to finish"
        : state.activeTool === "trend"
          ? "Trend tool ready"
          : state.activeTool === "channel"
            ? "Channel tool ready"
            : state.selectedDrawableId
              ? "Selection active: Delete removes the selected object"
              : "Ctrl+click selects an existing object";

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={cancelSession}
        onContextMenu={(event) => event.preventDefault()}
      />
      {cursorPoint ? (
        <div
          className="pointer-events-none absolute rounded-full border border-slate-700/90 bg-slate-950/92 px-3 py-1 text-[11px] text-slate-200 shadow-overlay"
          style={{
            left: Math.min(cursorPoint.x + 16, Math.max(24, window.innerWidth - 440)),
            top: Math.min(cursorPoint.y + 16, Math.max(24, window.innerHeight - 72))
          }}
        >
          {hintText}
        </div>
      ) : null}
      {textDraft ? (
        <input
          autoFocus
          value={textDraft.value}
          onChange={(event) => setTextDraft({ ...textDraft, value: event.target.value })}
          onBlur={commitText}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitText();
            } else if (event.key === "Escape") {
              setTextDraft(null);
              sessionRef.current = null;
            }
          }}
          className="absolute rounded border border-slate-700 bg-slate-950/95 px-3 py-2 text-sm text-slate-100 outline-none"
          style={{
            left: textDraft.point.x,
            top: textDraft.point.y,
            transform: "translate(-4px, -50%)"
          }}
        />
      ) : null}
    </div>
  );
}
