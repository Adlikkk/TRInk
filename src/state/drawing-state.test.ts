import { describe, expect, it } from "vitest";
import type { Drawable } from "../types/drawables";
import { createInitialDrawingState, drawingReducer } from "./drawing-state";

const drawable: Drawable = {
  id: "a",
  type: "arrow",
  start: { x: 10, y: 10 },
  end: { x: 50, y: 50 },
  style: { strokeColor: "#fff", fillColor: "#fff", strokeWidth: 2, opacity: 1 },
  createdAt: 1
};

describe("drawingReducer", () => {
  it("supports undo and redo across commits", () => {
    const initial = createInitialDrawingState("pen", "basic", { x: 24, y: 24 });
    const committed = drawingReducer(initial, { type: "commit", drawable });
    const undone = drawingReducer(committed, { type: "undo" });
    const redone = drawingReducer(undone, { type: "redo" });

    expect(committed.drawables).toHaveLength(1);
    expect(undone.drawables).toHaveLength(0);
    expect(redone.drawables).toHaveLength(1);
    expect(redone.drawables[0].id).toBe("a");
  });

  it("deletes the selected drawable safely", () => {
    const initial = createInitialDrawingState("pen", "basic", { x: 24, y: 24 });
    const committed = drawingReducer(initial, { type: "commit", drawable });
    const selected = drawingReducer(committed, { type: "select-drawable", id: "a" });
    const deleted = drawingReducer(selected, { type: "delete-selected" });

    expect(deleted.drawables).toHaveLength(0);
    expect(deleted.selectedDrawableId).toBeNull();
    expect(deleted.undoStack).toHaveLength(2);
  });

  it("tracks dirty state across save and session load", () => {
    const initial = createInitialDrawingState("pen", "basic", { x: 24, y: 24 });
    const committed = drawingReducer(initial, { type: "commit", drawable });
    const saved = drawingReducer(committed, {
      type: "mark-saved",
      name: "Morning setup",
      path: "C:\\sessions\\morning.trink.json",
      createdAt: "2026-05-21T12:00:00.000Z"
    });
    const loaded = drawingReducer(saved, {
      type: "load-session",
      drawables: [],
      name: "Empty chart",
      path: "C:\\sessions\\empty.trink.json",
      createdAt: "2026-05-21T13:00:00.000Z"
    });

    expect(committed.isDirty).toBe(true);
    expect(saved.isDirty).toBe(false);
    expect(saved.currentSessionName).toBe("Morning setup");
    expect(saved.sessionCreatedAt).toBe("2026-05-21T12:00:00.000Z");
    expect(loaded.isDirty).toBe(false);
    expect(loaded.currentSessionName).toBe("Empty chart");
    expect(loaded.undoStack).toHaveLength(0);
  });

  it("commits selected-object edits as a single undoable history step", () => {
    const initial = createInitialDrawingState("select", "basic", { x: 24, y: 24 });
    const committed = drawingReducer(initial, { type: "commit", drawable });
    const edited = drawingReducer(committed, {
      type: "replace-selected-drawable",
      drawable: {
        ...drawable,
        end: { x: 80, y: 30 }
      }
    });
    const undone = drawingReducer(edited, { type: "undo" });

    expect(edited.drawables[0]).toMatchObject({ end: { x: 80, y: 30 } });
    expect(edited.undoStack).toHaveLength(2);
    expect(undone.drawables[0]).toMatchObject({ end: { x: 50, y: 50 } });
  });

  it("supports selected ordering changes with undo and redo", () => {
    const initial = createInitialDrawingState("select", "basic", { x: 24, y: 24 });
    const first = drawingReducer(initial, { type: "commit", drawable: { ...drawable, id: "a" } });
    const second = drawingReducer(first, {
      type: "commit",
      drawable: { ...drawable, id: "b", start: { x: 12, y: 12 }, end: { x: 60, y: 60 } }
    });
    const selected = drawingReducer(second, { type: "select-drawable", id: "a" });
    const reordered = drawingReducer(selected, { type: "reorder-selected", direction: "front" });
    const undone = drawingReducer(reordered, { type: "undo" });
    const redone = drawingReducer(undone, { type: "redo" });

    expect(reordered.drawables.map((entry) => entry.id)).toEqual(["b", "a"]);
    expect(undone.drawables.map((entry) => entry.id)).toEqual(["a", "b"]);
    expect(redone.drawables.map((entry) => entry.id)).toEqual(["b", "a"]);
  });

  it("locks selected objects and prevents delete until unlocked", () => {
    const initial = createInitialDrawingState("select", "basic", { x: 24, y: 24 });
    const committed = drawingReducer(initial, { type: "commit", drawable });
    const selected = drawingReducer(committed, { type: "select-drawable", id: "a" });
    const locked = drawingReducer(selected, { type: "set-selected-locked", locked: true });
    const blockedDelete = drawingReducer(locked, { type: "delete-selected" });
    const unlocked = drawingReducer(locked, { type: "set-selected-locked", locked: false });
    const deleted = drawingReducer(unlocked, { type: "delete-selected" });

    expect(locked.drawables[0]?.locked).toBe(true);
    expect(blockedDelete.drawables).toHaveLength(1);
    expect(deleted.drawables).toHaveLength(0);
  });
});
