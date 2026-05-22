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

export function getDesktopBounds(monitors: Monitor[]): DesktopBounds {
  if (monitors.length === 0) {
    return {
      x: 0,
      y: 0,
      width: typeof window !== "undefined" ? window.screen.availWidth : 1920,
      height: typeof window !== "undefined" ? window.screen.availHeight : 1080
    };
  }

  const left = Math.min(...monitors.map((monitor) => monitor.workArea.position.x));
  const top = Math.min(...monitors.map((monitor) => monitor.workArea.position.y));
  const right = Math.max(
    ...monitors.map((monitor) => monitor.workArea.position.x + monitor.workArea.size.width)
  );
  const bottom = Math.max(
    ...monitors.map((monitor) => monitor.workArea.position.y + monitor.workArea.size.height)
  );

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}
