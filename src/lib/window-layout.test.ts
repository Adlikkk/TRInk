import { describe, expect, it } from "vitest";
import { getToolbarWindowSize, clampWindowPositionToDesktop } from "./window-layout";

describe("window layout", () => {
  it("returns startup size for startup state", () => {
    expect(getToolbarWindowSize("compact", "startup")).toEqual({ width: 560, height: 96 });
  });

  it("returns notice sizes for compact-notice and normal-notice states", () => {
    expect(getToolbarWindowSize("compact", "compact-notice")).toEqual({ width: 860, height: 116 });
    expect(getToolbarWindowSize("normal", "normal-notice")).toEqual({ width: 1040, height: 128 });
  });

  it("keeps compact and normal closed sizes separate", () => {
    expect(getToolbarWindowSize("compact", "compact")).toEqual({ width: 860, height: 76 });
    expect(getToolbarWindowSize("normal", "normal")).toEqual({ width: 1040, height: 88 });
  });

  it("clamps windows inside a virtual desktop with negative coordinates", () => {
    const position = clampWindowPositionToDesktop(
      { x: 2000, y: -1000 },
      { x: -1920, y: -200, width: 4480, height: 1440 },
      { width: 760, height: 116 },
      { x: 24, y: 24 }
    );

    expect(position.x).toBeLessThanOrEqual(1788);
    expect(position.x).toBeGreaterThanOrEqual(-1908);
    expect(position.y).toBe(-188);
  });
});
