import { describe, expect, it } from "vitest";
import type { Drawable } from "../types/drawables";
import allDrawableTypesSession from "../test-fixtures/sessions/all-drawable-types-session.json";
import {
  buildDefaultAnnotationsJsonFilename,
  buildDefaultAnnotationsPngFilename,
  createAnnotationsExportPayload,
  serializeAnnotationsExport,
  validateAnnotationsExportPayload
} from "./export-format";
import { parseSessionJson } from "./session-format";

const drawable: Drawable = {
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

describe("export format", () => {
  it("builds timestamped export filenames", () => {
    const date = new Date(2026, 4, 21, 9, 7);
    expect(buildDefaultAnnotationsPngFilename(date)).toBe("TRInk-annotations-2026-05-21-09-07.png");
    expect(buildDefaultAnnotationsJsonFilename(date)).toBe("TRInk-annotations-2026-05-21-09-07.json");
  });

  it("serializes a sanitized annotations export payload", () => {
    const result = createAnnotationsExportPayload({
      name: "London open",
      drawings: [drawable]
    });

    const validated = validateAnnotationsExportPayload(JSON.parse(serializeAnnotationsExport(result.payload)));
    expect(validated.ok).toBe(true);
    if (!validated.ok) {
      return;
    }

    expect(validated.payload.name).toBe("London open");
    expect(validated.payload.drawings).toHaveLength(1);
    expect("timer" in result.payload).toBe(false);
  });

  it("ignores malformed drawables and future schemas safely", () => {
    const parsed = validateAnnotationsExportPayload({
      schemaVersion: 1,
      appVersion: "0.2.1",
      exportedAt: "2026-05-21T12:00:00.000Z",
      name: "Mixed export",
      drawings: [drawable, { id: "bad", type: "arrow" }]
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.payload.drawings).toHaveLength(1);
    expect(parsed.ignoredDrawables).toBe(1);
    expect(
      validateAnnotationsExportPayload({
        schemaVersion: 99,
        name: "Future export",
        drawings: []
      }).ok
    ).toBe(false);
  });

  it("preserves ordering and lock metadata in annotation json exports", () => {
    const result = createAnnotationsExportPayload({
      name: "Layered export",
      drawings: [
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
          type: "fibonacci_retracement",
          points: [{ x: 30, y: 220 }, { x: 220, y: 90 }],
          levels: [0, 0.382, 0.618, 1.618],
          showLabels: true,
          showPercentages: true,
          extendLeft: true,
          extendRight: true,
          style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 1 },
          createdAt: 2,
          locked: true
        } as Drawable
      ]
    });

    expect(result.payload.drawings.map((entry) => entry.id)).toEqual(["back", "front"]);
    expect(result.payload.drawings[1]).toMatchObject({
      locked: true,
      type: "fibonacci_retracement",
      levels: [0, 0.382, 0.618, 1.618],
      showPercentages: true,
      extendLeft: true,
      extendRight: true
    });
  });

  it("preserves styled multiline text in annotation json exports", () => {
    const result = createAnnotationsExportPayload({
      name: "Text export",
      drawings: [
        {
          id: "text-1",
          type: "text",
          point: { x: 80, y: 90 },
          text: "Review\nNote",
          fontSize: 20,
          fontWeight: "medium",
          align: "right",
          backgroundEnabled: true,
          backgroundColor: "#020817",
          backgroundOpacity: 0.7,
          padding: 12,
          borderEnabled: true,
          borderColor: "#38bdf8",
          borderRadius: 14,
          style: { strokeColor: "#ffffff", fillColor: "#ffffff", strokeWidth: 2, opacity: 1 },
          createdAt: 1
        } as Drawable
      ]
    });

    expect(result.payload.drawings[0]).toMatchObject({
      type: "text",
      text: "Review\nNote",
      fontWeight: "medium",
      align: "right",
      backgroundEnabled: true,
      borderEnabled: true
    });
  });

  it("roundtrips all drawable types from a session fixture into annotation export json", () => {
    const parsed = parseSessionJson(JSON.stringify(allDrawableTypesSession));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const result = createAnnotationsExportPayload({
      name: "All drawable export",
      drawings: parsed.session.drawings
    });
    const validated = validateAnnotationsExportPayload(JSON.parse(serializeAnnotationsExport(result.payload)));

    expect(validated.ok).toBe(true);
    if (!validated.ok) {
      return;
    }

    expect(validated.ignoredDrawables).toBe(0);
    expect(validated.payload.drawings.map((entry) => entry.id)).toEqual(parsed.session.drawings.map((entry) => entry.id));
    expect("timer" in validated.payload).toBe(false);
  });
});
