import { describe, expect, it } from "vitest";
import { shouldRenderPersistentCursorHint } from "./CanvasSurface";
import { getToolbarWindowSize } from "../lib/window-layout";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Basic UI polish guards", () => {
  it("disables persistent cursor hints when the Basic edition gates them off", () => {
    expect(shouldRenderPersistentCursorHint(false, true, true)).toBe(false);
    expect(shouldRenderPersistentCursorHint(true, true, true)).toBe(true);
  });

  it("uses a smaller compact toolbar footprint for Basic", () => {
    expect(getToolbarWindowSize("compact", "compact", "basic").width).toBeLessThan(
      getToolbarWindowSize("compact", "compact", "trading").width
    );
  });

  it("toolbar does not show warning dot unconditionally", () => {
    const source = readFileSync(resolve(__dirname, "Toolbar.tsx"), "utf-8");
    expect(source).toContain('{edition.id !== "basic" && snapshot.isDirty');
  });

  it("toolbar does not show shortcut warning pill for Basic", () => {
    const source = readFileSync(resolve(__dirname, "Toolbar.tsx"), "utf-8");
    expect(source).toContain('{edition.id !== "basic" && unavailableShortcutCount > 0 ?');
  });

  it("toolbar has a basic-only Quit button", () => {
    const source = readFileSync(resolve(__dirname, "Toolbar.tsx"), "utf-8");
    expect(source).toContain('{edition.id === "basic" ? (');
    expect(source).toContain('onClick={onQuit}');
    expect(source).toContain('title="Quit TRInk Basic"');
  });

  it("does not include the text tool in the basic edition", async () => {
    const { basicEdition } = await import("../editions/basic");
    const { getEditionToolbarToolIds } = await import("../editions/ui");
    
    expect(basicEdition.visibleToolIds).not.toContain("text");
    expect(basicEdition.defaultFavoriteTools).not.toContain("text");
    expect(getEditionToolbarToolIds(basicEdition)).not.toContain("text");
  });
});
