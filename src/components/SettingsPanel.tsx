import type { Dispatch } from "react";
import { X } from "lucide-react";
import type { AppSettings } from "../types/settings";
import type { DrawingAction } from "../state/drawing-state";
import { TOOL_DEFINITIONS } from "../lib/tool-definitions";

type SettingsPanelProps = {
  open: boolean;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  dispatch: Dispatch<DrawingAction>;
};

export function SettingsPanel({ open, settings, setSettings, dispatch }: SettingsPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="absolute right-6 top-6 z-30 w-[360px] rounded-2xl border border-slate-800 bg-slate-950/96 p-5 shadow-overlay backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.26em] text-slate-500">Settings</div>
          <div className="text-base font-semibold text-slate-100">Overlay preferences</div>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:border-slate-700 hover:text-white"
          onClick={() => dispatch({ type: "set-settings-open", open: false })}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 text-sm">
        <label className="block">
          <span className="mb-2 block text-slate-400">Default color</span>
          <input
            type="color"
            value={settings.defaultColor}
            onChange={(event) => setSettings((current) => ({ ...current, defaultColor: event.target.value }))}
            className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 p-1"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-slate-400">Stroke width</span>
          <input
            type="range"
            min={1}
            max={12}
            value={settings.strokeWidth}
            onChange={(event) =>
              setSettings((current) => ({ ...current, strokeWidth: Number(event.target.value) }))
            }
            className="w-full"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-slate-400">Drawing opacity</span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={settings.opacity}
            onChange={(event) =>
              setSettings((current) => ({ ...current, opacity: Number(event.target.value) }))
            }
            className="w-full"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-slate-400">Toolbar opacity</span>
          <input
            type="range"
            min={0.35}
            max={1}
            step={0.05}
            value={settings.toolbarOpacity}
            onChange={(event) =>
              setSettings((current) => ({ ...current, toolbarOpacity: Number(event.target.value) }))
            }
            className="w-full"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-slate-400">Default overlay mode</span>
          <select
            value={settings.defaultMode}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                defaultMode: event.target.value as AppSettings["defaultMode"]
              }))
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="draw">Draw mode</option>
            <option value="click-through">Click-through mode</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-slate-400">Default tool</span>
          <select
            value={settings.defaultTool}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                defaultTool: event.target.value as AppSettings["defaultTool"]
              }))
            }
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
          >
            {TOOL_DEFINITIONS.map((tool) => (
              <option key={tool.id} value={tool.id}>
                {tool.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-2 block text-slate-400">Favorite tools</span>
          <div className="grid grid-cols-2 gap-2">
            {TOOL_DEFINITIONS.map((tool) => {
              const active = settings.favoriteTools.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() =>
                    setSettings((current) => {
                      const exists = current.favoriteTools.includes(tool.id);
                      const favoriteTools = exists
                        ? current.favoriteTools.filter((entry) => entry !== tool.id)
                        : [...current.favoriteTools, tool.id].slice(0, 8);
                      return { ...current, favoriteTools };
                    })
                  }
                  className={`rounded-lg border px-3 py-2 text-left text-xs ${
                    active
                      ? "border-blue-500 bg-blue-500/15 text-blue-200"
                      : "border-slate-800 bg-slate-900 text-slate-300"
                  }`}
                >
                  {tool.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
          <div className="mb-2 font-semibold text-slate-200">Keybinds</div>
          <div>`Ctrl+Shift+Space` overlay toggle</div>
          <div>`Ctrl+Shift+P/H/A/R/T/E` tool select</div>
          <div>`Ctrl+Shift+X` click-through toggle</div>
          <div>`Ctrl+Z` undo, `Ctrl+Y` redo, `Ctrl+Shift+Backspace` clear</div>
        </div>
      </div>
    </aside>
  );
}
