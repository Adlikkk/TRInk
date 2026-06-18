import type { Monitor } from "@tauri-apps/api/window";
import { describe, expect, it } from "vitest";
import {
  createMonitorOptions,
  getDesktopBounds,
  getMonitorFrame,
  getMonitorPhysicalFrame,
  resolveTargetMonitor
} from "./monitor-utils";

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

  it("converts monitor bounds into logical frame values", () => {
    const scaledMonitor = {
      name: "Scaled",
      position: { x: 2880, y: 0 },
      size: { width: 3840, height: 2160 },
      workArea: { position: { x: 2880, y: 0 }, size: { width: 3840, height: 2080 } },
      scaleFactor: 1.5
    } as unknown as Monitor;

    expect(getMonitorFrame(scaledMonitor)).toEqual({
      x: 1920,
      y: 0,
      width: 2560,
      height: 1440
    });
  });

  it("getMonitorPhysicalFrame returns raw physical pixel coordinates unchanged", () => {
    const monitor = {
      name: "4K",
      position: { x: 1920, y: -200 },
      size: { width: 3840, height: 2160 },
      workArea: { position: { x: 1920, y: -200 }, size: { width: 3840, height: 2080 } },
      scaleFactor: 2
    } as unknown as Monitor;

    expect(getMonitorPhysicalFrame(monitor)).toEqual({
      x: 1920,
      y: -200,
      width: 3840,
      height: 2160
    });
  });

  it("getMonitorPhysicalFrame handles a monitor to the left of primary (negative x)", () => {
    const leftMonitor = {
      name: "Left",
      position: { x: -1920, y: 0 },
      size: { width: 1920, height: 1080 },
      workArea: { position: { x: -1920, y: 0 }, size: { width: 1920, height: 1040 } },
      scaleFactor: 1
    } as unknown as Monitor;

    const frame = getMonitorPhysicalFrame(leftMonitor);
    expect(frame.x).toBe(-1920);
    expect(frame.width).toBe(1920);
  });

  it("getMonitorFrame logical dimensions match physical / scaleFactor", () => {
    const monitor = {
      name: "HiDPI",
      position: { x: 0, y: 0 },
      size: { width: 2560, height: 1600 },
      workArea: { position: { x: 0, y: 0 }, size: { width: 2560, height: 1560 } },
      scaleFactor: 1.25
    } as unknown as Monitor;

    const frame = getMonitorFrame(monitor);
    expect(frame.width).toBeCloseTo(2048);
    expect(frame.height).toBeCloseTo(1280);
  });
});
