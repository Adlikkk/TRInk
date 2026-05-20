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
});
