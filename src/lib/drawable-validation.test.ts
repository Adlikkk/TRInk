import { describe, expect, it } from "vitest";
import type { Drawable, QMPattern } from "../types/drawables";
import { findTopmostDrawableAtPoint, sanitizeDrawable } from "./drawable-validation";

describe("drawable validation", () => {
  it("rejects malformed freehand drawables", () => {
    const invalid = {
      id: "bad",
      type: "freehand",
      tool: "pen",
      points: [{ x: 10, y: 10 }],
      style: { strokeColor: "#fff", strokeWidth: 2, opacity: 1 },
      createdAt: 1
    } as unknown as Drawable;

    expect(sanitizeDrawable(invalid)).toBeNull();
  });

  it("normalizes a valid text drawable", () => {
    const valid = {
      id: "text",
      type: "text",
      point: { x: 10, y: 10 },
      text: "  Note\nSecond line  ",
      fontSize: 140,
      fontWeight: "unsupported",
      align: "middle",
      backgroundEnabled: true,
      backgroundOpacity: 2,
      padding: 44,
      borderEnabled: true,
      borderRadius: 99,
      style: { strokeColor: "#fff", fillColor: "#fff", strokeWidth: 2, opacity: 1 },
      createdAt: 1
    } as unknown as Drawable;

    const sanitized = sanitizeDrawable(valid);
    expect(sanitized?.type).toBe("text");
    if (sanitized?.type === "text") {
      expect(sanitized.text).toBe("Note\nSecond line");
      expect(sanitized.fontSize).toBe(96);
      expect(sanitized.fontWeight).toBe("semibold");
      expect(sanitized.align).toBe("left");
      expect(sanitized.backgroundOpacity).toBe(1);
      expect(sanitized.padding).toBe(32);
      expect(sanitized.borderRadius).toBe(32);
    }
  });

  it("accepts a valid QM drawable and rejects malformed QM data", () => {
    const valid: QMPattern = {
      id: "qm-1",
      type: "qm_bearish",
      points: [
        { x: 20, y: 40 },
        { x: 60, y: 100 },
        { x: 120, y: 20 },
        { x: 180, y: 140 },
        { x: 230, y: 80 }
      ],
      label: "  Bearish QM  ",
      showLabels: true,
      showNeckline: true,
      showRetestZone: true,
      showDirectionArrow: true,
      style: { strokeColor: "#f43f5e", fillColor: "#f43f5e", strokeWidth: 3, opacity: 0.9 },
      createdAt: 1
    };

    const sanitized = sanitizeDrawable(valid);
    expect(sanitized?.type).toBe("qm_bearish");
    if (sanitized?.type === "qm_bearish") {
      expect(sanitized.label).toBe("Bearish QM");
      expect(sanitized.points).toHaveLength(5);
    }

    const invalid = {
      ...valid,
      points: valid.points.slice(0, 3)
    } as Drawable;
    expect(sanitizeDrawable(invalid)).toBeNull();
  });

  it("accepts valid BOS/FVG/Sweep drawables", () => {
    const bos = sanitizeDrawable({
      id: "bos-1",
      type: "bos",
      points: [{ x: 20, y: 60 }, { x: 120, y: 24 }],
      label: "BOS",
      direction: "bullish",
      showArrow: true,
      style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 3, opacity: 0.9 },
      createdAt: 1
    } as Drawable);
    expect(bos?.type).toBe("bos");

    const fvg = sanitizeDrawable({
      id: "fvg-1",
      type: "fvg",
      points: [{ x: 20, y: 40 }, { x: 120, y: 90 }],
      label: "FVG",
      extendRight: true,
      style: { strokeColor: "#a855f7", fillColor: "#a855f7", strokeWidth: 2, opacity: 0.7 },
      createdAt: 1
    } as Drawable);
    expect(fvg?.type).toBe("fvg");

    const sweep = sanitizeDrawable({
      id: "sweep-1",
      type: "liquidity_sweep",
      points: [{ x: 20, y: 60 }, { x: 140, y: 60 }, { x: 100, y: 20 }],
      label: "Sweep",
      showSweepMarker: true,
      style: { strokeColor: "#fb7185", fillColor: "#fb7185", strokeWidth: 2, opacity: 0.85 },
      createdAt: 1
    } as Drawable);
    expect(sweep?.type).toBe("liquidity_sweep");
  });

  it("keeps legacy vertical markers loadable for backward compatibility", () => {
    const legacy = sanitizeDrawable({
      id: "legacy-1",
      type: "binary_marker",
      markerType: "expiry_line",
      points: [{ x: 200, y: 40 }, { x: 200, y: 220 }],
      expiry: "M15",
      style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 0.85 },
      createdAt: 1
    } as Drawable);

    expect(legacy?.type).toBe("binary_marker");
    if (legacy?.type !== "binary_marker") {
      return;
    }
    expect(legacy.markerType).toBe("expiry_line");
  });

  it("accepts the core chart tools pack drawables", () => {
    const horizontal = sanitizeDrawable({
      id: "h-1",
      type: "horizontal_line",
      y: 140,
      label: "Support",
      style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 0.8 },
      createdAt: 1
    } as Drawable);
    expect(horizontal?.type).toBe("horizontal_line");

    const vertical = sanitizeDrawable({
      id: "v-1",
      type: "vertical_marker",
      x: 220,
      label: "London",
      style: { strokeColor: "#94a3b8", fillColor: "#94a3b8", strokeWidth: 2, opacity: 0.8 },
      createdAt: 1
    } as Drawable);
    expect(vertical?.type).toBe("vertical_marker");

    const ray = sanitizeDrawable({
      id: "r-1",
      type: "ray",
      points: [{ x: 20, y: 160 }, { x: 120, y: 80 }],
      label: "Ray",
      style: { strokeColor: "#22c55e", fillColor: "#22c55e", strokeWidth: 2, opacity: 0.8 },
      createdAt: 1
    } as Drawable);
    expect(ray?.type).toBe("ray");

    const fib = sanitizeDrawable({
      id: "fib-1",
      type: "fibonacci_retracement",
      points: [{ x: 60, y: 220 }, { x: 260, y: 40 }],
      levels: [0, 0.5, 1],
      showLabels: true,
      style: { strokeColor: "#f59e0b", fillColor: "#f59e0b", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    } as Drawable);
    expect(fib?.type).toBe("fibonacci_retracement");

    const fan = sanitizeDrawable({
      id: "fan-1",
      type: "fibonacci_fan",
      points: [{ x: 60, y: 220 }, { x: 260, y: 40 }],
      levels: [0.382, 0.5, 0.618],
      showLabels: true,
      style: { strokeColor: "#8b5cf6", fillColor: "#8b5cf6", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    } as Drawable);
    expect(fan?.type).toBe("fibonacci_fan");

    const pitchfork = sanitizeDrawable({
      id: "pf-1",
      type: "andrews_pitchfork",
      points: [{ x: 100, y: 40 }, { x: 40, y: 180 }, { x: 180, y: 210 }],
      showLabels: true,
      style: { strokeColor: "#10b981", fillColor: "#10b981", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    } as Drawable);
    expect(pitchfork?.type).toBe("andrews_pitchfork");
  });

  it("normalizes custom Fibonacci levels and Pitchfork variants safely", () => {
    const fib = sanitizeDrawable({
      id: "fib-custom",
      type: "fibonacci_retracement",
      points: [{ x: 60, y: 220 }, { x: 260, y: 40 }],
      levels: [0.618, 0.382, 0.618, 1.618, "bad", 99],
      showLabels: true,
      showPercentages: true,
      extendLeft: true,
      extendRight: true,
      style: { strokeColor: "#f59e0b", fillColor: "#f59e0b", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    } as unknown as Drawable);

    expect(fib?.type).toBe("fibonacci_retracement");
    if (fib?.type !== "fibonacci_retracement") {
      return;
    }
    expect(fib.levels).toEqual([0.382, 0.618, 1.618, 10]);
    expect(fib.showPercentages).toBe(true);
    expect(fib.extendLeft).toBe(true);
    expect(fib.extendRight).toBe(true);

    const pitchfork = sanitizeDrawable({
      id: "pf-custom",
      type: "andrews_pitchfork",
      points: [{ x: 100, y: 40 }, { x: 40, y: 180 }, { x: 180, y: 210 }],
      showLabels: true,
      variant: "unsupported",
      showMedianLine: false,
      showOuterLines: true,
      showAnchorLine: true,
      style: { strokeColor: "#10b981", fillColor: "#10b981", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    } as unknown as Drawable);

    expect(pitchfork?.type).toBe("andrews_pitchfork");
    if (pitchfork?.type !== "andrews_pitchfork") {
      return;
    }
    expect(pitchfork.variant).toBe("standard");
    expect(pitchfork.showMedianLine).toBe(false);
    expect(pitchfork.showAnchorLine).toBe(true);
  });

  it("caps excessive Fibonacci level counts safely", () => {
    const fib = sanitizeDrawable({
      id: "fib-cap",
      type: "fibonacci_fan",
      points: [{ x: 60, y: 220 }, { x: 260, y: 40 }],
      levels: Array.from({ length: 32 }, (_, index) => index / 10),
      showLabels: true,
      showPercentages: false,
      style: { strokeColor: "#8b5cf6", fillColor: "#8b5cf6", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    } as Drawable);

    expect(fib?.type).toBe("fibonacci_fan");
    if (fib?.type !== "fibonacci_fan") {
      return;
    }

    expect(fib.levels).toHaveLength(20);
    expect(fib.levels[0]).toBe(0);
    expect(fib.levels[fib.levels.length - 1]).toBe(1.9);
  });

  it("keeps lock state safe and respects topmost order lookups", () => {
    const unlocked = sanitizeDrawable({
      id: "back",
      type: "rectangle",
      start: { x: 20, y: 20 },
      end: { x: 120, y: 120 },
      style: { strokeColor: "#94a3b8", fillColor: "#94a3b8", strokeWidth: 2, opacity: 0.4 },
      createdAt: 1
    } as Drawable);
    const locked = sanitizeDrawable({
      id: "front",
      type: "rectangle",
      start: { x: 40, y: 40 },
      end: { x: 140, y: 140 },
      style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 0.6 },
      createdAt: 2,
      locked: "yes"
    } as unknown as Drawable);

    expect(unlocked?.locked).toBe(false);
    expect(locked?.locked).toBe(false);

    const explicitlyLocked = sanitizeDrawable({
      id: "front-locked",
      type: "rectangle",
      start: { x: 40, y: 40 },
      end: { x: 140, y: 140 },
      style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 0.6 },
      createdAt: 2,
      locked: true
    } as Drawable);
    expect(explicitlyLocked?.locked).toBe(true);

    const topmost = findTopmostDrawableAtPoint(
      [unlocked, explicitlyLocked].filter((entry): entry is Drawable => Boolean(entry)),
      (drawable) => drawable.id.includes("front")
    );
    expect(topmost?.id).toBe("front-locked");
  });
});
