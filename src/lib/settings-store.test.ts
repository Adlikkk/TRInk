import { describe, expect, it } from "vitest";
import { clampToolbarPosition, normalizeSettings, normalizeSettingsForEdition } from "./settings-store";
import { buildDefaultShortcutBindings } from "./shortcuts";

describe("settings normalization", () => {
  it("migrates invalid values back to defaults", () => {
    const normalized = normalizeSettings({
      defaultColor: "",
      strokeWidth: 999,
      opacity: -1,
      toolbarOpacity: 5,
      toolbarSize: "massive",
      favoriteTools: ["pen", "missing_tool", "pen"],
      defaultTool: "bad",
      toolMode: "weird",
      defaultMode: "broken",
      toolbarPosition: { x: -500, y: -500 },
      drawingTargetMonitor: "saturn",
      showCursorHints: "yes",
      showPatternLabels: 123,
      timerVisible: "sometimes",
      timerDurationMs: -5,
      timerPreset: "30m",
      timerSize: "huge",
      timerOpacity: 99,
      welcomeDismissed: "later",
      recentTools: ["select", "expiry_line", "missing_tool", "fvg"],
      shortcuts: [
        { action: "toggle_overlay", accelerator: "Space", enabled: true },
        { action: "pen_tool", accelerator: "Ctrl+Shift+P", enabled: true },
        { action: "arrow_tool", accelerator: "Ctrl+Shift+P", enabled: true },
        { action: "expiry_tool", accelerator: "Ctrl+Shift+Q", enabled: true }
      ]
    });

    expect(normalized.defaultColor).toBe("#3B82F6");
    expect(normalized.strokeWidth).toBe(12);
    expect(normalized.opacity).toBe(0.1);
    expect(normalized.toolbarOpacity).toBe(1);
    expect(normalized.toolbarSize).toBe("compact");
    expect(normalized.favoriteTools).toEqual(["pen"]);
    expect(normalized.defaultTool).toBe("select");
    expect(normalized.toolMode).toBe("basic");
    expect(normalized.defaultMode).toBe("click-through");
    expect(normalized.drawingTargetMonitor).toBe("auto");
    expect(normalized.showCursorHints).toBe(true);
    expect(normalized.showPatternLabels).toBe(true);
    expect(normalized.timerVisible).toBe(false);
    expect(normalized.timerDurationMs).toBe(1_000);
    expect(normalized.timerPreset).toBe("1m");
    expect(normalized.timerSize).toBe("compact");
    expect(normalized.timerOpacity).toBe(1);
    expect(normalized.welcomeDismissed).toBe(false);
    expect(normalized.recentTools).toEqual(["select", "fvg"]);
    expect(normalized.shortcuts.find((binding) => binding.action === "toggle_overlay")?.accelerator).toBe(
      "Ctrl+Shift+Space"
    );
    expect(normalized.shortcuts.find((binding) => binding.action === "arrow_tool")?.enabled).toBe(false);
    expect(normalized.toolbarPosition.x).toBeGreaterThanOrEqual(12);
  });

  it("demotes legacy expiry from promoted settings", () => {
    const normalized = normalizeSettings({
      defaultTool: "expiry_line",
      favoriteTools: ["pen", "expiry_line", "arrow"],
      recentTools: ["pen", "expiry_line", "arrow"]
    });

    expect(normalized.defaultTool).toBe("select");
    expect(normalized.favoriteTools).toEqual(["pen", "arrow"]);
    expect(normalized.recentTools).toEqual(["pen", "arrow"]);
  });

  it("falls back to grouped compact defaults when favorites are missing", () => {
    const normalized = normalizeSettings({});
    expect(normalized.favoriteTools).toEqual([
      "select",
      "pen",
      "arrow",
      "rectangle",
      "trend",
      "channel",
      "horizontal_line",
      "fvg"
    ]);
    expect(normalized.defaultTool).toBe("select");
    expect(normalized.defaultMode).toBe("click-through");
    expect(normalized.shortcuts).toEqual(buildDefaultShortcutBindings());
    expect(normalized.welcomeDismissed).toBe(false);
    expect(normalized.overlayDebugBounds).toBe(false);
    expect(normalized.returnToSelectAfterDraw).toBe(true);
    expect(normalized.checkForUpdates).toBe(false);
  });

  it("preserves first-run dismissal when stored", () => {
    const normalized = normalizeSettings({ welcomeDismissed: true });
    expect(normalized.welcomeDismissed).toBe(true);
  });

  it("preserves overlayDebugBounds and returnToSelectAfterDraw when stored", () => {
    const normalized = normalizeSettings({ overlayDebugBounds: true, returnToSelectAfterDraw: false });
    expect(normalized.overlayDebugBounds).toBe(true);
    expect(normalized.returnToSelectAfterDraw).toBe(false);
  });

  it("normalizes invalid overlayDebugBounds back to default", () => {
    const normalized = normalizeSettings({ overlayDebugBounds: "yes" });
    expect(normalized.overlayDebugBounds).toBe(false);
  });

  it("clamps toolbar position to the visible viewport", () => {
    const position = clampToolbarPosition({ x: 9999, y: 9999 }, { width: 800, height: 600 });
    expect(position.x).toBeLessThanOrEqual(28);
    expect(position.y).toBeLessThanOrEqual(512);
  });

  it("supports a virtual desktop with negative monitor coordinates", () => {
    const position = clampToolbarPosition(
      { x: -9999, y: 60 },
      { x: -1920, y: 0, width: 3840, height: 1080 },
      { width: 760, height: 76 }
    );
    expect(position.x).toBe(-1908);
    expect(position.y).toBe(60);
  });

  it("keeps cleared shortcuts disabled", () => {
    const normalized = normalizeSettings({
      shortcuts: [{ action: "eraser_tool", accelerator: null, enabled: false }]
    });

    expect(normalized.shortcuts.find((binding) => binding.action === "eraser_tool")).toMatchObject({
      accelerator: null,
      enabled: false
    });
  });

  it("sanitizes trading-only settings when running the basic edition", () => {
    const normalized = normalizeSettingsForEdition(
      {
        defaultTool: "fvg",
        favoriteTools: ["fvg", "pen", "trend", "line"],
        recentTools: ["fvg", "line", "pen"],
        toolMode: "trading",
        timerVisible: true,
        checkForUpdates: true,
        shortcuts: [
          { action: "timer_toggle", accelerator: "Ctrl+Shift+1", enabled: true },
          { action: "save_session", accelerator: "Ctrl+Shift+S", enabled: true }
        ]
      },
      "basic"
    );

    expect(normalized.defaultTool).toBe("select");
    expect(normalized.defaultMode).toBe("click-through");
    expect(normalized.toolMode).toBe("basic");
    expect(normalized.favoriteTools).toEqual(["pen", "line"]);
    expect(normalized.recentTools).toEqual(["line", "pen"]);
    expect(normalized.timerVisible).toBe(false);
    expect(normalized.checkForUpdates).toBe(false);
    expect(normalized.shortcuts.find((binding) => binding.action === "timer_toggle")).toMatchObject({
      accelerator: null,
      enabled: false
    });
    expect(normalized.shortcuts.find((binding) => binding.action === "save_session")).toMatchObject({
      accelerator: null,
      enabled: false
    });
  });

  it("forces Basic startup back to Select + click-through", () => {
    const normalized = normalizeSettingsForEdition(
      {
        defaultTool: "pen",
        defaultMode: "draw",
        toolMode: "trading",
        showCursorHints: true
      },
      "basic"
    );

    expect(normalized.defaultTool).toBe("select");
    expect(normalized.defaultMode).toBe("click-through");
    expect(normalized.toolMode).toBe("basic");
    expect(normalized.showCursorHints).toBe(false);
  });

  it("auto-dismisses the welcome card for pre-v8 settings migrations", () => {
    const normalized = normalizeSettingsForEdition({ settingsVersion: 7, welcomeDismissed: false }, "basic");
    expect(normalized.welcomeDismissed).toBe(true);
  });
});
