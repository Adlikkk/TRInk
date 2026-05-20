import type { ToolKind, ToolMode } from "./drawables";

export type OverlayInteractionMode = "draw" | "click-through";

export type AppSettings = {
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
};

export const DEFAULT_SETTINGS: AppSettings = {
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
  alwaysOnTop: true
};
