import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { OverlayInteractionMode } from "../types/settings";
import type { ToolKind } from "../types/drawables";

export type HotkeyEvent =
  | { type: "set-tool"; tool: ToolKind }
  | { type: "toggle-visibility" }
  | { type: "toggle-click-through" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "clear" }
  | { type: "open-settings" };

export async function setClickThrough(enabled: boolean) {
  await invoke("set_click_through", { enabled });
}

export async function setOverlayVisible(visible: boolean) {
  await invoke("set_overlay_visible", { visible });
}

export async function applyInitialOverlayMode(mode: OverlayInteractionMode) {
  await setClickThrough(mode === "click-through");
}

export async function listenHotkeys(handler: (event: HotkeyEvent) => void) {
  const unlisten = await listen<HotkeyEvent>("trink://hotkey", (event) => {
    handler(event.payload);
  });
  return unlisten;
}

export async function listenOverlayVisibility(handler: (visible: boolean) => void): Promise<UnlistenFn> {
  return listen<boolean>("trink://overlay-visibility", (event) => {
    handler(event.payload);
  });
}
