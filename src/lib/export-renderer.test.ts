import { describe, expect, it } from "vitest";
import type { Drawable } from "../types/drawables";
import allDrawableTypesSession from "../test-fixtures/sessions/all-drawable-types-session.json";
import { prepareAnnotationExportPlan } from "./export-renderer";
import { parseSessionJson } from "./session-format";

const validDrawable: Drawable = {
  id: "zone-1",
  type: "support_resistance_zone",
  start: { x: 20, y: 30 },
  end: { x: 120, y: 80 },
  label: "Zone",
  style: { strokeColor: "#22c55e", fillColor: "#22c55e", strokeWidth: 2, opacity: 0.4 },
  createdAt: 1
};

describe("export renderer", () => {
  it("sanitizes malformed drawables before export rendering", () => {
    const plan = prepareAnnotationExportPlan({
      drawables: [
        validDrawable,
        {
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
        } as Drawable,
        {
          id: "bos-1",
          type: "bos",
          points: [{ x: 20, y: 60 }, { x: 120, y: 24 }],
          label: "BOS",
          direction: "bullish",
          showArrow: true,
          style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 3, opacity: 0.9 },
          createdAt: 1
        } as Drawable,
        { id: "bad", type: "text" } as Drawable
      ],
      width: 1920,
      height: 1080,
      pixelRatio: 1.5
    });

    expect(plan.drawables).toHaveLength(3);
    expect(plan.drawables[0]).toMatchObject({ id: "zone-1" });
    expect(plan.drawables[1]).toMatchObject({ id: "qm-1" });
    expect(plan.drawables[2]).toMatchObject({ id: "bos-1" });
    expect(plan.renderWidth).toBe(2880);
    expect(plan.renderHeight).toBe(1620);
    expect(plan.ignoredDrawables).toBe(1);
  });

  it("rejects unsafe export dimensions", () => {
    expect(() =>
      prepareAnnotationExportPlan({
        drawables: [validDrawable],
        width: 10000,
        height: 5000,
        pixelRatio: 2
      })
    ).toThrow(/too large/i);
  });

  it("keeps core chart tools pack drawables in export plans", () => {
    const plan = prepareAnnotationExportPlan({
      drawables: [
        {
          id: "vline-1",
          type: "vertical_marker",
          x: 280,
          label: "Session marker",
          style: { strokeColor: "#94a3b8", fillColor: "#94a3b8", strokeWidth: 2, opacity: 0.8 },
          createdAt: 1
        } as Drawable,
        {
          id: "fib-1",
          type: "fibonacci_retracement",
          points: [{ x: 60, y: 240 }, { x: 240, y: 90 }],
          levels: [0, 0.382, 0.618, 1.618],
          showLabels: true,
          showPercentages: true,
          extendLeft: true,
          extendRight: true,
          style: { strokeColor: "#f59e0b", fillColor: "#f59e0b", strokeWidth: 2, opacity: 0.9 },
          createdAt: 1
        } as Drawable,
        {
          id: "pitchfork-1",
          type: "andrews_pitchfork",
          points: [{ x: 120, y: 40 }, { x: 80, y: 180 }, { x: 220, y: 210 }],
          showLabels: true,
          variant: "modified_schiff",
          showMedianLine: true,
          showOuterLines: true,
          showAnchorLine: true,
          style: { strokeColor: "#10b981", fillColor: "#10b981", strokeWidth: 2, opacity: 0.9 },
          createdAt: 1
        } as Drawable
      ],
      width: 1280,
      height: 720,
      pixelRatio: 1
    });

    expect(plan.drawables).toHaveLength(3);
    expect(plan.drawables[0]).toMatchObject({ type: "vertical_marker" });
    expect(plan.drawables[1]).toMatchObject({
      type: "fibonacci_retracement",
      showPercentages: true,
      extendLeft: true,
      extendRight: true
    });
    expect(plan.drawables[2]).toMatchObject({
      type: "andrews_pitchfork",
      variant: "modified_schiff",
      showAnchorLine: true
    });
  });

  it("preserves draw order in export rendering plans", () => {
    const plan = prepareAnnotationExportPlan({
      drawables: [
        {
          id: "back",
          type: "rectangle",
          start: { x: 20, y: 20 },
          end: { x: 120, y: 120 },
          style: { strokeColor: "#94a3b8", fillColor: "#94a3b8", strokeWidth: 2, opacity: 0.4 },
          createdAt: 1
        } as Drawable,
        {
          id: "front",
          type: "arrow",
          start: { x: 30, y: 30 },
          end: { x: 90, y: 90 },
          style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 1 },
          createdAt: 2,
          locked: true
        } as Drawable
      ],
      width: 800,
      height: 600,
      pixelRatio: 1
    });

    expect(plan.drawables.map((entry) => entry.id)).toEqual(["back", "front"]);
  });

  it("keeps styled multiline text in export plans", () => {
    const plan = prepareAnnotationExportPlan({
      drawables: [
        {
          id: "text-1",
          type: "text",
          point: { x: 120, y: 120 },
          text: "Trade review\nKey level",
          fontSize: 22,
          fontWeight: "bold",
          align: "right",
          backgroundEnabled: true,
          backgroundColor: "#020817",
          backgroundOpacity: 0.76,
          padding: 10,
          borderEnabled: true,
          borderColor: "#38bdf8",
          borderRadius: 12,
          style: { strokeColor: "#ffffff", fillColor: "#ffffff", strokeWidth: 2, opacity: 1 },
          createdAt: 1
        } as Drawable
      ],
      width: 800,
      height: 600,
      pixelRatio: 1
    });

    expect(plan.drawables[0]).toMatchObject({
      type: "text",
      text: "Trade review\nKey level",
      fontWeight: "bold",
      backgroundEnabled: true,
      borderEnabled: true
    });
  });

  it("prepares an export plan for the all-drawable-types fixture without crashing", () => {
    const parsed = parseSessionJson(JSON.stringify(allDrawableTypesSession));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const plan = prepareAnnotationExportPlan({
      drawables: parsed.session.drawings,
      width: 1366,
      height: 768,
      pixelRatio: 1
    });

    expect(plan.ignoredDrawables).toBe(0);
    expect(plan.drawables).toHaveLength(parsed.session.drawings.length);
    expect(plan.drawables[0]?.id).toBe(parsed.session.drawings[0]?.id);
    expect(plan.drawables[plan.drawables.length - 1]?.id).toBe(parsed.session.drawings[parsed.session.drawings.length - 1]?.id);
  });
});
