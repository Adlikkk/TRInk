import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Dispatch } from "react";
import type {
  BinaryMarker,
  ChannelPattern,
  Drawable,
  DrawingStyle,
  Point,
  PreviewShape,
  ToolKind,
  TrendPattern
} from "../types/drawables";
import type { AppSettings } from "../types/settings";
import type { DrawingAction, DrawingState } from "../state/drawing-state";
import { createId } from "../lib/id";
import { clampPoint, constrainAngle } from "../lib/geometry";
import { isPointNearDrawable } from "../lib/hit-test";
import { renderDrawable, renderPreview } from "../lib/rendering";

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
      tool: "arrow" | "rectangle" | "support_resistance_zone";
      start: Point;
    }
  | {
      kind: "eraser";
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

export function CanvasSurface({ state, dispatch, settings }: CanvasSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<PointerSession | null>(null);
  const [textDraft, setTextDraft] = useState<{ point: Point; value: string } | null>(null);

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

    if (!state.hidden) {
      state.drawables.forEach((drawable) => renderDrawable(ctx, drawable));
      renderPreview(ctx, state.preview);
    }
  }, [state.drawables, state.preview, state.hidden]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const session = sessionRef.current;
      if (session?.kind === "trend") {
        if (event.key === "Escape") {
          sessionRef.current = null;
          dispatch({ type: "set-preview", preview: null });
        } else if (event.key === "Backspace") {
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
        }
      }

      if (session?.kind === "channel" && event.key === "Escape") {
        sessionRef.current = null;
        dispatch({ type: "set-preview", preview: null });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, settings]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
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

  const commitDrawable = (drawable: Drawable) => {
    dispatch({ type: "commit", drawable });
  };

  const previewShape = (preview: PreviewShape | null) => {
    dispatch({ type: "set-preview", preview });
  };

  const eraseAtPoint = (point: Point) => {
    const filtered = state.drawables.filter((drawable) => !isPointNearDrawable(point, drawable, 14));
    if (filtered.length !== state.drawables.length) {
      dispatch({ type: "replace-drawables", drawables: filtered });
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (state.overlayMode === "click-through" || state.hidden) {
      return;
    }

    if (event.button === 2 && sessionRef.current?.kind === "trend") {
      event.preventDefault();
      const trend = sessionRef.current;
      if (trend.points.length >= 2) {
        commitDrawable({
          id: createId("trend"),
          type: "trend",
          direction: inferTrendDirection(trend.points),
          points: trend.points,
          showLabels: true,
          showArrows: true,
          style: buildStyle(settings),
          createdAt: Date.now()
        });
      }
      sessionRef.current = null;
      previewShape(null);
      return;
    }

    const point = getPoint(event);
    const style = buildStyle(settings);

    switch (state.activeTool) {
      case "pen":
      case "highlighter":
        sessionRef.current = {
          kind: "freehand",
          points: [point],
          tool: state.activeTool
        };
        previewShape({
          id: "preview",
          type: "freehand",
          tool: state.activeTool,
          points: [point],
          style:
            state.activeTool === "highlighter"
              ? buildStyle(settings, { strokeWidth: settings.strokeWidth * 2.4, opacity: 0.28 })
              : style,
          createdAt: Date.now()
        });
        break;
      case "arrow":
      case "rectangle":
      case "support_resistance_zone":
        sessionRef.current = { kind: "shape", tool: state.activeTool, start: point };
        break;
      case "eraser":
        sessionRef.current = { kind: "eraser" };
        eraseAtPoint(point);
        break;
      case "text":
        sessionRef.current = { kind: "text", point };
        setTextDraft({ point, value: "" });
        break;
      case "call_marker":
      case "put_marker": {
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
      case "expiry_line":
        sessionRef.current = { kind: "shape", tool: "arrow", start: point };
        previewShape({
          id: "preview-expiry",
          type: "binary_marker",
          markerType: "expiry_line",
          points: [point, { x: point.x, y: 80 }],
          expiry: "M5",
          style: buildStyle(settings, { dashed: true }),
          createdAt: Date.now()
        });
        sessionRef.current = {
          kind: "shape",
          tool: "arrow",
          start: point
        };
        break;
      case "trend": {
        const trend = sessionRef.current?.kind === "trend" ? sessionRef.current : { kind: "trend" as const, points: [] };
        trend.points = [...trend.points, point];
        sessionRef.current = trend;
        previewShape({
          type: "trend_preview",
          points: [...trend.points],
          style
        });
        break;
      }
      case "channel": {
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
        sessionRef.current = null;
        previewShape(null);
        break;
      }
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }

    const point = getPoint(event);
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
      case "freehand": {
        session.points.push(point);
        previewShape({
          id: "preview",
          type: "freehand",
          tool: session.tool,
          points: [...session.points],
          style:
            session.tool === "highlighter"
              ? buildStyle(settings, { strokeWidth: settings.strokeWidth * 2.4, opacity: 0.28 })
              : baseStyle,
          createdAt: Date.now()
        });
        break;
      }
      case "shape":
        if (state.activeTool === "rectangle") {
          previewShape({
            id: "preview-rect",
            type: "rectangle",
            start: session.start,
            end: maybeConstrained,
            style: baseStyle,
            createdAt: Date.now()
          });
        } else if (state.activeTool === "support_resistance_zone") {
          previewShape({
            id: "preview-zone",
            type: "support_resistance_zone",
            start: session.start,
            end: maybeConstrained,
            label: "S/R Zone",
            style: buildStyle(settings, { opacity: Math.min(settings.opacity, 0.8) }),
            createdAt: Date.now()
          });
        } else if (state.activeTool === "expiry_line") {
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
        eraseAtPoint(point);
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

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }

    const point = getPoint(event);
    const style = buildStyle(settings);

    switch (session.kind) {
      case "freehand":
        commitDrawable({
          id: createId(session.tool),
          type: "freehand",
          tool: session.tool,
          points: [...session.points, point],
          style:
            session.tool === "highlighter"
              ? buildStyle(settings, { strokeWidth: settings.strokeWidth * 2.4, opacity: 0.28 })
              : style,
          createdAt: Date.now()
        });
        sessionRef.current = null;
        break;
      case "shape": {
        if (state.activeTool === "arrow") {
          commitDrawable({
            id: createId("arrow"),
            type: "arrow",
            start: session.start,
            end: point,
            style,
            createdAt: Date.now()
          });
        } else if (state.activeTool === "rectangle") {
          commitDrawable({
            id: createId("rect"),
            type: "rectangle",
            start: session.start,
            end: point,
            style,
            createdAt: Date.now()
          });
        } else if (state.activeTool === "support_resistance_zone") {
          commitDrawable({
            id: createId("zone"),
            type: "support_resistance_zone",
            start: session.start,
            end: point,
            label: "S/R Zone",
            style: buildStyle(settings, { opacity: Math.min(settings.opacity, 0.8) }),
            createdAt: Date.now()
          });
        } else if (state.activeTool === "expiry_line") {
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
        sessionRef.current = null;
        previewShape(null);
        break;
      }
      case "eraser":
        sessionRef.current = null;
        previewShape(null);
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

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(event) => event.preventDefault()}
      />
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
