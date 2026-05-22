import { describe, expect, it } from "vitest";
import {
  buildDefaultShortcutBindings,
  captureShortcutFromKeyboardEvent,
  formatAcceleratorForDisplay,
  getShortcutToolAction,
  normalizeAcceleratorString,
  normalizeShortcutBindings,
  SHORTCUT_DEFINITIONS
} from "./shortcuts";

describe("shortcut definitions", () => {
  it("includes the expected default actions", () => {
    expect(SHORTCUT_DEFINITIONS.some((definition) => definition.action === "toggle_overlay")).toBe(true);
    expect(SHORTCUT_DEFINITIONS.some((definition) => definition.action === "eraser_tool")).toBe(true);
    expect(SHORTCUT_DEFINITIONS.some((definition) => definition.action === "timer_reset")).toBe(true);
  });

  it("does not expose any expiry shortcut action", () => {
    expect(SHORTCUT_DEFINITIONS.some((definition) => definition.action.includes("expiry"))).toBe(false);
  });
});

describe("shortcut normalization", () => {
  it("provides stable defaults", () => {
    const defaults = buildDefaultShortcutBindings();
    expect(defaults.find((binding) => binding.action === "toggle_overlay")?.accelerator).toBe("Ctrl+Shift+Space");
    expect(defaults.find((binding) => binding.action === "save_session")?.enabled).toBe(false);
  });

  it("rejects malformed accelerators", () => {
    expect(normalizeAcceleratorString("P")).toBe(null);
    expect(normalizeAcceleratorString("Ctrl+Shift+Banana")).toBe(null);
    expect(normalizeAcceleratorString("Ctrl+Shift+P")).toBe("Ctrl+Shift+P");
  });

  it("disables duplicate accelerators safely", () => {
    const normalized = normalizeShortcutBindings([
      { action: "pen_tool", accelerator: "Ctrl+Shift+P", enabled: true },
      { action: "arrow_tool", accelerator: "Ctrl+Shift+P", enabled: true }
    ]);

    expect(normalized.find((binding) => binding.action === "pen_tool")).toMatchObject({
      accelerator: "Ctrl+Shift+P",
      enabled: true
    });
    expect(normalized.find((binding) => binding.action === "arrow_tool")).toMatchObject({
      accelerator: null,
      enabled: false
    });
  });

  it("drops unknown actions", () => {
    const normalized = normalizeShortcutBindings([
      { action: "toggle_overlay", accelerator: "Ctrl+Shift+Space", enabled: true },
      { action: "expiry_tool", accelerator: "Ctrl+Shift+E", enabled: true }
    ]);

    expect(normalized.some((binding) => binding.action === "toggle_overlay")).toBe(true);
    expect(normalized.some((binding) => (binding as { action: string }).action === "expiry_tool")).toBe(false);
  });
});

describe("shortcut helpers", () => {
  it("maps user-facing tools to shortcut actions", () => {
    expect(getShortcutToolAction("pen")).toBe("pen_tool");
    expect(getShortcutToolAction("trend")).toBe(undefined);
  });

  it("formats accelerators for display", () => {
    expect(formatAcceleratorForDisplay("Ctrl+Shift+Space")).toBe("Ctrl+Shift+Space");
    expect(formatAcceleratorForDisplay(null)).toBe("Disabled");
  });

  it("captures a valid keyboard shortcut", () => {
    const event = {
      key: "P",
      code: "KeyP",
      ctrlKey: true,
      altKey: false,
      shiftKey: true,
      metaKey: false
    } as KeyboardEvent;

    expect(captureShortcutFromKeyboardEvent(event)).toEqual({
      type: "captured",
      accelerator: "Ctrl+Shift+P"
    });
  });
});
