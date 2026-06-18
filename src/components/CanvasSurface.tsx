import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Dispatch, PointerEvent as ReactPointerEvent } from "react";
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
  DrawingStyle,
  Point,
  PreviewShape,
  QMPattern,
  RayPattern,
  StructureBreakPattern,
  TextShape,
  TrendPattern,
  VerticalMarkerShape,
  ToolKind
} from "../types/drawables";
import type { AppSettings } from "../types/settings";
import type { DrawingAction, DrawingState } from "../state/drawing-state";
import {
  DEFAULT_FIBONACCI_FAN_LEVELS,
  DEFAULT_FIBONACCI_RETRACEMENT_LEVELS
} from "../lib/chart-patterns";
import { createId } from "../lib/id";
import { clampPoint, constrainAngle, normalizeRect } from "../lib/geometry";
import { isPointNearDrawable } from "../lib/hit-test";
import { renderDrawable, renderPreview, renderSelectionOverlay } from "../lib/rendering";
import { getAnchorHandles, hitTestAnchorHandle, moveDrawable, updateDrawableAnchor } from "../lib/object-editing";
import { findTopmostDrawableAtPoint, sanitizeDrawable, sanitizeDrawables } from "../lib/drawable-validation";
import { isScreenPointInsideAnyUiWindowBounds, type UiWindowBounds } from "../lib/ui-window-bounds";
import {
  DEFAULT_TEXT_ALIGN,
  DEFAULT_TEXT_BACKGROUND_COLOR,
  DEFAULT_TEXT_BACKGROUND_OPACITY,
  DEFAULT_TEXT_BORDER_COLOR,
  DEFAULT_TEXT_BORDER_RADIUS,
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_TEXT_FONT_WEIGHT,
  DEFAULT_TEXT_PADDING
} from "../lib/text-drawable";

type DebugWindowInfo = {
  outerX: number; outerY: number; outerW: number; outerH: number;
  innerW: number; innerH: number;
};

type CanvasSurfaceProps = {
  state: DrawingState;
  dispatch: Dispatch<DrawingAction>;
  settings: AppSettings;
  onViewportChange?: (viewport: { width: number; height: number; pixelRatio: number }) => void;
  cancelActiveDrawingSignal?: number;
  debugWindowInfo?: DebugWindowInfo | null;
  onInteractionEnd?: (type: "cancel" | "commit", tool: ToolKind) => void;
  uiWindowBounds?: UiWindowBounds[];
  showPersistentCursorHints?: boolean;
};

