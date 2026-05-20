import { useMemo, useRef } from "react";
import type { Dispatch, PointerEvent as ReactPointerEvent } from "react";
import { Eye, EyeOff, Redo2, Settings2, Trash2, Undo2 } from "lucide-react";
import { TOOL_DEFINITIONS } from "../lib/tool-definitions";
import type { ToolKind } from "../types/drawables";
import type { DrawingAction, DrawingState } from "../state/drawing-state";
import type { AppSettings } from "../types/settings";

type ToolbarProps = {
  state: DrawingState;
  dispatch: Dispatch<DrawingAction>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
};

const TOOL_MODE_LABELS = {
  basic: "Basic",
  trading: "Trading",
  binary: "Binary"
} as const;

export function Toolbar({ state, dispatch, settings, setSettings }: ToolbarProps) {
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  const tools = useMemo(() => {
    const favoriteSet = new Set(settings.favoriteTools);
    return TOOL_DEFINITIONS.filter((tool) => favoriteSet.has(tool.id) || tool.mode === state.toolMode);
  }, [settings.favoriteTools, state.toolMode]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragOffset.current = {
      x: event.clientX - state.toolbarPosition.x,
      y: event.clientY - state.toolbarPosition.y
    };
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragOffset.current) {
      return;
    }
    dispatch({
      type: "set-toolbar-position",
      position: {
        x: Math.max(12, event.clientX - dragOffset.current.x),
        y: Math.max(12, event.clientY - dragOffset.current.y)
      }
    });
  };

  const endDrag = () => {
    dragOffset.current = null;
  };

  const setTool = (tool: ToolKind) => {
    dispatch({ type: "set-tool", tool });
    setSettings((current) => ({ ...current, defaultTool: tool }));
  };

  return (
    <div
      className="absolute z-20 w-[360px] rounded-2xl border border-slate-800/90 bg-slate-950/90 shadow-overlay backdrop-blur"
      style={{
        left: state.toolbarPosition.x,
        top: state.toolbarPosition.y,
        opacity: settings.toolbarOpacity
      }}
    >
      <div
        className="flex cursor-move items-center justify-between border-b border-slate-800/80 px-4 py-3"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
      >
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">TRInk</div>
          <div className="text-sm font-semibold text-slate-100">TradeReality Ink</div>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-800 p-2 text-slate-300 transition hover:border-slate-700 hover:text-white"
          onClick={() => dispatch({ type: "set-settings-open", open: !state.settingsOpen })}
          title="Settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-800/80 px-4 py-3">
        {(["basic", "trading", "binary"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              dispatch({ type: "set-tool-mode", mode });
              setSettings((current) => ({ ...current, toolMode: mode }));
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              state.toolMode === mode
                ? "bg-blue-500 text-white"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {TOOL_MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 py-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const active = state.activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setTool(tool.id)}
              className={`flex h-16 flex-col items-center justify-center rounded-xl border text-xs transition ${
                active
                  ? "border-blue-500 bg-blue-500/15 text-blue-200"
                  : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
              }`}
              title={tool.label}
            >
              <Icon className="mb-1 h-4 w-4" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-2 border-t border-slate-800/80 px-4 py-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "undo" })}
          className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-slate-300 transition hover:border-slate-700 hover:text-white"
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "redo" })}
          className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-slate-300 transition hover:border-slate-700 hover:text-white"
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "clear" })}
          className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-slate-300 transition hover:border-slate-700 hover:text-white"
          title="Clear"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "toggle-hidden" })}
          className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-slate-300 transition hover:border-slate-700 hover:text-white"
          title={state.hidden ? "Show drawings" : "Hide drawings"}
        >
          {state.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
