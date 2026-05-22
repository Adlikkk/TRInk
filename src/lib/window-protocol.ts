import type { ToolKind, ToolMode } from "../types/drawables";
import type { EditablePropertiesPatch, SelectedObjectSummary } from "./object-editing";
import type { OverlayInteractionMode, TimerPreset, TimerSizeMode } from "../types/settings";
import type { TimerStatus } from "./timer";

export type TimerSnapshot = {
  visible: boolean;
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
  position: { x: number; y: number };
  size: TimerSizeMode;
  opacity: number;
  preset: TimerPreset;
};

export type OverlayCommand =
  | { type: "set-tool"; tool: ToolKind }
  | { type: "set-tool-mode"; mode: ToolMode }
  | { type: "toggle-click-through" }
  | { type: "set-click-through"; enabled: boolean }
  | { type: "save-session" }
  | { type: "load-session" }
  | { type: "export-annotations-png" }
  | { type: "export-annotations-json" }
  | { type: "update-selected-object"; id: string; patch: EditablePropertiesPatch }
  | { type: "set-selected-locked"; locked: boolean }
  | { type: "reorder-selected"; direction: "forward" | "backward" | "front" | "back" }
  | { type: "duplicate-selected" }
  | { type: "clear-selection" }
  | { type: "delete-selected" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "clear" }
  | { type: "toggle-hidden" }
  | { type: "set-settings-open"; open: boolean }
  | { type: "set-timer-visible"; visible: boolean }
  | { type: "toggle-timer-visible" }
  | { type: "set-timer-duration"; durationMs: number; preset: TimerPreset }
  | { type: "start-timer" }
  | { type: "toggle-timer-start-pause" }
  | { type: "pause-timer" }
  | { type: "resume-timer" }
  | { type: "reset-timer" }
  | { type: "update-timer-position"; position: { x: number; y: number } }
  | { type: "update-timer-style"; size?: TimerSizeMode; opacity?: number };

export type ToolbarCommand = { type: "open-settings" };

export type ToolbarSnapshot = {
  activeTool: ToolKind;
  toolMode: ToolMode;
  hidden: boolean;
  overlayMode: OverlayInteractionMode;
  overlayVisible: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentSessionName: string;
  isDirty: boolean;
  selectedObject: SelectedObjectSummary | null;
  timer: TimerSnapshot;
};

export type SessionNotice = {
  status: "success" | "error" | "info";
  message: string;
};
