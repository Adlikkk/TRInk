import { describe, expect, it } from "vitest";
import type { OverlayCommand, SessionNotice, ToolbarSnapshot } from "./window-protocol";

describe("window protocol", () => {
  it("supports monitor-safe overlay commands", () => {
    const command: OverlayCommand = { type: "set-click-through", enabled: true };
    expect(command.type).toBe("set-click-through");
  });

  it("supports export commands from the toolbar", () => {
    const command: OverlayCommand = { type: "export-annotations-png" };
    expect(command.type).toBe("export-annotations-png");
  });

  it("supports timer commands from the toolbar", () => {
    const command: OverlayCommand = { type: "set-timer-duration", durationMs: 300_000, preset: "5m" };
    expect(command.type).toBe("set-timer-duration");
  });

  it("supports timer toggle commands for shortcut handling", () => {
    const visibilityCommand: OverlayCommand = { type: "toggle-timer-visible" };
    const playbackCommand: OverlayCommand = { type: "toggle-timer-start-pause" };
    expect(visibilityCommand.type).toBe("toggle-timer-visible");
    expect(playbackCommand.type).toBe("toggle-timer-start-pause");
  });

  it("supports selected object update commands", () => {
    const command: OverlayCommand = {
      type: "update-selected-object",
      id: "shape-1",
      patch: { strokeWidth: 5 }
    };
    expect(command.type).toBe("update-selected-object");
  });

  it("supports selected object ordering and locking commands", () => {
    const lockCommand: OverlayCommand = { type: "set-selected-locked", locked: true };
    const orderCommand: OverlayCommand = { type: "reorder-selected", direction: "front" };
    expect(lockCommand.type).toBe("set-selected-locked");
    expect(orderCommand.type).toBe("reorder-selected");
  });

  it("keeps toolbar snapshot shape minimal", () => {
    const snapshot: ToolbarSnapshot = {
      activeTool: "pen",
      toolMode: "basic",
      hidden: false,
      overlayMode: "draw",
      overlayVisible: true,
      canUndo: false,
      canRedo: false,
      currentSessionName: "Untitled session",
      isDirty: false,
      selectedObject: null,
      timer: {
        visible: true,
        status: "idle",
        durationMs: 60_000,
        remainingMs: 60_000,
        position: { x: 24, y: 24 },
        size: "compact",
        opacity: 0.9,
        preset: "1m"
      }
    };

    expect(snapshot.overlayVisible).toBe(true);
    expect(snapshot.timer.visible).toBe(true);
  });

  it("supports session notices from the overlay", () => {
    const notice: SessionNotice = { status: "success", message: "Session saved." };
    expect(notice.status).toBe("success");
  });
});
