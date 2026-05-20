import { describe, expect, it } from "vitest";
import type { Drawable } from "../types/drawables";
import { sanitizeDrawable } from "./drawable-validation";

describe("drawable validation", () => {
  it("rejects malformed freehand drawables", () => {
    const invalid = {
      id: "bad",
      type: "freehand",
      tool: "pen",
      points: [{ x: 10, y: 10 }],
      style: { strokeColor: "#fff", strokeWidth: 2, opacity: 1 },
      createdAt: 1
    } as Drawable;

    expect(sanitizeDrawable(invalid)).toBeNull();
  });

  it("normalizes a valid text drawable", () => {
    const valid = {
      id: "text",
      type: "text",
      point: { x: 10, y: 10 },
      text: "  Note  ",
      fontSize: 18,
      style: { strokeColor: "#fff", fillColor: "#fff", strokeWidth: 2, opacity: 1 },
      createdAt: 1
    } as Drawable;

    const sanitized = sanitizeDrawable(valid);
    expect(sanitized?.type).toBe("text");
    if (sanitized?.type === "text") {
      expect(sanitized.text).toBe("Note");
    }
  });
});
