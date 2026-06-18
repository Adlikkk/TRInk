import type { AppEdition } from "./edition";
import type { ToolKind } from "../types/drawables";

export type EditionToolbarActionId =
  | "undo"
  | "redo"
  | "toggle-overlay-mode"
  | "clear"
  | "settings"
  | "quit"
  | "toggle-hidden"
  | "rotate-toolbar";

export type EditionSettingsTabId =
  | "general"
  | "tools"
  | "appearance"
  | "keybinds"
  | "timer"
  | "session"
  | "about";

export function getEditionToolbarToolIds(edition: AppEdition): ToolKind[] {
  if (edition.id === "basic") {
    return ["select", "pen", "highlighter", "line", "arrow", "rectangle", "eraser"];
  }

  return edition.visibleToolIds;
}

export function getEditionPrimaryToolbarActions(edition: AppEdition): EditionToolbarActionId[] {
  if (edition.id === "basic") {
    return ["undo", "redo", "toggle-overlay-mode", "clear", "rotate-toolbar", "settings", "quit"];
  }

  return ["undo", "redo", "toggle-hidden", "clear", "toggle-overlay-mode", "settings", "quit"];
}

export function getEditionOverflowToolbarActions(edition: AppEdition): EditionToolbarActionId[] {
  if (edition.id === "basic") {
    return [];
  }

  return [];
}

export function getEditionSettingsTabs(edition: AppEdition): EditionSettingsTabId[] {
  if (edition.id === "basic") {
    return ["general", "tools", "keybinds", "appearance", "about"];
  }

  const tabs: EditionSettingsTabId[] = ["general", "keybinds"];
  if (edition.features.timer) {
    tabs.push("timer");
  }
  if (edition.features.quickSessionActions || edition.features.annotationExport) {
    tabs.push("session");
  }
  tabs.push("about");
  return tabs;
}
