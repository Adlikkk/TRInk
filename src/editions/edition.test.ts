import { describe, expect, it } from "vitest";
import {
  getEdition,
  getEditionCategoryOrder,
  getEditionTools,
  isToolAllowedInEdition,
  normalizeEditionFavoriteTools,
  normalizeEditionTool
} from "./edition";

describe("edition config", () => {
  it("defines a simplified basic edition", () => {
    const basic = getEdition("basic");
    expect(basic.defaultTool).toBe("select");
    expect(basic.availableModes).toEqual(["basic"]);
    expect(basic.features.timer).toBe(false);
    expect(basic.features.quickSessionActions).toBe(false);
    expect(getEditionCategoryOrder(basic)).toEqual(["basic"]);
    expect(getEditionTools(basic).map((tool) => tool.id)).toEqual([
      "select",
      "pen",
      "line",
      "highlighter",
      "arrow",
      "rectangle",
      "eraser"
    ]);
  });

  it("excludes trading-only tools from the basic edition", () => {
    const basic = getEdition("basic");
    expect(isToolAllowedInEdition("fvg", basic)).toBe(false);
    expect(isToolAllowedInEdition("trend", basic)).toBe(false);
    expect(normalizeEditionTool("fvg", basic)).toBe("select");
    expect(normalizeEditionFavoriteTools(["fvg", "pen", "trend", "line"], basic)).toEqual(["pen", "line"]);
  });

  it("preserves the current full trading edition surface", () => {
    const trading = getEdition("trading");
    expect(trading.features.timer).toBe(true);
    expect(trading.features.quickSessionActions).toBe(true);
    expect(isToolAllowedInEdition("fvg", trading)).toBe(true);
    expect(isToolAllowedInEdition("andrews_pitchfork", trading)).toBe(true);
  });
});
