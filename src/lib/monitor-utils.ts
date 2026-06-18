import type { Monitor } from "@tauri-apps/api/window";
import type { DrawingTargetMonitor } from "../types/settings";

export type MonitorOption = {
  id: DrawingTargetMonitor;
  label: string;
  monitor: Monitor | null;
};

export type DesktopBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MonitorFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function createMonitorOptions(monitors: Monitor[], primary: Monitor | null): MonitorOption[] {
  const options: MonitorOption[] = [{ id: "auto", label: "Auto / Primary monitor", monitor: primary }];

  monitors.forEach((monitor, index) => {
    const suffix = monitor.name ? ` - ${monitor.name}` : "";
    options.push({
      id: `monitor-${index + 1}`,
      label: `Monitor ${index + 1}${suffix}`,
      monitor
    });
  });

  return options;
}

export function resolveTargetMonitor(
  target: DrawingTargetMonitor,
  options: MonitorOption[]
): Monitor | null {
  const match = options.find((option) => option.id === target);
  return match?.monitor ?? options[0]?.monitor ?? null;
}

// Returns the monitor frame in logical (CSS) pixels. Use for canvas viewport and UI layout
// calculations that live inside the overlay window's own coordinate space.
export function getMonitorFrame(monitor: Monitor): MonitorFrame {
  const scaleFactor = monitor.scaleFactor || 1;
  return {
    x: monitor.position.x / scaleFactor,
    y: monitor.position.y / scaleFactor,
    width: monitor.size.width / scaleFactor,
    height: monitor.size.height / scaleFactor
  };
}

// Returns the raw physical pixel position and size of the monitor. Use this for
// window.setPosition / window.setSize calls so that placement is accurate regardless of
// which monitor the window happens to be sitting on when the call executes (different
// DPI contexts cause LogicalPosition math to produce wrong physical coordinates).
export function getMonitorPhysicalFrame(monitor: Monitor): MonitorFrame {
  return {
    x: monitor.position.x,
    y: monitor.position.y,
    width: monitor.size.width,
    height: monitor.size.height
  };
}

export function getDesktopBounds(monitors: Monitor[]): DesktopBounds {
  if (monitors.length === 0) {
    return {
      x: 0,
      y: 0,
      width: typeof window !== "undefined" ? window.screen.availWidth : 1920,
      height: typeof window !== "undefined" ? window.screen.availHeight : 1080
    };
  }

  const frames = monitors.map((monitor) => {
    const scaleFactor = monitor.scaleFactor || 1;
    return {
      x: monitor.workArea.position.x / scaleFactor,
      y: monitor.workArea.position.y / scaleFactor,
      width: monitor.workArea.size.width / scaleFactor,
      height: monitor.workArea.size.height / scaleFactor
    };
  });

  const left = Math.min(...frames.map((frame) => frame.x));
  const top = Math.min(...frames.map((frame) => frame.y));
  const right = Math.max(
    ...frames.map((frame) => frame.x + frame.width)
  );
  const bottom = Math.max(
    ...frames.map((frame) => frame.y + frame.height)
  );

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}
