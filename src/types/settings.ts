import type { ToolKind, ToolMode } from "./drawables";

export type OverlayInteractionMode = "draw" | "click-through";
export const SETTINGS_VERSION = 1;

export type ToolbarPosition = {
  x: number;
  y: number;
};

export type AppSettings = {
  settingsVersion: number;
  defaultColor: string;
  strokeWidth: number;
  opacity: number;
  defaultMode: OverlayInteractionMode;
  toolbarOpacity: number;
  favoriteTools: ToolKind[];
  defaultTool: ToolKind;
  toolMode: ToolMode;
  startMinimized: boolean;
  alwaysOnTop: boolean;
  toolbarPosition: ToolbarPosition;
};

export const DEFAULT_SETTINGS: AppSettings = {
  settingsVersion: SETTINGS_VERSION,
  defaultColor: "#3B82F6",
  strokeWidth: 3,
  opacity: 0.9,
  defaultMode: "draw",
  toolbarOpacity: 0.92,
  favoriteTools: [
    "pen",
    "arrow",
    "rectangle",
    "text",
    "trend",
    "channel",
    "support_resistance_zone",
    "call_marker"
  ],
  defaultTool: "pen",
  toolMode: "basic",
  startMinimized: false,
  alwaysOnTop: true,
  toolbarPosition: { x: 24, y: 24 }
};
