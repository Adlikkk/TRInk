import { DEFAULT_SETTINGS, type AppSettings } from "../types/settings";

const SETTINGS_KEY = "trink.settings.v0.1";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      favoriteTools: Array.isArray(parsed.favoriteTools)
        ? parsed.favoriteTools.slice(0, 8)
        : DEFAULT_SETTINGS.favoriteTools
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
