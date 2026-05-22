import { describe, expect, it } from "vitest";
import {
  canFavoriteTool,
  getToolMode,
  isToolKind,
  normalizeFavoriteTools,
  registerRecentTool,
  TOOL_CATEGORY_ORDER,
  TOOL_DEFINITIONS
} from "./tool-definitions";

describe("tool definitions", () => {
  it("does not expose expiry as a user-facing tool", () => {
    expect(TOOL_DEFINITIONS.some((tool) => tool.id === "expiry_line")).toBe(false);
  });

  it("includes the core chart tools pack in user-facing tool definitions", () => {
    expect(TOOL_DEFINITIONS.some((tool) => tool.id === "horizontal_line")).toBe(true);
    expect(TOOL_DEFINITIONS.some((tool) => tool.id === "vertical_marker")).toBe(true);
    expect(TOOL_DEFINITIONS.some((tool) => tool.id === "ray")).toBe(true);
    expect(TOOL_DEFINITIONS.some((tool) => tool.id === "fibonacci_retracement")).toBe(true);
    expect(TOOL_DEFINITIONS.some((tool) => tool.id === "fibonacci_fan")).toBe(true);
    expect(TOOL_DEFINITIONS.some((tool) => tool.id === "andrews_pitchfork")).toBe(true);
  });

  it("assigns every user-facing tool to a category", () => {
    expect(TOOL_CATEGORY_ORDER).toEqual(["basic", "chart", "price-action", "binary-utility"]);
    expect(TOOL_DEFINITIONS.every((tool) => TOOL_CATEGORY_ORDER.includes(tool.category))).toBe(true);
    expect(TOOL_DEFINITIONS.every((tool) => tool.description.length > 0)).toBe(true);
  });

  it("keeps legacy expiry compatible but not selectable", () => {
    expect(isToolKind("expiry_line")).toBe(true);
    expect(canFavoriteTool("expiry_line")).toBe(false);
    expect(getToolMode("expiry_line")).toBe("binary");
  });

  it("normalizes favorites and recent tools to user-facing entries only", () => {
    expect(normalizeFavoriteTools(["pen", "expiry_line", "pen", "fvg"])).toEqual(["pen", "fvg"]);
    expect(registerRecentTool(["pen", "arrow"], "expiry_line")).toEqual(["pen", "arrow"]);
    expect(registerRecentTool(["pen", "arrow"], "fvg")).toEqual(["fvg", "pen", "arrow"]);
  });
});
