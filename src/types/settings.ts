import type { ToolKind, ToolMode } from "./drawables";
import { buildDefaultShortcutBindings, type ShortcutBinding } from "../lib/shortcuts";
import { getCurrentEdition } from "../editions/edition";

export type OverlayInteractionMode = "draw" | "click-through";
export const SETTINGS_VERSION = 8;

export type ToolbarPosition = {
  x: number;
  y: number;
};

export type ToolbarSizeMode = "compact" | "normal";
export type ToolbarOrientation = "horizontal" | "vertical";
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
  toolbarOrientation: ToolbarOrientation;
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
  overlayDebugBounds: boolean;
  returnToSelectAfterDraw: boolean;
  checkForUpdates: boolean;
};

const edition = getCurrentEdition();

export const DEFAULT_SETTINGS: AppSettings = {
  settingsVersion: SETTINGS_VERSION,
  defaultColor: "#3B82F6",
  strokeWidth: 3,
  opacity: 0.9,
  defaultMode: "click-through",
  toolbarOpacity: 0.92,
  toolbarSize: "compact",
  toolbarOrientation: "horizontal",
  favoriteTools: edition.defaultFavoriteTools,
  defaultTool: edition.defaultTool,
  toolMode: edition.availableModes[0],
  startMinimized: false,
  alwaysOnTop: true,
  toolbarPosition: { x: 24, y: 24 },
  drawingTargetMonitor: "auto",
  showCursorHints: edition.id === "basic" ? false : true,
  showPatternLabels: edition.features.patternLabels,
  timerVisible: false,
  timerPosition: { x: 28, y: 28 },
  timerDurationMs: 60_000,
  timerPreset: "1m",
  timerSize: "compact",
  timerOpacity: 0.92,
  recentTools: [],
  shortcuts: buildDefaultShortcutBindings(),
  welcomeDismissed: false,
  overlayDebugBounds: false,
  returnToSelectAfterDraw: true,
  checkForUpdates: false
};
