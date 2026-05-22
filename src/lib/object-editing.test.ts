import { describe, expect, it } from "vitest";
import type { Drawable } from "../types/drawables";
import {
  duplicateDrawable,
  getAnchorHandles,
  getSelectedObjectSummary,
  moveDrawable,
  patchDrawableProperties,
  updateDrawableAnchor
} from "./object-editing";

const arrow: Drawable = {
  id: "arrow-1",
  type: "arrow",
  start: { x: 10, y: 10 },
  end: { x: 50, y: 50 },
  style: { strokeColor: "#fff", fillColor: "#fff", strokeWidth: 2, opacity: 1 },
  createdAt: 1
};

describe("object editing", () => {
  it("moves a drawable without changing its shape", () => {
    const moved = moveDrawable(arrow, { x: 20, y: -5 });
    expect(moved.type).toBe("arrow");
    if (moved.type !== "arrow") {
      return;
    }
    expect(moved.start).toEqual({ x: 30, y: 5 });
    expect(moved.end).toEqual({ x: 70, y: 45 });
  });

  it("updates anchor points for rectangle-like shapes", () => {
    const rectangle: Drawable = {
      id: "rect-1",
      type: "rectangle",
      start: { x: 20, y: 20 },
      end: { x: 120, y: 80 },
      style: { strokeColor: "#0ea5e9", fillColor: "#0ea5e9", strokeWidth: 2, opacity: 0.8 },
      createdAt: 1
    };

    const updated = updateDrawableAnchor(rectangle, "se", { x: 160, y: 100 });
    expect(updated.type).toBe("rectangle");
    if (updated.type !== "rectangle") {
      return;
    }
    expect(updated.end).toEqual({ x: 160, y: 100 });
  });

  it("patches editable properties and creates selected summaries", () => {
    const text: Drawable = {
      id: "text-1",
      type: "text",
      point: { x: 30, y: 40 },
      text: "Old",
      fontSize: 18,
      fontWeight: "semibold",
      align: "left",
      backgroundEnabled: false,
      backgroundColor: "#020817",
      backgroundOpacity: 0.82,
      padding: 8,
      borderEnabled: false,
      borderColor: "#334155",
      borderRadius: 10,
      style: { strokeColor: "#fff", fillColor: "#fff", strokeWidth: 2, opacity: 1 },
      createdAt: 1
    };

    const patched = patchDrawableProperties(text, {
      text: "Updated\nSecond",
      fontSize: 120,
      fontWeight: "bold",
      textAlign: "center",
      backgroundEnabled: true,
      backgroundOpacity: -2,
      borderEnabled: true,
      borderRadius: 99,
      strokeColor: "#3B82F6",
      opacity: 0.55
    });

    expect(patched.type).toBe("text");
    if (patched.type !== "text") {
      return;
    }

    expect(patched.text).toBe("Updated\nSecond");
    expect(patched.fontSize).toBe(96);
    expect(patched.fontWeight).toBe("bold");
    expect(patched.align).toBe("center");
    expect(patched.backgroundEnabled).toBe(true);
    expect(patched.backgroundOpacity).toBe(0);
    expect(patched.borderRadius).toBe(32);
    expect(getSelectedObjectSummary(patched)?.text).toBe("Updated\nSecond");
    expect(getSelectedObjectSummary(patched)?.textAlign).toBe("center");
  });

  it("returns anchor handles and can duplicate objects", () => {
    expect(getAnchorHandles(arrow)).toHaveLength(2);
    const duplicate = duplicateDrawable(arrow);
    expect(duplicate.id).not.toBe(arrow.id);
  });

  it("supports QM anchor edits and property toggles", () => {
    const qm: Drawable = {
      id: "qm-1",
      type: "qm_bullish",
      points: [
        { x: 20, y: 60 },
        { x: 60, y: 20 },
        { x: 120, y: 120 },
        { x: 180, y: 30 },
        { x: 220, y: 70 }
      ],
      label: "Bullish QM",
      showLabels: true,
      showNeckline: true,
      showRetestZone: true,
      showDirectionArrow: true,
      style: { strokeColor: "#22c55e", fillColor: "#22c55e", strokeWidth: 3, opacity: 0.9 },
      createdAt: 1
    };

    const movedAnchor = updateDrawableAnchor(qm, "point-4", { x: 240, y: 84 });
    expect(movedAnchor.type).toBe("qm_bullish");
    if (movedAnchor.type !== "qm_bullish") {
      return;
    }

    expect(movedAnchor.points[4]).toEqual({ x: 240, y: 84 });

    const patched = patchDrawableProperties(movedAnchor, {
      label: "Updated QM",
      showRetestZone: false,
      showDirectionArrow: false
    });
    expect(patched.type).toBe("qm_bullish");
    if (patched.type !== "qm_bullish") {
      return;
    }

    expect(patched.label).toBe("Updated QM");
    expect(patched.showRetestZone).toBe(false);
    expect(getSelectedObjectSummary(patched)?.showDirectionArrow).toBe(false);
  });

  it("supports FVG and Sweep editing properties", () => {
    const fvg: Drawable = {
      id: "fvg-1",
      type: "fvg",
      points: [{ x: 20, y: 40 }, { x: 120, y: 90 }],
      label: "FVG",
      extendRight: false,
      style: { strokeColor: "#a855f7", fillColor: "#a855f7", strokeWidth: 2, opacity: 0.7 },
      createdAt: 1
    };
    const patchedFvg = patchDrawableProperties(fvg, { extendRight: true, label: "Gap" });
    expect(patchedFvg.type).toBe("fvg");
    if (patchedFvg.type !== "fvg") {
      return;
    }
    expect(patchedFvg.extendRight).toBe(true);

    const sweep: Drawable = {
      id: "sweep-1",
      type: "liquidity_sweep",
      points: [{ x: 20, y: 60 }, { x: 140, y: 60 }, { x: 100, y: 20 }],
      label: "Sweep",
      showSweepMarker: true,
      style: { strokeColor: "#fb7185", fillColor: "#fb7185", strokeWidth: 2, opacity: 0.85 },
      createdAt: 1
    };
    const movedSweep = updateDrawableAnchor(sweep, "point-2", { x: 110, y: 16 });
    expect(movedSweep.type).toBe("liquidity_sweep");
    const patchedSweep = patchDrawableProperties(movedSweep, { showSweepMarker: false });
    expect(getSelectedObjectSummary(patchedSweep)?.showSweepMarker).toBe(false);
  });

  it("supports core chart tools editing and summaries", () => {
    const horizontal: Drawable = {
      id: "hline-1",
      type: "horizontal_line",
      y: 144,
      label: "Level",
      style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    const movedHorizontal = moveDrawable(horizontal, { x: 0, y: 16 });
    expect(movedHorizontal.type).toBe("horizontal_line");
    if (movedHorizontal.type !== "horizontal_line") {
      return;
    }
    expect(movedHorizontal.y).toBe(160);
    expect(getAnchorHandles(movedHorizontal)).toHaveLength(1);

    const vertical: Drawable = {
      id: "vline-1",
      type: "vertical_marker",
      x: 320,
      label: "Event",
      style: { strokeColor: "#94a3b8", fillColor: "#94a3b8", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    const updatedVertical = updateDrawableAnchor(vertical, "position", { x: 360, y: 80 });
    expect(updatedVertical.type).toBe("vertical_marker");
    if (updatedVertical.type !== "vertical_marker") {
      return;
    }
    expect(updatedVertical.x).toBe(360);

    const fib: Drawable = {
      id: "fib-1",
      type: "fibonacci_retracement",
      points: [{ x: 40, y: 200 }, { x: 220, y: 80 }],
      levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1],
      showLabels: true,
      showPercentages: false,
      extendLeft: false,
      extendRight: false,
      style: { strokeColor: "#f59e0b", fillColor: "#f59e0b", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    const patchedFib = patchDrawableProperties(fib, {
      showLabels: false,
      strokeWidth: 4,
      levels: [1.618, 0.382, 0.382, 0.5],
      showPercentages: true,
      extendLeft: true,
      extendRight: true
    });
    expect(getSelectedObjectSummary(patchedFib)?.showLabels).toBe(false);
    expect(getSelectedObjectSummary(patchedFib)?.levels).toEqual([0.382, 0.5, 1.618]);
    expect(getSelectedObjectSummary(patchedFib)?.showPercentages).toBe(true);
    expect(getSelectedObjectSummary(patchedFib)?.extendLeft).toBe(true);

    const pitchfork: Drawable = {
      id: "pitchfork-1",
      type: "andrews_pitchfork",
      points: [{ x: 120, y: 40 }, { x: 80, y: 180 }, { x: 220, y: 210 }],
      showLabels: true,
      variant: "standard",
      showMedianLine: true,
      showOuterLines: true,
      showAnchorLine: false,
      style: { strokeColor: "#10b981", fillColor: "#10b981", strokeWidth: 2, opacity: 0.9 },
      createdAt: 1
    };
    const movedPitchfork = updateDrawableAnchor(pitchfork, "point-2", { x: 240, y: 220 });
    expect(movedPitchfork.type).toBe("andrews_pitchfork");
    if (movedPitchfork.type !== "andrews_pitchfork") {
      return;
    }
    expect(movedPitchfork.points[2]).toEqual({ x: 240, y: 220 });
    const patchedPitchfork = patchDrawableProperties(movedPitchfork, {
      pitchforkVariant: "schiff",
      showAnchorLine: true,
      showMedianLine: false
    });
    expect(getSelectedObjectSummary(patchedPitchfork)?.pitchforkVariant).toBe("schiff");
    expect(getSelectedObjectSummary(patchedPitchfork)?.showAnchorLine).toBe(true);
  });

  it("keeps legacy vertical markers neutral in editing summaries", () => {
    const legacyMarker: Drawable = {
      id: "legacy-1",
      type: "binary_marker",
      markerType: "expiry_line",
      points: [{ x: 120, y: 42 }, { x: 120, y: 180 }],
      expiry: "M5",
      style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 0.85 },
      createdAt: 1
    };

    const summary = getSelectedObjectSummary(legacyMarker);
    expect(summary?.type).toBe("legacy_marker");
    expect(summary?.label).toBe("5m");
    expect(getAnchorHandles(legacyMarker)).toHaveLength(1);
  });

  it("prevents locked objects from moving or anchor editing until unlocked", () => {
    const lockedArrow: Drawable = {
      ...arrow,
      locked: true
    };

    expect(moveDrawable(lockedArrow, { x: 20, y: 20 })).toEqual(lockedArrow);
    expect(updateDrawableAnchor(lockedArrow, "end", { x: 90, y: 120 })).toEqual(lockedArrow);

    const stillLocked = patchDrawableProperties(lockedArrow, { strokeColor: "#f59e0b" });
    expect(stillLocked).toEqual(lockedArrow);

    const unlocked = patchDrawableProperties(lockedArrow, { locked: false });
    expect(unlocked.locked).toBe(false);

    const editedUnlocked = patchDrawableProperties(unlocked, { strokeColor: "#f59e0b" });
    expect(editedUnlocked.style.strokeColor).toBe("#f59e0b");
    expect(getSelectedObjectSummary(lockedArrow)?.locked).toBe(true);
  });

  it("prevents locked text from changing styled properties until unlocked", () => {
    const lockedText: Drawable = {
      id: "text-locked",
      type: "text",
      point: { x: 60, y: 80 },
      text: "Locked note",
      fontSize: 18,
      fontWeight: "semibold",
      align: "left",
      backgroundEnabled: false,
      backgroundColor: "#020817",
      backgroundOpacity: 0.82,
      padding: 8,
      borderEnabled: false,
      borderColor: "#334155",
      borderRadius: 10,
      style: { strokeColor: "#fff", fillColor: "#fff", strokeWidth: 2, opacity: 1 },
      createdAt: 1,
      locked: true
    };

    const stillLocked = patchDrawableProperties(lockedText, {
      text: "Changed",
      fontWeight: "bold",
      backgroundEnabled: true
    });

    expect(stillLocked).toEqual(lockedText);
  });
});
