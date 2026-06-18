import { invoke } from "@tauri-apps/api/core";
import { emitTo, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { ShortcutBinding, ShortcutRegistrationStatus } from "./shortcuts";
import type { OverlayInteractionMode } from "../types/settings";
import type { AppSettings } from "../types/settings";
import type {
  OverlayCommand,
  PaletteCommand,
  SessionNotice,
  ToolbarCommand,
  ToolbarSnapshot,
  UiWindowBoundsPayload
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

export function getWindowMode(): "overlay" | "toolbar" | "palette" | "settings" {
  const query = new URLSearchParams(window.location.search);
  const requested = query.get("window");
  if (requested === "toolbar") return "toolbar";
  if (requested === "palette") return "palette";
  if (requested === "settings") return "settings";
  return "overlay";
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
  await Promise.all([
    emitTo("toolbar", "trink://toolbar-snapshot", snapshot).catch(() => undefined),
    emitTo("settings", "trink://toolbar-snapshot", snapshot).catch(() => undefined),
    emitTo("palette", "trink://toolbar-snapshot", snapshot).catch(() => undefined),
  ]);
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
  source: "overlay" | "toolbar" | "palette" | "settings";
  settings: AppSettings;
};

export async function publishSettingsSync(payload: SettingsSyncPayload) {
  const all = ["overlay", "toolbar", "palette", "settings"];
  await Promise.all(
    all
      .filter((t) => t !== payload.source)
      .map((target) => emitTo(target, "trink://settings-sync", payload).catch(() => undefined))
  );
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

export async function sendPaletteCommand(command: PaletteCommand) {
  await emitTo("toolbar", "trink://palette-command", command);
}

export async function listenPaletteCommands(handler: (event: PaletteCommand) => void) {
  return getCurrentWindow().listen<PaletteCommand>("trink://palette-command", (event) => {
    handler(event.payload);
  });
}

export async function togglePaletteWindow(x: number, y: number) {
  await invoke("toggle_palette_window", { x, y });
}

export async function closePaletteWindow() {
  await invoke("close_palette_window");
}

export async function toggleSettingsWindow(x: number, y: number) {
  await invoke("toggle_settings_window", { x, y });
}

export async function closeSettingsWindow() {
  await invoke("close_settings_window");
}

export async function bringToolbarToFront() {
  await invoke("bring_toolbar_to_front");
}

export async function publishUiWindowBounds(payload: UiWindowBoundsPayload) {
  await emitTo("overlay", "trink://ui-window-bounds", payload).catch(() => undefined);
}

export async function listenUiWindowBounds(handler: (payload: UiWindowBoundsPayload) => void) {
  return getCurrentWindow().listen<UiWindowBoundsPayload>("trink://ui-window-bounds", (event) => {
    handler(event.payload);
  });
}

export async function listenTrayEvent(handler: (eventName: string) => void) {
  return listen<string>("tray-event", (event) => {
    handler(event.payload);
  });
}
