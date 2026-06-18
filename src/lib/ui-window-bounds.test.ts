import { describe, expect, it } from "vitest";
import {
  isScreenPointInsideAnyUiWindowBounds,
  isScreenPointInsideUiWindowBounds,
  type UiWindowBounds
} from "./ui-window-bounds";

describe("ui window bounds", () => {
  const toolbarBounds: UiWindowBounds = {
    source: "toolbar",
    x: 100,
    y: 80,
    width: 300,
    height: 60
  };

  it("detects a screen point inside one UI window", () => {
    expect(isScreenPointInsideUiWindowBounds(120, 100, toolbarBounds)).toBe(true);
    expect(isScreenPointInsideUiWindowBounds(50, 100, toolbarBounds)).toBe(false);
  });

  it("detects a screen point inside any active UI window", () => {
    const settingsBounds: UiWindowBounds = {
      source: "settings",
      x: 500,
      y: 100,
      width: 320,
      height: 400
    };

    expect(isScreenPointInsideAnyUiWindowBounds(520, 130, [toolbarBounds, settingsBounds])).toBe(true);
    expect(isScreenPointInsideAnyUiWindowBounds(20, 20, [toolbarBounds, settingsBounds])).toBe(false);
  });
});
