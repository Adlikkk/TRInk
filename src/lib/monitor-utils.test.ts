import type { Monitor } from "@tauri-apps/api/window";
import { describe, expect, it } from "vitest";
import { createMonitorOptions, getDesktopBounds, resolveTargetMonitor } from "./monitor-utils";

const monitorA = {
  name: "Main",
  position: { x: 0, y: 0 },
  size: { width: 1920, height: 1080 },
  workArea: { position: { x: 0, y: 0 }, size: { width: 1920, height: 1040 } },
  scaleFactor: 1
} as unknown as Monitor;

const monitorB = {
  name: "Secondary",
  position: { x: 1920, y: 0 },
  size: { width: 2560, height: 1440 },
  workArea: { position: { x: 1920, y: 0 }, size: { width: 2560, height: 1400 } },
  scaleFactor: 1
} as unknown as Monitor;

describe("monitor utils", () => {
  it("creates Auto and numbered monitor options", () => {
    const options = createMonitorOptions([monitorA, monitorB], monitorA);
    expect(options.map((option) => option.id)).toEqual(["auto", "monitor-1", "monitor-2"]);
    expect(options[1].label).toContain("Monitor 1");
  });

  it("resolves a selected monitor id safely", () => {
    const options = createMonitorOptions([monitorA, monitorB], monitorA);
    expect(resolveTargetMonitor("monitor-2", options)?.name).toBe("Secondary");
    expect(resolveTargetMonitor("auto", options)?.name).toBe("Main");
  });

  it("computes virtual desktop bounds across monitors", () => {
    const bounds = getDesktopBounds([monitorA, monitorB]);
    expect(bounds).toEqual({ x: 0, y: 0, width: 4480, height: 1400 });
  });
});
