import { useEffect, useState } from "react";
import { loadSettings, saveSettings } from "../lib/settings-store";
import type { AppSettings } from "../types/settings";

export function usePersistentSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  return { settings, setSettings };
}