type PointerSession =
  | {
      kind: "freehand";
      points: Point[];
      tool: "pen" | "highlighter";
    }
  | {
      kind: "shape";
      tool: "line" | "arrow" | "rectangle" | "support_resistance_zone" | "expiry_line";
      start: Point;
    }
  | {
      kind: "ray";
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
      kind: "qm";
      patternType: "qm_bullish" | "qm_bearish";
      points: Point[];
    }
  | {
      kind: "structure-break";
      patternType: "bos" | "choch";
      start: Point;
    }
  | {
      kind: "fvg";
      start: Point;
    }
  | {
      kind: "fibonacci";
      patternType: "fibonacci_retracement" | "fibonacci_fan";
      start: Point;
    }
  | {
      kind: "sweep";
      step: 1 | 2;
      levelStart: Point;
      levelEnd?: Point;
    }
  | {
      kind: "pitchfork";
      step: 1 | 2;
      pivotA: Point;
      pivotB?: Point;
    }
  | {
      kind: "text";
      point: Point;
    }
  | {
      kind: "selection-move";
      drawableId: string;
      start: Point;
      original: Drawable;
      working: Drawable;
    }
  | {
      kind: "selection-anchor";
      drawableId: string;
      anchorId: string;
      original: Drawable;
      working: Drawable;
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

function buildToolStyle(
  tool: DrawingState["activeTool"] | "qm_bullish" | "qm_bearish",
  settings: AppSettings,
  overrides?: Partial<DrawingStyle>
) {
  if (tool === "qm_bullish") {
    return buildStyle(settings, { strokeColor: "#22c55e", fillColor: "#22c55e", ...overrides });
  }

  if (tool === "qm_bearish") {
    return buildStyle(settings, { strokeColor: "#f43f5e", fillColor: "#f43f5e", ...overrides });
  }

  if (tool === "bos") {
    return buildStyle(settings, { strokeColor: "#38bdf8", fillColor: "#38bdf8", ...overrides });
  }

  if (tool === "choch") {
    return buildStyle(settings, { strokeColor: "#f59e0b", fillColor: "#f59e0b", dashed: true, ...overrides });
  }

  if (tool === "fvg") {
    return buildStyle(settings, { strokeColor: "#a855f7", fillColor: "#a855f7", opacity: Math.min(settings.opacity, 0.8), ...overrides });
  }

  if (tool === "liquidity_sweep") {
    return buildStyle(settings, { strokeColor: "#fb7185", fillColor: "#fb7185", dashed: true, ...overrides });
  }

  if (tool === "horizontal_line") {
    return buildStyle(settings, { strokeColor: "#38bdf8", fillColor: "#38bdf8", ...overrides });
  }

  if (tool === "vertical_marker") {
    return buildStyle(settings, { strokeColor: "#94a3b8", fillColor: "#94a3b8", dashed: true, ...overrides });
  }

  if (tool === "ray") {
    return buildStyle(settings, { strokeColor: "#22c55e", fillColor: "#22c55e", ...overrides });
  }

  if (tool === "fibonacci_retracement") {
    return buildStyle(settings, { strokeColor: "#f59e0b", fillColor: "#f59e0b", ...overrides });
  }

  if (tool === "fibonacci_fan") {
    return buildStyle(settings, { strokeColor: "#8b5cf6", fillColor: "#8b5cf6", ...overrides });
  }

  if (tool === "andrews_pitchfork") {
    return buildStyle(settings, { strokeColor: "#10b981", fillColor: "#10b981", ...overrides });
  }

  return buildStyle(settings, overrides);
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

function getQMHintLabel(patternType: "qm_bullish" | "qm_bearish", index: number) {
  const bullish = ["Left shoulder", "High", "Lower low", "Higher high / structure break", "Retest / entry area"];
  const bearish = ["Left shoulder", "Low", "Higher high", "Lower low / structure break", "Retest / entry area"];
  return (patternType === "qm_bullish" ? bullish : bearish)[index] ?? "Next point";
}

function commitQMDrawable(
  patternType: "qm_bullish" | "qm_bearish",
  points: Point[],
  settings: AppSettings
): QMPattern {
  return {
    id: createId(patternType),
    type: patternType,
    points,
    label: patternType === "qm_bullish" ? "Bullish QM" : "Bearish QM",
    showLabels: settings.showPatternLabels,
    showNeckline: true,
    showRetestZone: true,
    showDirectionArrow: true,
    style: buildToolStyle(patternType, settings),
    createdAt: Date.now()
  };
}

function inferBreakDirection(points: Point[]): StructureBreakPattern["direction"] {
  if (points.length < 2) {
    return "neutral";
  }
  return points[1].y < points[0].y ? "bullish" : points[1].y > points[0].y ? "bearish" : "neutral";
}

function commitStructureBreakDrawable(
  patternType: "bos" | "choch",
  start: Point,
  end: Point,
  settings: AppSettings
): StructureBreakPattern {
  return {
    id: createId(patternType),
    type: patternType,
    points: [start, end],
    label: patternType === "bos" ? "BOS" : "CHoCH",
    direction: inferBreakDirection([start, end]),
    showArrow: true,
    style: buildToolStyle(patternType, settings),
    createdAt: Date.now()
  };
}

function commitFVGDrawable(start: Point, end: Point, settings: AppSettings): FVGPattern {
  return {
    id: createId("fvg"),
    type: "fvg",
    points: [start, end],
    label: "FVG",
    extendRight: false,
    style: buildToolStyle("fvg", settings),
    createdAt: Date.now()
  };
}

function commitHorizontalLineDrawable(point: Point, settings: AppSettings): HorizontalLineShape {
  return {
    id: createId("horizontal-line"),
    type: "horizontal_line",
    y: point.y,
    label: "Horizontal Line",
    style: buildToolStyle("horizontal_line", settings),
    createdAt: Date.now()
  };
}

function commitVerticalMarkerDrawable(point: Point, settings: AppSettings): VerticalMarkerShape {
  return {
    id: createId("vertical-marker"),
    type: "vertical_marker",
    x: point.x,
    label: "Vertical Marker",
    style: buildToolStyle("vertical_marker", settings),
    createdAt: Date.now()
  };
}

function commitRayDrawable(start: Point, end: Point, settings: AppSettings): RayPattern {
  return {
    id: createId("ray"),
    type: "ray",
    points: [start, end],
    label: "Ray",
    style: buildToolStyle("ray", settings),
    createdAt: Date.now()
  };
}

function commitFibonacciRetracementDrawable(start: Point, end: Point, settings: AppSettings): FibonacciRetracementPattern {
  return {
    id: createId("fib-retracement"),
    type: "fibonacci_retracement",
    points: [start, end],
    levels: [...DEFAULT_FIBONACCI_RETRACEMENT_LEVELS],
    showLabels: settings.showPatternLabels,
    showPercentages: false,
    extendLeft: false,
    extendRight: false,
    style: buildToolStyle("fibonacci_retracement", settings),
    createdAt: Date.now()
  };
}

function commitFibonacciFanDrawable(start: Point, end: Point, settings: AppSettings): FibonacciFanPattern {
  return {
    id: createId("fib-fan"),
    type: "fibonacci_fan",
    points: [start, end],
    levels: [...DEFAULT_FIBONACCI_FAN_LEVELS],
    showLabels: settings.showPatternLabels,
    showPercentages: false,
    style: buildToolStyle("fibonacci_fan", settings),
    createdAt: Date.now()
  };
}

function commitAndrewsPitchforkDrawable(a: Point, b: Point, c: Point, settings: AppSettings): AndrewsPitchforkPattern {
  return {
    id: createId("pitchfork"),
    type: "andrews_pitchfork",
    points: [a, b, c],
    showLabels: settings.showPatternLabels,
    variant: "standard",
    showMedianLine: true,
    showOuterLines: true,
    showAnchorLine: false,
    style: buildToolStyle("andrews_pitchfork", settings),
    createdAt: Date.now()
  };
}

function commitLiquiditySweepDrawable(levelStart: Point, levelEnd: Point, sweepPoint: Point, settings: AppSettings): LiquiditySweepPattern {
  return {
    id: createId("sweep"),
    type: "liquidity_sweep",
    points: [levelStart, levelEnd, sweepPoint],
    label: "Sweep",
    showSweepMarker: true,
    style: buildToolStyle("liquidity_sweep", settings),
    createdAt: Date.now()
  };
}

function buildTextDrawable(point: Point, text: string, settings: AppSettings, existing?: TextShape): TextShape {
  return {
    id: existing?.id ?? createId("text"),
    type: "text",
    point: existing?.point ?? point,
    text,
    fontSize: existing?.fontSize ?? DEFAULT_TEXT_FONT_SIZE,
    fontWeight: existing?.fontWeight ?? DEFAULT_TEXT_FONT_WEIGHT,
    align: existing?.align ?? DEFAULT_TEXT_ALIGN,
    backgroundEnabled: existing?.backgroundEnabled ?? false,
    backgroundColor: existing?.backgroundColor ?? DEFAULT_TEXT_BACKGROUND_COLOR,
    backgroundOpacity: existing?.backgroundOpacity ?? DEFAULT_TEXT_BACKGROUND_OPACITY,
    padding: existing?.padding ?? DEFAULT_TEXT_PADDING,
    borderEnabled: existing?.borderEnabled ?? false,
    borderColor: existing?.borderColor ?? DEFAULT_TEXT_BORDER_COLOR,
    borderRadius: existing?.borderRadius ?? DEFAULT_TEXT_BORDER_RADIUS,
    style: existing?.style ?? buildStyle(settings),
    locked: existing?.locked,
    createdAt: existing?.createdAt ?? Date.now()
  };
}

function resetToSelect(dispatch: Dispatch<DrawingAction>) {
  dispatch({ type: "set-tool", tool: "select" });
  dispatch({ type: "set-tool-mode", mode: "basic" });
}

export function CanvasSurface({
  state,
  dispatch,
  settings,
  onViewportChange,
  cancelActiveDrawingSignal,
  debugWindowInfo,
  uiWindowBounds = [],
  showPersistentCursorHints = false,
  onInteractionEnd
}: CanvasSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<PointerSession | null>(null);
  const [textDraft, setTextDraft] = useState<{
    point: Point;
    value: string;
    drawableId?: string;
    createdAt?: number;
    locked?: boolean;
  } | null>(null);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const [screenPoint, setScreenPoint] = useState<Point | null>(null);
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
      onViewportChange?.({ width, height, pixelRatio: dpr });
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(() => resize());
    resize();
    observer.observe(wrapper);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [onViewportChange]);

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
    renderSelectionOverlay(ctx, safeDrawable);
  }, [liveDrawables, state.drawables, state.hidden, state.preview, state.selectedDrawableId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const session = sessionRef.current;

      if (event.key === "Escape") {
        if (session?.kind === "selection-move" || session?.kind === "selection-anchor") {
          sessionRef.current = null;
          setLiveDrawables(null);
          onInteractionEnd?.("cancel", "select");
          return;
        }

        if (state.selectedDrawableId) {
          dispatch({ type: "select-drawable", id: null });
        }
        sessionRef.current = null;
        setLiveDrawables(null);
        setTextDraft(null);
        dispatch({ type: "set-preview", preview: null });
        onInteractionEnd?.("cancel", "select");
        return;
      }

      if (event.key === "Delete" && state.selectedDrawableId) {
        event.preventDefault();
        dispatch({ type: "delete-selected" });
        return;
      }

      if (event.key !== "Backspace") {
        if (event.key.toLowerCase() === "v" && !textDraft) {
          dispatch({ type: "set-tool", tool: "select" });
          dispatch({ type: "set-tool-mode", mode: "basic" });
        }
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
      } else if (session?.kind === "qm") {
        event.preventDefault();
        session.points.pop();
        if (session.points.length === 0) {
          sessionRef.current = null;
          dispatch({ type: "set-preview", preview: null });
        } else {
          dispatch({
            type: "set-preview",
            preview: {
              type: "qm_preview",
              patternType: session.patternType,
              points: [...session.points],
              style: buildToolStyle(session.patternType, settings)
            }
          });
        }
      } else if (session?.kind === "structure-break") {
        event.preventDefault();
        sessionRef.current = null;
        dispatch({ type: "set-preview", preview: null });
      } else if (session?.kind === "fvg") {
        event.preventDefault();
        sessionRef.current = null;
        dispatch({ type: "set-preview", preview: null });
      } else if (session?.kind === "ray") {
        event.preventDefault();
        sessionRef.current = null;
        dispatch({ type: "set-preview", preview: null });
      } else if (session?.kind === "fibonacci") {
        event.preventDefault();
        sessionRef.current = null;
        dispatch({ type: "set-preview", preview: null });
      } else if (session?.kind === "sweep") {
        event.preventDefault();
        if (session.step === 2) {
          sessionRef.current = { kind: "sweep", step: 1, levelStart: session.levelStart };
        } else {
          sessionRef.current = null;
        }
        dispatch({ type: "set-preview", preview: null });
      } else if (session?.kind === "pitchfork") {
        event.preventDefault();
        if (session.step === 2 && session.pivotB) {
          sessionRef.current = { kind: "pitchfork", step: 1, pivotA: session.pivotA };
        } else {
          sessionRef.current = null;
        }
        dispatch({ type: "set-preview", preview: null });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, onInteractionEnd, settings, state.selectedDrawableId, textDraft]);

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

  const STAY_ON_TOOL = new Set(["pen", "highlighter", "select", "eraser", "text"]);

  const commitDrawable = (drawable: Drawable) => {
    const safeDrawable = sanitizeDrawable(drawable);
    if (safeDrawable) {
      dispatch({ type: "commit", drawable: safeDrawable });
      onInteractionEnd?.("commit", state.activeTool);
      if (settings.returnToSelectAfterDraw && !STAY_ON_TOOL.has(state.activeTool)) {
        dispatch({ type: "set-tool", tool: "select" });
      }
    }
  };

  const eraseAtPoint = (drawables: Drawable[], point: Point) => {
    return sanitizeDrawables(drawables.filter((drawable) => !isPointNearDrawable(point, drawable, 14)));
  };

  const cancelSession = useCallback(() => {
    const currentTool = sessionRef.current?.kind === "shape" ? sessionRef.current.tool : "select";
    sessionRef.current = null;
    setLiveDrawables(null);
    dispatch({ type: "set-preview", preview: null });
    onInteractionEnd?.("cancel", currentTool as ToolKind);
  }, [dispatch, onInteractionEnd]);

  // Cancel any in-progress partial drawing when the user switches tools (e.g. via the toolbar).
  // Without this, switching from Trend while 2 points are placed leaves a dangling session.
  const prevToolRef = useRef(state.activeTool);
  useEffect(() => {
    const prev = prevToolRef.current;
    prevToolRef.current = state.activeTool;
    if (prev !== state.activeTool && sessionRef.current) {
      sessionRef.current = null;
      setLiveDrawables(null);
      dispatch({ type: "set-preview", preview: null });
    }
  }, [state.activeTool, dispatch]);

  // Cancel active drawing when an external cancel-active-drawing command is received.
  useEffect(() => {
    if (cancelActiveDrawingSignal !== undefined && cancelActiveDrawingSignal > 0) {
      cancelSession();
    }
  }, [cancelActiveDrawingSignal, cancelSession]);

  // Esc key cancels any in-progress partial drawing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sessionRef.current) {
        cancelSession();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelSession]);

  const startTextDraft = (point: Point, drawable?: TextShape) => {
    setTextDraft({
      point: drawable?.point ?? point,
      value: drawable?.text ?? "",
      drawableId: drawable?.id
    });
  };

  const updateLiveSelectedDrawable = (nextDrawable: Drawable) => {
    setLiveDrawables(
      state.drawables.map((drawable) => (drawable.id === nextDrawable.id ? nextDrawable : drawable))
    );
  };

  const isPointerInsideUiWindow = (event: ReactPointerEvent<HTMLCanvasElement>) =>
    isScreenPointInsideAnyUiWindowBounds(event.screenX, event.screenY, uiWindowBounds);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (state.overlayMode === "click-through" || state.hidden) {
      return;
    }

    if (isPointerInsideUiWindow(event)) {
      if (import.meta.env.DEV) {
        console.log(`[TRInk Basic Input] pointer inside toolbar bounds=true`);
      }
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
          showLabels: settings.showPatternLabels,
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
    setScreenPoint({ x: event.screenX, y: event.screenY });

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

    if (event.button === 2 && sessionRef.current?.kind === "qm") {
      event.preventDefault();
      const qm = sessionRef.current;
      if (qm.points.length >= 4) {
        commitDrawable(commitQMDrawable(qm.patternType, [...qm.points, point].slice(0, 5), settings));
      }
      cancelSession();
      return;
    }

    if (event.button === 2 && sessionRef.current?.kind === "sweep") {
      event.preventDefault();
      const sweep = sessionRef.current;
      if (sweep.step === 2 && sweep.levelEnd) {
        commitDrawable(commitLiquiditySweepDrawable(sweep.levelStart, sweep.levelEnd, point, settings));
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

    if (state.activeTool === "select") {
      const selectedDrawable = state.selectedDrawableId
        ? state.drawables.find((drawable) => drawable.id === state.selectedDrawableId) ?? null
        : null;

      if (event.button === 0 && selectedDrawable && !selectedDrawable.locked) {
        const anchor = hitTestAnchorHandle(point, selectedDrawable, 10);
        if (anchor) {
          const working = updateDrawableAnchor(selectedDrawable, anchor.id, point);
          sessionRef.current = {
            kind: "selection-anchor",
            drawableId: selectedDrawable.id,
            anchorId: anchor.id,
            original: selectedDrawable,
            working
          };
          updateLiveSelectedDrawable(working);
          return;
        }
      }

      const hit = findTopmostDrawableAtPoint(state.drawables, (drawable) =>
        isPointNearDrawable(point, drawable, 10)
      );

      if (!hit) {
        dispatch({ type: "select-drawable", id: null });
        return;
      }

        dispatch({ type: "select-drawable", id: hit.id });
        if (event.button === 0 && !hit.locked) {
          sessionRef.current = {
            kind: "selection-move",
            drawableId: hit.id,
          start: point,
          original: hit,
          working: hit
        };
      }
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
      case "line":
      case "arrow":
      case "rectangle":
      case "support_resistance_zone":
      case "expiry_line":
        if (event.button !== 0) {
          return;
        }
        sessionRef.current = { kind: "shape", tool: state.activeTool, start: point };
        break;
      case "bos":
      case "choch":
        if (event.button !== 0) {
          return;
        }
        if (
          sessionRef.current?.kind === "structure-break" &&
          sessionRef.current.patternType === state.activeTool
        ) {
          commitDrawable(
            commitStructureBreakDrawable(state.activeTool, sessionRef.current.start, point, settings)
          );
          cancelSession();
          break;
        }

        sessionRef.current = { kind: "structure-break", patternType: state.activeTool, start: point };
        previewShape(null);
        break;
      case "fvg":
        if (event.button !== 0) {
          return;
        }
        if (sessionRef.current?.kind === "fvg") {
          commitDrawable(commitFVGDrawable(sessionRef.current.start, point, settings));
          cancelSession();
          break;
        }

        sessionRef.current = { kind: "fvg", start: point };
        previewShape({
          id: "preview-fvg",
          type: "fvg",
          points: [point, point],
          label: "FVG",
          extendRight: false,
          style: buildToolStyle("fvg", settings),
          createdAt: Date.now()
        });
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
        event.preventDefault();
        sessionRef.current = { kind: "text", point };
        startTextDraft(point);
        break;
      case "horizontal_line":
        if (event.button !== 0) {
          return;
        }
        commitDrawable(commitHorizontalLineDrawable(point, settings));
        break;
      case "vertical_marker":
        if (event.button !== 0) {
          return;
        }
        commitDrawable(commitVerticalMarkerDrawable(point, settings));
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
      case "qm_bullish":
      case "qm_bearish": {
        if (event.button !== 0) {
          return;
        }
        const qm =
          sessionRef.current?.kind === "qm" && sessionRef.current.patternType === state.activeTool
            ? sessionRef.current
            : { kind: "qm" as const, patternType: state.activeTool, points: [] as Point[] };

        qm.points = [...qm.points, point];
        sessionRef.current = qm;

        if (qm.points.length >= 5) {
          commitDrawable(commitQMDrawable(state.activeTool, qm.points.slice(0, 5), settings));
          cancelSession();
          break;
        }

        previewShape({
          type: "qm_preview",
          patternType: state.activeTool,
          points: [...qm.points],
          style: buildToolStyle(state.activeTool, settings)
        });
        break;
      }
      case "liquidity_sweep": {
        if (event.button !== 0) {
          return;
        }
        const sweep = sessionRef.current;
        if (!sweep || sweep.kind !== "sweep") {
          sessionRef.current = { kind: "sweep", step: 1, levelStart: point };
          previewShape(null);
          break;
        }

        if (sweep.step === 1) {
          sessionRef.current = { kind: "sweep", step: 2, levelStart: sweep.levelStart, levelEnd: point };
          previewShape({
            id: "preview-sweep",
            type: "liquidity_sweep",
            points: [sweep.levelStart, point, point],
            label: "Sweep",
            showSweepMarker: true,
            style: buildToolStyle("liquidity_sweep", settings),
            createdAt: Date.now()
          });
          break;
        }

        commitDrawable(commitLiquiditySweepDrawable(sweep.levelStart, sweep.levelEnd ?? point, point, settings));
        cancelSession();
        break;
      }
      case "ray":
        if (event.button !== 0) {
          return;
        }
        if (sessionRef.current?.kind === "ray") {
          commitDrawable(commitRayDrawable(sessionRef.current.start, point, settings));
          cancelSession();
          break;
        }
        sessionRef.current = { kind: "ray", start: point };
        previewShape(null);
        break;
      case "fibonacci_retracement":
      case "fibonacci_fan":
        if (event.button !== 0) {
          return;
        }
        if (
          sessionRef.current?.kind === "fibonacci" &&
          sessionRef.current.patternType === state.activeTool
        ) {
          commitDrawable(
            state.activeTool === "fibonacci_retracement"
              ? commitFibonacciRetracementDrawable(sessionRef.current.start, point, settings)
              : commitFibonacciFanDrawable(sessionRef.current.start, point, settings)
          );
          cancelSession();
          break;
        }
        sessionRef.current = { kind: "fibonacci", patternType: state.activeTool, start: point };
        previewShape(null);
        break;
      case "andrews_pitchfork":
        if (event.button !== 0) {
          return;
        }
        if (!sessionRef.current || sessionRef.current.kind !== "pitchfork") {
          sessionRef.current = { kind: "pitchfork", step: 1, pivotA: point };
          previewShape(null);
          break;
        }
        if (sessionRef.current.step === 1) {
          sessionRef.current = {
            kind: "pitchfork",
            step: 2,
            pivotA: sessionRef.current.pivotA,
            pivotB: point
          };
          previewShape({
            id: "preview-pitchfork",
            type: "andrews_pitchfork",
            points: [sessionRef.current.pivotA, point, point],
            showLabels: settings.showPatternLabels,
            style: buildToolStyle("andrews_pitchfork", settings),
            createdAt: Date.now()
          });
          break;
        }
        commitDrawable(
          commitAndrewsPitchforkDrawable(
            sessionRef.current.pivotA,
            sessionRef.current.pivotB ?? point,
            point,
            settings
          )
        );
        cancelSession();
        break;
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
    if (isPointerInsideUiWindow(event)) {
      return;
    }

    const session = sessionRef.current;
    const point = getPoint(event);
    setCursorPoint(point);
    setScreenPoint({ x: event.screenX, y: event.screenY });

    if (!session) {
      return;
    }

    const baseStyle = buildStyle(settings);
    const maybeConstrained =
      event.shiftKey &&
      (session.kind === "shape" ||
        session.kind === "ray" ||
        session.kind === "trend" ||
        session.kind === "channel" ||
        session.kind === "structure-break" ||
        session.kind === "fvg" ||
        session.kind === "fibonacci" ||
        session.kind === "pitchfork" ||
        session.kind === "sweep")
      || session.kind === "qm"
        ? constrainAngle(
            session.kind === "shape"
                  ? session.start
                : session.kind === "ray"
                  ? session.start
                : session.kind === "trend"
                  ? session.points[session.points.length - 1]
                : session.kind === "channel"
                  ? session.baseStart
                    : session.kind === "structure-break"
                      ? session.start
                      : session.kind === "fvg"
                        ? session.start
                      : session.kind === "fibonacci"
                        ? session.start
                      : session.kind === "pitchfork"
                        ? session.pivotB ?? session.pivotA
                      : session.kind === "sweep"
                        ? session.levelEnd ?? session.levelStart
                        : session.points[session.points.length - 1],
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
        if (state.activeTool === "fvg" && session.tool === "rectangle") {
          previewShape({
            id: "preview-fvg",
            type: "fvg",
            points: [session.start, maybeConstrained],
            label: "FVG",
            extendRight: false,
            style: buildToolStyle("fvg", settings),
            createdAt: Date.now()
          });
        } else if (session.tool === "rectangle") {
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
        } else if (session.tool === "line") {
          previewShape({
            id: "preview-line",
            type: "line",
            start: session.start,
            end: maybeConstrained,
            style: baseStyle,
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
      case "qm":
        previewShape({
          type: "qm_preview",
          patternType: session.patternType,
          points: [...session.points, maybeConstrained],
          style: buildToolStyle(session.patternType, settings)
        });
        break;
      case "structure-break":
        previewShape({
          id: `preview-${session.patternType}`,
          type: session.patternType,
          points: [session.start, maybeConstrained],
          label: session.patternType === "bos" ? "BOS" : "CHoCH",
          direction: inferBreakDirection([session.start, maybeConstrained]),
          showArrow: true,
          style: buildToolStyle(session.patternType, settings),
          createdAt: Date.now()
        });
        break;
      case "fvg":
        previewShape({
          id: "preview-fvg",
          type: "fvg",
          points: [session.start, maybeConstrained],
          label: "FVG",
          extendRight: false,
          style: buildToolStyle("fvg", settings),
          createdAt: Date.now()
        });
        break;
      case "ray":
        previewShape({
          id: "preview-ray",
          type: "ray",
          points: [session.start, maybeConstrained],
          label: "Ray",
          style: buildToolStyle("ray", settings),
          createdAt: Date.now()
        });
        break;
      case "fibonacci":
        if (session.patternType === "fibonacci_retracement") {
          previewShape({
            id: "preview-fib-retracement",
            type: "fibonacci_retracement",
            points: [session.start, maybeConstrained],
            levels: [...DEFAULT_FIBONACCI_RETRACEMENT_LEVELS],
            showLabels: settings.showPatternLabels,
            showPercentages: false,
            extendLeft: false,
            extendRight: false,
            style: buildToolStyle("fibonacci_retracement", settings),
            createdAt: Date.now()
          });
          break;
        }

        previewShape({
          id: "preview-fib-fan",
          type: "fibonacci_fan",
          points: [session.start, maybeConstrained],
          levels: [...DEFAULT_FIBONACCI_FAN_LEVELS],
          showLabels: settings.showPatternLabels,
          showPercentages: false,
          style: buildToolStyle("fibonacci_fan", settings),
          createdAt: Date.now()
        });
        break;
      case "sweep":
        if (session.step === 2 && session.levelEnd) {
          previewShape({
            id: "preview-sweep",
            type: "liquidity_sweep",
            points: [session.levelStart, session.levelEnd, maybeConstrained],
            label: "Sweep",
            showSweepMarker: true,
            style: buildToolStyle("liquidity_sweep", settings),
            createdAt: Date.now()
          });
        }
        break;
      case "pitchfork":
        if (session.step === 2 && session.pivotB) {
          previewShape({
            id: "preview-pitchfork",
            type: "andrews_pitchfork",
            points: [session.pivotA, session.pivotB, maybeConstrained],
            showLabels: settings.showPatternLabels,
            variant: "standard",
            showMedianLine: true,
            showOuterLines: true,
            showAnchorLine: false,
            style: buildToolStyle("andrews_pitchfork", settings),
            createdAt: Date.now()
          });
        }
        break;
      case "text":
        break;
      case "selection-move": {
        const delta = { x: point.x - session.start.x, y: point.y - session.start.y };
        session.working = moveDrawable(session.original, delta);
        updateLiveSelectedDrawable(session.working);
        break;
      }
      case "selection-anchor":
        session.working = updateDrawableAnchor(session.original, session.anchorId, point);
        updateLiveSelectedDrawable(session.working);
        break;
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (isPointerInsideUiWindow(event)) {
      return;
    }

    const session = sessionRef.current;
    if (!session) {
      return;
    }

    const point = getPoint(event);
    setCursorPoint(point);
    setScreenPoint({ x: event.screenX, y: event.screenY });
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
        if (state.activeTool === "fvg" && session.tool === "rectangle") {
          commitDrawable(commitFVGDrawable(session.start, point, settings));
        } else if (session.tool === "line") {
          commitDrawable({
            id: createId("line"),
            type: "line",
            start: session.start,
            end: point,
            style,
            createdAt: Date.now()
          });
        } else if (session.tool === "arrow") {
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
      case "qm":
      case "structure-break":
      case "ray":
      case "fvg":
      case "fibonacci":
      case "sweep":
      case "pitchfork":
        break;
      case "selection-move":
      case "selection-anchor": {
        if (JSON.stringify(session.original) !== JSON.stringify(session.working)) {
          dispatch({ type: "replace-selected-drawable", drawable: sanitizeDrawable(session.working) ?? session.original });
        }
        setLiveDrawables(null);
        sessionRef.current = null;
        break;
      }
    }
  };

  const commitText = () => {
    if (!textDraft) {
      return;
    }

    const existing =
      textDraft.drawableId !== undefined
        ? state.drawables.find((drawable): drawable is TextShape => drawable.id === textDraft.drawableId && drawable.type === "text")
        : undefined;

    if (!textDraft.value.trim()) {
      setTextDraft(null);
      sessionRef.current = null;
      return;
    }

    const nextDrawable = sanitizeDrawable(
      buildTextDrawable(textDraft.point, textDraft.value, settings, existing)
    );
    if (!nextDrawable || nextDrawable.type !== "text") {
      setTextDraft(null);
      sessionRef.current = null;
      return;
    }

    if (existing) {
      dispatch({ type: "replace-selected-drawable", drawable: nextDrawable });
    } else {
      dispatch({ type: "commit", drawable: nextDrawable });
      onInteractionEnd?.("commit", "text");
    }

    setTextDraft(null);
    sessionRef.current = null;
  };

  const handleDoubleClick = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (state.overlayMode === "click-through" || state.hidden || textDraft) {
      return;
    }

    const point = getPoint(event);
    const hit = findTopmostDrawableAtPoint(state.drawables, (drawable) =>
      drawable.type === "text" && isPointNearDrawable(point, drawable, 8)
    );

    if (!hit || hit.type !== "text" || hit.locked) {
      return;
    }

    event.preventDefault();
    dispatch({ type: "select-drawable", id: hit.id });
    sessionRef.current = null;
    setLiveDrawables(null);
    previewShape(null);
    startTextDraft(hit.point, hit);
  };

  const hintText =
    sessionRef.current?.kind === "trend"
      ? "Trend: left click adds points, right click finishes, Esc cancels, Backspace removes last"
      : sessionRef.current?.kind === "channel"
        ? "Channel: click start, click end, move for width, click or right click to finish"
        : sessionRef.current?.kind === "qm"
          ? `QM ${sessionRef.current.patternType === "qm_bullish" ? "Bullish" : "Bearish"}: ${getQMHintLabel(
              sessionRef.current.patternType,
              sessionRef.current.points.length
            )}`
        : sessionRef.current?.kind === "structure-break"
          ? `${sessionRef.current.patternType === "bos" ? "BOS" : "CHoCH"}: Point 2/2`
        : sessionRef.current?.kind === "fvg"
          ? "FVG: Point 2/2: Select opposite corner"
        : sessionRef.current?.kind === "ray"
          ? "Ray: Point 2/2: Select direction point"
        : sessionRef.current?.kind === "fibonacci"
          ? sessionRef.current.patternType === "fibonacci_retracement"
            ? "Fib Retracement: Point 2/2: Select swing end"
            : "Fib Fan: Point 2/2: Select swing end"
        : sessionRef.current?.kind === "sweep"
          ? sessionRef.current.step === 1
            ? "Sweep: Point 2/3: Select liquidity level end"
            : "Sweep: Point 3/3: Select sweep wick/point"
        : sessionRef.current?.kind === "pitchfork"
          ? sessionRef.current.step === 1
            ? "Pitchfork: Point 2/3: Select pivot B"
            : "Pitchfork: Point 3/3: Select pivot C"
      : state.activeTool === "trend"
          ? "Trend tool ready"
          : state.activeTool === "channel"
            ? "Channel tool ready"
            : state.activeTool === "horizontal_line"
              ? "Horizontal Line: click to place"
              : state.activeTool === "vertical_marker"
                ? "Vertical Marker: click to place"
                : state.activeTool === "ray"
                  ? "Ray: Point 1/2: Select start"
                  : state.activeTool === "fibonacci_retracement"
                    ? "Fib Retracement: Point 1/2: Select swing start"
                    : state.activeTool === "fibonacci_fan"
                      ? "Fib Fan: Point 1/2: Select swing start"
                      : state.activeTool === "andrews_pitchfork"
                        ? "Pitchfork: Point 1/3: Select pivot A"
            : state.activeTool === "qm_bullish"
              ? "QM Bullish: left click places 5 points, right click finishes, Esc cancels"
              : state.activeTool === "qm_bearish"
                ? "QM Bearish: left click places 5 points, right click finishes, Esc cancels"
                : state.activeTool === "bos"
                  ? "BOS: Point 1/2: Select structure level"
                  : state.activeTool === "choch"
                    ? "CHoCH: Point 1/2: Select previous structure"
                    : state.activeTool === "fvg"
                      ? "FVG: Point 1/2: Select gap corner"
                      : state.activeTool === "liquidity_sweep"
                        ? "Sweep: Point 1/3: Select liquidity level start"
            : state.activeTool === "select"
              ? "Select: click object, drag to move, drag blue handles to edit. Locked objects stay selectable but cannot be edited."
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
        onDoubleClick={handleDoubleClick}
        onContextMenu={(event) => event.preventDefault()}
      />
      {shouldRenderPersistentCursorHint(showPersistentCursorHints, settings.showCursorHints, Boolean(cursorPoint)) && cursorPoint ? (
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
      {settings.overlayDebugBounds ? (
        <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-cyan-400/80">
          {/* Yellow corner markers */}
          <div className="absolute left-0 top-0 h-5 w-5 border-b-2 border-r-2 border-yellow-400/90" />
          <div className="absolute right-0 top-0 h-5 w-5 border-b-2 border-l-2 border-yellow-400/90" />
          <div className="absolute bottom-0 left-0 h-5 w-5 border-r-2 border-t-2 border-yellow-400/90" />
          <div className="absolute bottom-0 right-0 h-5 w-5 border-l-2 border-t-2 border-yellow-400/90" />
          <div className="absolute left-2 top-2 rounded-xl bg-[rgba(2,8,23,0.92)] px-3 py-2 font-mono text-[11px] leading-5 text-cyan-300 shadow-lg ring-1 ring-cyan-400/30">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70">Overlay Debug</div>
            <div>CSS: {Math.round(window.innerWidth)}×{Math.round(window.innerHeight)}</div>
            <div>Doc: {document.documentElement.clientWidth}×{document.documentElement.clientHeight}</div>
            {(() => { const r = wrapperRef.current?.getBoundingClientRect(); return r ? <div>Wrapper: {Math.round(r.left)},{Math.round(r.top)} {Math.round(r.width)}×{Math.round(r.height)}</div> : null; })()}
            <div>Canvas: {canvasRef.current?.width ?? 0}×{canvasRef.current?.height ?? 0}</div>
            <div>DPR: {window.devicePixelRatio.toFixed(2)}</div>
            {debugWindowInfo ? (
              <>
                <div className="mt-1 border-t border-cyan-400/20 pt-1" />
                <div>Win pos: {debugWindowInfo.outerX},{debugWindowInfo.outerY}</div>
                <div>Win outer: {debugWindowInfo.outerW}×{debugWindowInfo.outerH}</div>
                <div>Win inner: {debugWindowInfo.innerW}×{debugWindowInfo.innerH}</div>
              </>
            ) : null}
            <div className="mt-1 border-t border-cyan-400/20 pt-1" />
            <div>Tool: {state.activeTool}</div>
            {cursorPoint ? <div>Ptr: {cursorPoint.x.toFixed(0)},{cursorPoint.y.toFixed(0)}</div> : null}
            {screenPoint ? <div>Screen: {screenPoint.x.toFixed(0)},{screenPoint.y.toFixed(0)}</div> : null}
          </div>
        </div>
      ) : null}
      {textDraft ? (
        <textarea
          autoFocus
          value={textDraft.value}
          onChange={(event) => setTextDraft({ ...textDraft, value: event.target.value })}
          onBlur={commitText}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              commitText();
            } else if (event.key === "Escape") {
              setTextDraft(null);
              sessionRef.current = null;
              onInteractionEnd?.("cancel", "text");
            }
          }}
          rows={3}
          placeholder="Type annotation text"
          className="pointer-events-auto absolute min-h-[88px] w-[260px] resize rounded-2xl border border-slate-700/90 bg-slate-950/95 px-3 py-2 text-sm leading-6 text-slate-100 shadow-[0_20px_50px_rgba(2,8,23,0.45)] outline-none"
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

export function shouldRenderPersistentCursorHint(
  showPersistentCursorHints: boolean,
  showCursorHintsSetting: boolean,
  hasCursorPoint: boolean
) {
  return showPersistentCursorHints && showCursorHintsSetting && hasCursorPoint;
}
