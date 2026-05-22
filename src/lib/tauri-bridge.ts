import { invoke } from "@tauri-apps/api/core";
import { emitTo, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { ShortcutBinding, ShortcutRegistrationStatus } from "./shortcuts";
import type { OverlayInteractionMode } from "../types/settings";
import type { AppSettings } from "../types/settings";
import type {
  OverlayCommand,
  SessionNotice,
  ToolbarCommand,
  ToolbarSnapshot
} from "./window-protocol";

export async function setClickThrough(enabled: boolean) {
  await invoke("set_click_through", { enabled });
}

export async function setOverlayVisible(visible: boolean) {
  await invoke("set_overlay_visible", { visible });
}

export async function applyShortcutBindings(bindings: ShortcutBinding[]) {
  return invoke<ShortcutRegistrationStatus[]>("apply_shortcut_bindings", { bindings });
}

export async function applyInitialOverlayMode(mode: OverlayInteractionMode) {
  await setClickThrough(mode === "click-through");
}

export function getWindowMode() {
  const query = new URLSearchParams(window.location.search);
  const requested = query.get("window");
  return requested === "toolbar" ? "toolbar" : "overlay";
}

export async function listenOverlayCommands(handler: (event: OverlayCommand) => void) {
  return getCurrentWindow().listen<OverlayCommand>("trink://overlay-command", (event) => {
    handler(event.payload);
  });
}

export async function listenToolbarCommands(handler: (event: ToolbarCommand) => void) {
  return getCurrentWindow().listen<ToolbarCommand>("trink://toolbar-command", (event) => {
    handler(event.payload);
  });
}

export async function publishToolbarSnapshot(snapshot: ToolbarSnapshot) {
  await emitTo("toolbar", "trink://toolbar-snapshot", snapshot);
}

export async function listenToolbarSnapshot(handler: (snapshot: ToolbarSnapshot) => void) {
  return getCurrentWindow().listen<ToolbarSnapshot>("trink://toolbar-snapshot", (event) => {
    handler(event.payload);
  });
}

export async function sendOverlayCommand(command: OverlayCommand) {
  await emitTo("overlay", "trink://overlay-command", command);
}

export async function publishSessionNotice(notice: SessionNotice) {
  await emitTo("toolbar", "trink://session-notice", notice);
}

export async function listenSessionNotice(handler: (notice: SessionNotice) => void) {
  return getCurrentWindow().listen<SessionNotice>("trink://session-notice", (event) => {
    handler(event.payload);
  });
}

export type SettingsSyncPayload = {
  source: "overlay" | "toolbar";
  settings: AppSettings;
};

export async function publishSettingsSync(payload: SettingsSyncPayload) {
  const target = payload.source === "overlay" ? "toolbar" : "overlay";
  await emitTo(target, "trink://settings-sync", payload);
}

export async function listenSettingsSync(handler: (payload: SettingsSyncPayload) => void) {
  return getCurrentWindow().listen<SettingsSyncPayload>("trink://settings-sync", (event) => {
    handler(event.payload);
  });
}

export async function listenOverlayVisibility(handler: (visible: boolean) => void): Promise<UnlistenFn> {
  return listen<boolean>("trink://overlay-visibility", (event) => {
    handler(event.payload);
  });
}
