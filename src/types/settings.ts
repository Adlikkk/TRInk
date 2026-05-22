import type { ToolKind, ToolMode } from "./drawables";
import { buildDefaultShortcutBindings, type ShortcutBinding } from "../lib/shortcuts";

export type OverlayInteractionMode = "draw" | "click-through";
export const SETTINGS_VERSION = 5;

export type ToolbarPosition = {
  x: number;
  y: number;
};

export type ToolbarSizeMode = "compact" | "normal";
export type TimerSizeMode = "compact" | "normal";
export type TimerPreset = "1m" | "5m" | "15m" | "custom";

export type DrawingTargetMonitor = "auto" | `monitor-${number}`;

export type AppSettings = {
  settingsVersion: number;
  defaultColor: string;
  strokeWidth: number;
  opacity: number;
  defaultMode: OverlayInteractionMode;
  toolbarOpacity: number;
  toolbarSize: ToolbarSizeMode;
  favoriteTools: ToolKind[];
  defaultTool: ToolKind;
  toolMode: ToolMode;
  startMinimized: boolean;
  alwaysOnTop: boolean;
  toolbarPosition: ToolbarPosition;
  drawingTargetMonitor: DrawingTargetMonitor;
  showCursorHints: boolean;
  showPatternLabels: boolean;
  timerVisible: boolean;
  timerPosition: ToolbarPosition;
  timerDurationMs: number;
  timerPreset: TimerPreset;
  timerSize: TimerSizeMode;
  timerOpacity: number;
  recentTools: ToolKind[];
  shortcuts: ShortcutBinding[];
  welcomeDismissed: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  settingsVersion: SETTINGS_VERSION,
  defaultColor: "#3B82F6",
  strokeWidth: 3,
  opacity: 0.9,
  defaultMode: "draw",
  toolbarOpacity: 0.92,
  toolbarSize: "compact",
  favoriteTools: ["select", "pen", "arrow", "rectangle", "trend", "channel", "horizontal_line", "fvg"],
  defaultTool: "pen",
  toolMode: "basic",
  startMinimized: false,
  alwaysOnTop: true,
  toolbarPosition: { x: 24, y: 24 },
  drawingTargetMonitor: "auto",
  showCursorHints: true,
  showPatternLabels: true,
  timerVisible: false,
  timerPosition: { x: 28, y: 28 },
  timerDurationMs: 60_000,
  timerPreset: "1m",
  timerSize: "compact",
  timerOpacity: 0.92,
  recentTools: [],
  shortcuts: buildDefaultShortcutBindings(),
  welcomeDismissed: false
};
