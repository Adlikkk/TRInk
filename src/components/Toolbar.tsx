import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  ChevronDown,
  Eye,
  EyeOff,
  Highlighter,
  MousePointerClick,
  PenTool,
  Power,
  Redo2,
  RefreshCcw,
  Search,
  Settings2,
  Trash2,
  Undo2
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getShortcutDefinition, getToolShortcutLabel, type ShortcutRegistrationStatus } from "../lib/shortcuts";
import {
  getToolMode,
  searchTools,
  TOOL_CATEGORY_LABELS,
  TOOL_CATEGORY_ORDER,
  TOOL_DEFINITIONS
} from "../lib/tool-definitions";
import { formatTimerClock } from "../lib/timer";
import type { AppSettings } from "../types/settings";
import type { ToolKind } from "../types/drawables";
import type { ToolbarSnapshot } from "../lib/window-protocol";
import type { AppEdition } from "../editions/edition";
import type { PointerEvent as ReactPointerEvent } from "react";

type ToolbarProps = {
  edition: AppEdition;
  snapshot: ToolbarSnapshot;
  settings: AppSettings;
  shortcutStatuses: ShortcutRegistrationStatus[];
  startupState: "starting" | "ready" | "error" | "idle";
  startupMessage: string;
  onSetTool: (tool: ToolKind) => void;
  onSetToolMode: (mode: ToolbarSnapshot["toolMode"]) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSaveSession?: () => void;
  onLoadSession?: () => void;
  onExportAnnotationsPng?: () => void;
  onExportAnnotationsJson?: () => void;
  onTimerPreset?: (durationMs: number, preset: AppSettings["timerPreset"]) => void;
  onToggleTimerVisibility?: () => void;
  onStartTimer?: () => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onResetTimer?: () => void;
  onToggleHidden: () => void;
  onToggleClickThrough: () => void;
  onToggleSettings: () => void;
  onRotateOrientation: () => void;
  onOpenPalette: () => void;
  onQuit: () => void;
  onDragPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onDragPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onDragPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
};

const TOOLBAR_SIZE_STYLES = {
  compact: {
    barPadding: "px-3 py-2",
    button: "h-9 w-9 rounded-xl",
    icon: "h-4 w-4",
    gap: "gap-1.5",
    pill: "px-2.5 py-1 text-[10px]"
  },
  normal: {
    barPadding: "px-3.5 py-2.5",
    button: "h-10 w-10 rounded-xl",
    icon: "h-[18px] w-[18px]",
    gap: "gap-2",
    pill: "px-3 py-1.5 text-[11px]"
  }
} as const;

const APP_LOGO_PATH = "/logo.svg";

