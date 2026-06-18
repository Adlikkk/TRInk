import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Basic input behavior wiring", () => {
  const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
  const canvasSource = readFileSync(new URL("./CanvasSurface.tsx", import.meta.url), "utf8");

  it("wires Basic cancel behavior back to explicit path", () => {
    expect(appSource).toContain('onInteractionEnd={(type, tool)');
    expect(appSource).toContain('sendOverlayCommand({ type: "activate-basic-edit-mode" })');
    expect(canvasSource).toContain('onInteractionEnd?.("cancel", currentTool as ToolKind);');
  });

  it("keeps tool-switch cancellation and external cancel command handling in the canvas surface", () => {
    expect(canvasSource).toContain('if (prev !== state.activeTool && sessionRef.current) {');
    expect(canvasSource).toContain('if (cancelActiveDrawingSignal !== undefined && cancelActiveDrawingSignal > 0) {');
  });



  it("verifies Basic logging exists for input mode", () => {
    expect(appSource).toContain('[TRInk Basic Input] activeTool=');
    expect(canvasSource).toContain('[TRInk Basic Input] pointer inside toolbar bounds=true');
  });
});
