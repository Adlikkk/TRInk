import { describe, expect, it } from "vitest";
import type { Drawable } from "../types/drawables";
import allDrawableTypesSession from "../test-fixtures/sessions/all-drawable-types-session.json";
import futureSchemaSession from "../test-fixtures/sessions/future-schema-session.json";
import legacyExpiryCompatSession from "../test-fixtures/sessions/legacy-expiry-compat-session.json";
import malformedDrawablesSession from "../test-fixtures/sessions/malformed-drawables-session.json";
import styledTextSession from "../test-fixtures/sessions/styled-text-session.json";
import {
  buildDefaultSessionFilename,
  createSessionPayload,
  getSessionNameFromPath,
  parseSessionJson,
  serializeSession
} from "./session-format";

const drawable: Drawable = {
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

describe("session format", () => {
  it("serializes and parses a valid session", () => {
    const session = createSessionPayload({
      name: "Morning markup",
      drawings: [drawable],
      drawingTargetMonitor: "monitor-1",
      canvasWidth: 1920,
      canvasHeight: 1080
    });

    const parsed = parseSessionJson(serializeSession(session));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.session.name).toBe("Morning markup");
    expect(parsed.session.drawings).toHaveLength(1);
    expect(parsed.session.drawings[0]).toMatchObject({
      type: "qm_bearish",
      points: [
        { x: 20, y: 60 },
        { x: 60, y: 120 },
        { x: 120, y: 20 },
        { x: 180, y: 140 },
        { x: 220, y: 80 }
      ]
    });
    expect(parsed.ignoredDrawables).toBe(0);
    expect("timer" in session).toBe(false);
  });

  it("rejects invalid json and unsupported schema versions", () => {
    expect(parseSessionJson("{not-json").ok).toBe(false);
    expect(parseSessionJson(JSON.stringify(futureSchemaSession)).ok).toBe(false);
  });

  it("ignores malformed drawables safely", () => {
    const parsed = parseSessionJson(
      JSON.stringify({
        schemaVersion: 1,
        appVersion: "0.2.1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        name: "Mixed",
        drawings: [drawable, { id: "bad", type: "arrow" }]
      })
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.session.drawings).toHaveLength(1);
    expect(parsed.ignoredDrawables).toBe(1);
  });

  it("loads legacy vertical markers from older sessions without crashing", () => {
    const parsed = parseSessionJson(JSON.stringify(legacyExpiryCompatSession));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.session.drawings).toHaveLength(1);
    expect(parsed.session.drawings[0]).toMatchObject({
      type: "binary_marker",
      markerType: "expiry_line"
    });
  });

  it("formats file names and derives display names from paths", () => {
    const name = buildDefaultSessionFilename(new Date(2026, 4, 21, 9, 7));
    expect(name).toBe("TRInk-session-2026-05-21-09-07.trink.json");
    expect(getSessionNameFromPath("C:\\sessions\\London-open.trink.json")).toBe("London-open");
  });

  it("preserves core chart tool drawables in saved sessions", () => {
    const session = createSessionPayload({
      name: "Chart tools",
      drawings: [
        {
          id: "hline-1",
          type: "horizontal_line",
          y: 180,
          label: "Range high",
          style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 0.9 },
          createdAt: 1
        },
        {
          id: "fib-1",
          type: "fibonacci_retracement",
          points: [{ x: 40, y: 220 }, { x: 240, y: 100 }],
          levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618],
          showLabels: true,
          showPercentages: true,
          extendLeft: true,
          extendRight: true,
          style: { strokeColor: "#f59e0b", fillColor: "#f59e0b", strokeWidth: 2, opacity: 0.9 },
          createdAt: 1
        },
        {
          id: "pitchfork-1",
          type: "andrews_pitchfork",
          points: [{ x: 120, y: 40 }, { x: 80, y: 180 }, { x: 220, y: 210 }],
          showLabels: true,
          variant: "schiff",
          showMedianLine: true,
          showOuterLines: false,
          showAnchorLine: true,
          style: { strokeColor: "#10b981", fillColor: "#10b981", strokeWidth: 2, opacity: 0.9 },
          createdAt: 2
        }
      ],
      drawingTargetMonitor: "monitor-1",
      canvasWidth: 1920,
      canvasHeight: 1080
    });

    const parsed = parseSessionJson(serializeSession(session));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.session.drawings).toHaveLength(3);
    expect(parsed.session.drawings[0]).toMatchObject({ type: "horizontal_line", y: 180 });
    expect(parsed.session.drawings[1]).toMatchObject({
      type: "fibonacci_retracement",
      showPercentages: true,
      extendLeft: true,
      extendRight: true
    });
    expect(parsed.session.drawings[2]).toMatchObject({
      type: "andrews_pitchfork",
      variant: "schiff",
      showOuterLines: false,
      showAnchorLine: true
    });
  });

  it("preserves draw order and lock state in sessions", () => {
    const session = createSessionPayload({
      name: "Layered chart",
      drawings: [
        {
          id: "back",
          type: "rectangle",
          start: { x: 20, y: 20 },
          end: { x: 120, y: 120 },
          style: { strokeColor: "#94a3b8", fillColor: "#94a3b8", strokeWidth: 2, opacity: 0.4 },
          createdAt: 1
        },
        {
          id: "front",
          type: "arrow",
          start: { x: 30, y: 30 },
          end: { x: 90, y: 90 },
          style: { strokeColor: "#38bdf8", fillColor: "#38bdf8", strokeWidth: 2, opacity: 1 },
          createdAt: 2,
          locked: true
        }
      ]
    });

    const parsed = parseSessionJson(serializeSession(session));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.session.drawings.map((entry) => entry.id)).toEqual(["back", "front"]);
    expect(parsed.session.drawings[1]).toMatchObject({ locked: true });
  });

  it("preserves styled multiline text in sessions", () => {
    const parsed = parseSessionJson(JSON.stringify(styledTextSession));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.session.drawings[0]).toMatchObject({
      type: "text",
      text: "Review note\nSecond line",
      fontWeight: "bold",
      align: "center",
      backgroundEnabled: true,
      borderEnabled: true
    });
  });

  it("roundtrips all drawable types from a persisted session fixture", () => {
    const parsed = parseSessionJson(JSON.stringify(allDrawableTypesSession));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.ignoredDrawables).toBe(0);
    expect(parsed.session.drawings).toHaveLength(22);
    expect(new Set(parsed.session.drawings.map((entry) => entry.type))).toEqual(
      new Set([
        "freehand",
        "arrow",
        "rectangle",
        "text",
        "trend",
        "channel",
        "support_resistance_zone",
        "binary_marker",
        "qm_bullish",
        "qm_bearish",
        "bos",
        "choch",
        "fvg",
        "liquidity_sweep",
        "horizontal_line",
        "vertical_marker",
        "ray",
        "fibonacci_retracement",
        "fibonacci_fan",
        "andrews_pitchfork"
      ])
    );

    const serialized = serializeSession(parsed.session);
    const reparsed = parseSessionJson(serialized);
    expect(reparsed.ok).toBe(true);
    if (!reparsed.ok) {
      return;
    }

    expect(reparsed.session.drawings.map((entry) => entry.id)).toEqual(parsed.session.drawings.map((entry) => entry.id));
  });

  it("loads malformed fixtures safely and keeps valid entries", () => {
    const parsed = parseSessionJson(JSON.stringify(malformedDrawablesSession));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    expect(parsed.ignoredDrawables).toBe(2);
    expect(parsed.session.drawings).toHaveLength(1);
    expect(parsed.session.drawings[0]).toMatchObject({ id: "good-arrow", type: "arrow" });
  });
});