export function Toolbar({
  edition,
  snapshot,
  settings,
  shortcutStatuses,
  startupState,
  startupMessage,
  onSetTool,
  onSetToolMode,
  onUndo,
  onRedo,
  onClear,
  onSaveSession,
  onLoadSession,
  onExportAnnotationsPng,
  onExportAnnotationsJson,
  onTimerPreset,
  onToggleTimerVisibility,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onToggleHidden,
  onToggleClickThrough,
  onToggleSettings,
  onRotateOrientation,
  onOpenPalette,
  onQuit,
  onDragPointerDown,
  onDragPointerMove,
  onDragPointerUp
}: ToolbarProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const overflowRef = useRef<HTMLDivElement | null>(null);
  const sizeStyle = TOOLBAR_SIZE_STYLES[settings.toolbarSize];

  const favoriteTools = useMemo(() => {
    const favoriteSet = new Set(settings.favoriteTools);
    return TOOL_DEFINITIONS.filter((tool) => favoriteSet.has(tool.id));
  }, [settings.favoriteTools]);

  const recentTools = useMemo(() => {
    const recentSet = new Set(settings.recentTools);
    return TOOL_DEFINITIONS.filter((tool) => recentSet.has(tool.id));
  }, [settings.recentTools]);
  const paletteTools = useMemo(() => {
    const favoriteSet = new Set(settings.favoriteTools);
    return searchTools(paletteQuery).filter((tool) => !favoriteSet.has(tool.id));
  }, [paletteQuery, settings.favoriteTools]);
  const paletteSections = useMemo(
    () =>
      TOOL_CATEGORY_ORDER.map((category) => ({
        category,
        label: TOOL_CATEGORY_LABELS[category],
        tools: paletteTools.filter((tool) => tool.category === category)
      })).filter((section) => section.tools.length > 0),
    [paletteTools]
  );
  const unavailableShortcutCount = useMemo(
    () => shortcutStatuses.filter((status) => status.state === "unavailable").length,
    [shortcutStatuses]
  );
  const firstUnavailableShortcut = useMemo(() => {
    const firstUnavailable = shortcutStatuses.find((status) => status.state === "unavailable");
    return firstUnavailable ? getShortcutDefinition(firstUnavailable.action)?.label ?? "Shortcut" : null;
  }, [shortcutStatuses]);

  const iconButtonBase =
    "flex items-center justify-center border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] text-[#E5E7EB] transition hover:border-[rgba(148,163,184,0.34)] hover:bg-[rgba(30,41,59,0.9)] disabled:cursor-not-allowed disabled:opacity-35";

  useEffect(() => {
    if (!overflowOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!overflowRef.current?.contains(event.target as Node)) {
        setOverflowOpen(false);
        setPaletteQuery("");
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOverflowOpen(false);
        setPaletteQuery("");
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [overflowOpen]);

  if (startupState === "starting" || startupState === "error") {
    return (
      <div className="relative" ref={overflowRef}>
        <div
          className={`rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-[rgba(2,8,23,0.82)] px-3 py-2 shadow-[0_18px_50px_rgba(2,8,23,0.42)] backdrop-blur-xl transition-opacity duration-200`}
          style={{ opacity: settings.toolbarOpacity }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.82)] px-2.5 text-left text-[#E5E7EB]"
              onPointerDown={() => {
                void getCurrentWindow().startDragging();
              }}
              title="Drag toolbar"
            >
              <img src={APP_LOGO_PATH} alt="TradeReality Ink" className="h-6 w-6 rounded-md" />
              <span className="text-xs font-semibold tracking-[0.18em] text-[#E5E7EB]">TRInk</span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#E5E7EB]">{startupMessage}</div>
              <div className="text-[11px] text-[#94A3B8]">
                {startupState === "error"
                  ? "The toolbar is waiting for the overlay window to respond."
                  : "Local-only overlay tools are starting."}
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSettings}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] text-[#E5E7EB] transition hover:border-[rgba(148,163,184,0.34)] hover:bg-[rgba(30,41,59,0.9)]"
              title="Open settings"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={overflowRef}>
      <div
        className={`rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-[rgba(2,8,23,0.82)] shadow-[0_18px_50px_rgba(2,8,23,0.42)] backdrop-blur-xl ${sizeStyle.barPadding}`}
        style={{ opacity: settings.toolbarOpacity }}
      >
        <div className={`flex items-center ${sizeStyle.gap}`}>
          <button
            type="button"
            className={`group flex items-center rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.82)] text-left text-[#E5E7EB] transition hover:border-[rgba(148,163,184,0.32)] ${
              settings.toolbarSize === "compact" ? "h-10 px-2.5" : "h-11 gap-2 px-3"
            }`}
            onPointerDown={() => {
              void getCurrentWindow().startDragging();
            }}
            title={snapshot.isDirty ? "Unsaved session changes" : snapshot.currentSessionName}
          >
            <img
              src={APP_LOGO_PATH}
              alt="TradeReality Ink"
              className={settings.toolbarSize === "compact" ? "h-6 w-6 shrink-0 object-contain rounded-md" : "h-7 w-7 shrink-0 object-contain rounded-md"}
            />
            {edition.id !== "basic" && snapshot.isDirty && settings.toolbarOrientation !== "vertical" ? <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> : null}
            {settings.toolbarSize === "normal" && settings.toolbarOrientation !== "vertical" ? (
              <span className="text-xs font-semibold tracking-[0.18em] text-[#E5E7EB]">TRInk</span>
            ) : null}
          </button>

          <div className={`flex items-center ${sizeStyle.gap}`}>
            {favoriteTools.map((tool) => {
              const Icon = tool.icon;
              const active = snapshot.activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    onSetTool(tool.id);
                    onSetToolMode(getToolMode(tool.id));
                    setOverflowOpen(false);
                  }}
                  className={`${iconButtonBase} ${sizeStyle.button} ${
                    active
                      ? "border-[#3B82F6] bg-[rgba(59,130,246,0.16)] text-[#BFDBFE] shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]"
                      : ""
                  }`}
                  title={tool.label}
                >
                  <Icon className={sizeStyle.icon} />
                </button>
              );
            })}
          </div>

          {edition.id !== "basic" ? (
            <div className="relative">
              <button
                type="button"
                className={`${iconButtonBase} ${sizeStyle.button}`}
                onClick={() =>
                  setOverflowOpen((current) => {
                    const next = !current;
                    if (!next) {
                      setPaletteQuery("");
                    }
                    return next;
                  })
                }
                title="More tools"
              >
                <ChevronDown className={sizeStyle.icon} />
              </button>

              {overflowOpen ? (
              <div className="absolute left-0 top-[calc(100%+10px)] z-40 w-[25rem] rounded-2xl border border-[rgba(148,163,184,0.22)] bg-[rgba(2,8,23,0.94)] p-3 shadow-[0_24px_60px_rgba(2,8,23,0.5)] backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#94A3B8]">
                    Tool Palette
                  </div>
                  <div className="text-[10px] text-[#64748B]">Grouped tools and actions</div>
                </div>
                <label className="mb-3 flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-[#94A3B8]" />
                  <input
                    value={paletteQuery}
                    onChange={(event) => setPaletteQuery(event.target.value)}
                    placeholder="Filter tools"
                    className="w-full bg-transparent text-xs text-[#E5E7EB] outline-none placeholder:text-[#64748B]"
                  />
                </label>
                <div className="mb-3 flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[11px] text-[#E5E7EB]">
                  <div className="truncate pr-3">
                    {snapshot.currentSessionName}
                    {snapshot.isDirty ? (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onSaveSession}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[10px] text-[#DBEAFE]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={onLoadSession}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[10px] text-[#E5E7EB]"
                    >
                      Load
                    </button>
                  </div>
                </div>
                {recentTools.length > 0 ? (
                  <div className="mb-3 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                      Recent tools
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {recentTools.map((tool) => {
                        const Icon = tool.icon;
                        const active = snapshot.activeTool === tool.id;
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => {
                              onSetTool(tool.id);
                              onSetToolMode(getToolMode(tool.id));
                              setOverflowOpen(false);
                              setPaletteQuery("");
                            }}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                              active
                                ? "border-[#3B82F6] bg-[rgba(59,130,246,0.16)] text-[#DBEAFE]"
                                : "border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] text-[#E5E7EB] hover:border-[rgba(148,163,184,0.28)]"
                            }`}
                            title={tool.description}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[11px] font-medium">{tool.label}</div>
                              <div className="truncate text-[10px] text-[#94A3B8]">{tool.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <div className="mb-3 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                    Actions
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onSaveSession}
                      className="rounded-lg border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-2 py-2 text-[10px] font-medium text-[#DBEAFE]"
                    >
                      Save Session
                    </button>
                    <button
                      type="button"
                      onClick={onLoadSession}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]"
                    >
                      Load Session
                    </button>
                    <button
                      type="button"
                      onClick={onExportAnnotationsPng}
                      className="rounded-lg border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-2 py-2 text-[10px] font-medium text-[#DBEAFE]"
                    >
                      Export PNG
                    </button>
                    <button
                      type="button"
                      onClick={onExportAnnotationsJson}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]"
                    >
                      Export JSON
                    </button>
                  </div>
                </div>
                <div className="mb-3 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                    <span>Timer</span>
                    <button
                      type="button"
                      onClick={() => onToggleTimerVisibility?.()}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[10px] text-[#E5E7EB]"
                    >
                      {snapshot.timer.visible ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="mb-2 flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] px-3 py-2">
                    <div className="text-sm font-semibold tabular-nums text-[#F8FAFC]">
                      {formatTimerClock(snapshot.timer.remainingMs)}
                    </div>
                    <div className="text-[10px] text-[#94A3B8]">
                      {snapshot.timer.status === "running"
                        ? "Running"
                        : snapshot.timer.status === "paused"
                          ? "Paused"
                          : snapshot.timer.status === "finished"
                            ? "Finished"
                            : "Idle"}
                    </div>
                  </div>
                  <div className="mb-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onTimerPreset?.(60_000, "1m")}
                      className="rounded-lg border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-2 py-2 text-[10px] text-[#DBEAFE]"
                    >
                      1m
                    </button>
                    <button
                      type="button"
                      onClick={() => onTimerPreset?.(300_000, "5m")}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]"
                    >
                      5m
                    </button>
                    <button
                      type="button"
                      onClick={() => onTimerPreset?.(900_000, "15m")}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]"
                    >
                      15m
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => (snapshot.timer.status === "paused" ? onResumeTimer?.() : onStartTimer?.())}
                      className="rounded-lg border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-2 py-2 text-[10px] text-[#DBEAFE]"
                    >
                      {snapshot.timer.status === "paused" ? "Resume" : "Start"}
                    </button>
                    <button
                      type="button"
                      onClick={onPauseTimer}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]"
                    >
                      Pause
                    </button>
                    <button
                      type="button"
                      onClick={onResetTimer}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={onToggleSettings}
                      className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]"
                    >
                      More
                    </button>
                  </div>
                </div>
                <div className="mb-3 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
                  {paletteSections.map((section) => (
                    <div key={section.category} className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3">
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                        {section.label}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {section.tools.map((tool) => {
                          const Icon = tool.icon;
                          const active = snapshot.activeTool === tool.id;
                          return (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => {
                                onSetTool(tool.id);
                                onSetToolMode(getToolMode(tool.id));
                                setOverflowOpen(false);
                                setPaletteQuery("");
                              }}
                              className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-left transition ${
                                active
                                  ? "border-[#3B82F6] bg-[rgba(59,130,246,0.16)] text-[#DBEAFE]"
                                  : "border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] text-[#E5E7EB] hover:border-[rgba(148,163,184,0.28)]"
                              }`}
                              title={tool.description}
                            >
                              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-medium">{tool.label}</span>
                                  {getToolShortcutLabel(settings.shortcuts, tool.id) ? (
                                    <span className="rounded-full border border-[rgba(148,163,184,0.16)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[#94A3B8]">
                                      {getToolShortcutLabel(settings.shortcuts, tool.id)}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-0.5 text-[10px] text-[#94A3B8]">{tool.description}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {paletteSections.length === 0 ? (
                    <div className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-4 text-xs text-[#94A3B8]">
                      No tools match the current filter.
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {(["basic", "trading", "binary"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSetToolMode(mode)}
                      className={`rounded-full border ${sizeStyle.pill} ${
                        snapshot.toolMode === mode
                          ? "border-[#3B82F6] bg-[rgba(59,130,246,0.18)] text-[#DBEAFE]"
                          : "border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] text-[#94A3B8]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5">
            {edition.id !== "basic" ? (
              <div
                className={`rounded-full border ${sizeStyle.pill} font-semibold uppercase tracking-[0.16em] ${
                  snapshot.overlayMode === "draw"
                    ? "border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] text-[#94A3B8]"
                    : "border-[rgba(59,130,246,0.46)] bg-[rgba(59,130,246,0.18)] text-[#DBEAFE]"
                }`}
                title={snapshot.overlayMode === "draw" ? "Draw mode" : "Click-through mode"}
              >
                {snapshot.overlayMode === "draw" ? "Draw" : "Pass"}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onUndo}
              disabled={!snapshot.canUndo}
              className={`${iconButtonBase} ${sizeStyle.button}`}
              title="Undo"
            >
              <Undo2 className={sizeStyle.icon} />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!snapshot.canRedo}
              className={`${iconButtonBase} ${sizeStyle.button}`}
              title="Redo"
            >
              <Redo2 className={sizeStyle.icon} />
            </button>
            <button
              type="button"
              onClick={onToggleHidden}
              className={`${iconButtonBase} ${sizeStyle.button}`}
              title={snapshot.hidden ? "Show drawings" : "Hide drawings"}
            >
              {snapshot.hidden ? <Eye className={sizeStyle.icon} /> : <EyeOff className={sizeStyle.icon} />}
            </button>
            {edition.id !== "basic" ? (
              <button
                type="button"
                onClick={onRotateOrientation}
                className={`${iconButtonBase} ${sizeStyle.button}`}
                title={settings.toolbarOrientation === "vertical" ? "Rotate to horizontal" : "Rotate to vertical"}
              >
                <RefreshCcw className={sizeStyle.icon} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClear}
              className={`${iconButtonBase} ${sizeStyle.button}`}
              title="Clear"
            >
              <Trash2 className={sizeStyle.icon} />
            </button>
            {edition.id !== "basic" ? (
              <button
                type="button"
                onClick={onToggleClickThrough}
                className={`${iconButtonBase} ${sizeStyle.button} ${
                  snapshot.overlayMode === "click-through"
                    ? "border-[#3B82F6] bg-[rgba(59,130,246,0.16)] text-[#DBEAFE]"
                    : ""
                }`}
                title={
                  snapshot.overlayMode === "click-through"
                    ? "Return to draw mode"
                    : "Enable click-through"
                }
              >
                {snapshot.overlayMode === "click-through" ? (
                  <PenTool className={sizeStyle.icon} />
                ) : (
                  <MousePointerClick className={sizeStyle.icon} />
                )}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onToggleSettings}
              className={`${iconButtonBase} ${sizeStyle.button}`}
              title={unavailableShortcutCount > 0 ? `${unavailableShortcutCount} shortcut conflict(s)` : "Settings"}
            >
              <Settings2 className={sizeStyle.icon} />
            </button>
            {edition.id === "basic" ? (
              <button
                type="button"
                onClick={onQuit}
                className={`${iconButtonBase} ${sizeStyle.button} hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30`}
                title="Quit TRInk Basic"
              >
                <Power className={sizeStyle.icon} />
              </button>
            ) : null}
            {edition.id !== "basic" && unavailableShortcutCount > 0 ? (
              <div
                className={`rounded-full border border-[rgba(245,158,11,0.32)] bg-[rgba(146,64,14,0.22)] ${sizeStyle.pill} text-[#FDE68A]`}
                title="Some global shortcuts could not be registered."
              >
                {firstUnavailableShortcut ? `Shortcut conflict: ${firstUnavailableShortcut}` : "Shortcut conflict"}
              </div>
            ) : null}
            {startupState === "ready" ? (
              <div
                className={`rounded-full border border-[rgba(74,222,128,0.28)] bg-[rgba(20,83,45,0.22)] ${sizeStyle.pill} text-[#BBF7D0]`}
                title="TRInk is ready"
              >
                Ready
              </div>
            ) : null}
            {snapshot.timer.visible ? (
              <div
                className={`flex items-center gap-2 rounded-full border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] ${sizeStyle.pill} text-[#CBD5E1]`}
                title={`Timer ${snapshot.timer.status}`}
              >
                <Clock3 className="h-3.5 w-3.5" />
                <span className="tabular-nums">{formatTimerClock(snapshot.timer.remainingMs)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
