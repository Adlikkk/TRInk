import { describe, expect, it } from "vitest";
import type { Drawable } from "../types/drawables";
import { isPointNearDrawable } from "./hit-test";

describe("hit testing", () => {
  it("supports QM path and retest zone hit testing", () => {
    const qm: Drawable = {
      id: "qm-1",
      type: "qm_bearish",
      points: [
        { x: 20, y: 60 },
        { x: 60, y: 120 },
        { x: 120, y: 20 },
        { x: 180, y: 140 },
        { x: 220, y: 80 }
      ],
      label: "Bearish QM",
      showLabels: true,
      showNeckline: true,
      showRetestZone: true,
      showDirectionArrow: true,
      style: { strokeColor: "#f43f5e", fillColor: "#f43f5e", strokeWidth: 3, opacity: 0.9 },
      createdAt: 1
    };

    expect(isPointNearDrawable({ x: 120, y: 20 }, qm, 10)).toBe(true);
    expect(isPointNearDrawable({ x: 220, y: 80 }, qm, 10)).toBe(true);
  });

  it("supports BOS/FVG/Sweep hit testing", () => {
    const bos: Drawable = {
      id: "bos-1",
      type: "bos",
      points: [{ x: 20, y: 60 }, { x: 140, y: 30 }],
      label: "BOS",
      direction: "bullish",
      showArrow: true,
      style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 3, opacity: 0.9 },
      createdAt: 1
    };
    expect(isPointNearDrawable({ x: 80, y: 45 }, bos, 10)).toBe(true);

    const fvg: Drawable = {
      id: "fvg-1",
      type: "fvg",
      points: [{ x: 20, y: 40 }, { x: 120, y: 90 }],
      label: "FVG",
      extendRight: false,
      style: { strokeColor: "#a855f7", fillColor: "#a855f7", strokeWidth: 2, opacity: 0.7 },
      createdAt: 1
    };
    expect(isPointNearDrawable({ x: 60, y: 60 }, fvg, 10)).toBe(true);

    const sweep: Drawable = {
      id: "sweep-1",
      type: "liquidity_sweep",
      points: [{ x: 20, y: 60 }, { x: 140, y: 60 }, { x: 100, y: 20 }],
      label: "Sweep",
      showSweepMarker: true,
      style: { strokeColor: "#fb7185", fillColor: "#fb7185", strokeWidth: 2, opacity: 0.85 },
      createdAt: 1
    };
    expect(isPointNearDrawable({ x: 100, y: 20 }, sweep, 10)).toBe(true);
  });

  it("supports the core chart tools pack hit testing", () => {
    const horizontal: Drawable = {
      id: "hline-1",
      type: "horizontal_line",
      y: 120,
      label: "Horizontal Line",
      style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    expect(isPointNearDrawable({ x: 340, y: 124 }, horizontal, 8)).toBe(true);

    const vertical: Drawable = {
      id: "vline-1",
      type: "vertical_marker",
      x: 260,
      label: "Vertical Marker",
      style: { strokeColor: "#94a3b8", fillColor: "#94a3b8", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    expect(isPointNearDrawable({ x: 256, y: 220 }, vertical, 8)).toBe(true);

    const ray: Drawable = {
      id: "ray-1",
      type: "ray",
      points: [{ x: 40, y: 220 }, { x: 120, y: 180 }],
      label: "Ray",
      style: { strokeColor: "#22c55e", fillColor: "#22c55e", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    expect(isPointNearDrawable({ x: 220, y: 130 }, ray, 12)).toBe(true);

    const fibFan: Drawable = {
      id: "fib-fan-1",
      type: "fibonacci_fan",
      points: [{ x: 80, y: 220 }, { x: 220, y: 100 }],
      levels: [0.382, 0.5, 0.618],
      showLabels: true,
      showPercentages: false,
      style: { strokeColor: "#8b5cf6", fillColor: "#8b5cf6", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    expect(isPointNearDrawable({ x: 200, y: 182 }, fibFan, 12)).toBe(true);

    const fibRetracement: Drawable = {
      id: "fib-ret-1",
      type: "fibonacci_retracement",
      points: [{ x: 140, y: 240 }, { x: 260, y: 80 }],
      levels: [0, 0.5, 1],
      showLabels: true,
      showPercentages: true,
      extendLeft: true,
      extendRight: true,
      style: { strokeColor: "#f59e0b", fillColor: "#f59e0b", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    expect(isPointNearDrawable({ x: 20, y: 160 }, fibRetracement, 12)).toBe(true);

    const pitchfork: Drawable = {
      id: "pitchfork-1",
      type: "andrews_pitchfork",
      points: [{ x: 120, y: 40 }, { x: 60, y: 200 }, { x: 220, y: 220 }],
      showLabels: true,
      variant: "schiff",
      showMedianLine: true,
      showOuterLines: true,
      showAnchorLine: true,
      style: { strokeColor: "#10b981", fillColor: "#10b981", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    expect(isPointNearDrawable({ x: 120, y: 40 }, pitchfork, 18)).toBe(true);
  });

  it("uses multiline text bounds for hit testing", () => {
    const text: Drawable = {
      id: "text-1",
      type: "text",
      point: { x: 80, y: 80 },
      text: "First line\nSecond line",
      fontSize: 20,
      fontWeight: "bold",
      align: "left",
      backgroundEnabled: true,
      backgroundColor: "#020817",
      backgroundOpacity: 0.82,
      padding: 10,
      borderEnabled: true,
      borderColor: "#334155",
      borderRadius: 10,
      style: { strokeColor: "#ffffff", fillColor: "#ffffff", strokeWidth: 2, opacity: 1 },
      createdAt: 1
    };

    expect(isPointNearDrawable({ x: 95, y: 72 }, text, 6)).toBe(true);
    expect(isPointNearDrawable({ x: 140, y: 108 }, text, 6)).toBe(true);
    expect(isPointNearDrawable({ x: 20, y: 20 }, text, 6)).toBe(false);
  });
});
