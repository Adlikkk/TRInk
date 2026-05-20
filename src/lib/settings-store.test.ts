import { describe, expect, it } from "vitest";
import { clampToolbarPosition, normalizeSettings } from "./settings-store";

describe("settings normalization", () => {
  it("migrates invalid values back to defaults", () => {
    const normalized = normalizeSettings({
      defaultColor: "",
      strokeWidth: 999,
      opacity: -1,
      toolbarOpacity: 5,
      favoriteTools: ["pen", "missing_tool", "pen"],
      defaultTool: "bad",
      toolMode: "weird",
      defaultMode: "broken",
      toolbarPosition: { x: -500, y: -500 }
    });

    expect(normalized.defaultColor).toBe("#3B82F6");
    expect(normalized.strokeWidth).toBe(12);
    expect(normalized.opacity).toBe(0.1);
    expect(normalized.toolbarOpacity).toBe(1);
    expect(normalized.favoriteTools).toEqual(["pen"]);
    expect(normalized.defaultTool).toBe("pen");
    expect(normalized.toolMode).toBe("basic");
    expect(normalized.defaultMode).toBe("draw");
    expect(normalized.toolbarPosition.x).toBeGreaterThanOrEqual(12);
  });

  it("clamps toolbar position to the visible viewport", () => {
    const position = clampToolbarPosition({ x: 9999, y: 9999 }, { width: 800, height: 600 });
    expect(position.x).toBeLessThanOrEqual(428);
    expect(position.y).toBeLessThanOrEqual(228);
  });
});
