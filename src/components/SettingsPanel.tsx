import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { X } from "lucide-react";
import {
  DEFAULT_FIBONACCI_FAN_LEVELS,
  DEFAULT_FIBONACCI_RETRACEMENT_LEVELS,
  formatFibLevelLabel,
  normalizeFibLevels
} from "../lib/chart-patterns";
import type { MonitorOption } from "../lib/monitor-utils";
import type { EditablePropertiesPatch } from "../lib/object-editing";
import {
  buildDefaultShortcutBindings,
  captureShortcutFromKeyboardEvent,
  formatAcceleratorForDisplay,
  getDuplicateShortcutAction,
  getShortcutBindingsByCategory,
  getShortcutDefinition,
  getShortcutStatusMap,
  normalizeShortcutBindings,
  SHORTCUT_CATEGORY_LABELS,
  SHORTCUT_CATEGORY_ORDER,
  type ShortcutAction,
  type ShortcutRegistrationStatus
} from "../lib/shortcuts";
import {
  canFavoriteTool,
  DEFAULT_FAVORITE_TOOLS,
  getToolsByCategory,
  normalizeFavoriteTools,
  TOOL_CATEGORY_ORDER,
  TOOL_CATEGORY_LABELS,
  TOOL_DEFINITIONS
} from "../lib/tool-definitions";
import { formatTimerClock } from "../lib/timer";
import type { ToolbarSnapshot, SessionNotice } from "../lib/window-protocol";
import { DEFAULT_SETTINGS } from "../types/settings";
import type { AppSettings } from "../types/settings";
import { APP_BUILD_CHANNEL, APP_DISTRIBUTION, APP_PRODUCT_NAME, APP_PUBLISHER, APP_SHORT_NAME } from "../lib/app-meta";

type SettingsPanelProps = {
  open: boolean;
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  shortcutStatuses: ShortcutRegistrationStatus[];
  monitorOptions: MonitorOption[];
  snapshot: ToolbarSnapshot;
  sessionNotice: SessionNotice | null;
  appVersion: string;
  focusSection: "keybinds" | "about" | null;
  onFocusSectionHandled: () => void;
  onSaveSession: () => void;
  onLoadSession: () => void;
  onExportAnnotationsPng: () => void;
  onExportAnnotationsJson: () => void;
  onSetTimerVisibility: (visible: boolean) => void;
  onSetTimerPreset: (durationMs: number, preset: AppSettings["timerPreset"]) => void;
  onSetCustomTimerDuration: (durationMs: number) => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onUpdateTimerStyle: (patch: { size?: AppSettings["timerSize"]; opacity?: number }) => void;
  onUpdateSelectedObject: (patch: EditablePropertiesPatch) => void;
  onSetSelectedLocked: (locked: boolean) => void;
  onReorderSelected: (direction: "forward" | "backward" | "front" | "back") => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onClearSelection: () => void;
  onClose: () => void;
};

export function SettingsPanel({
  open,
  settings,
  setSettings,
  shortcutStatuses,
  monitorOptions,
  snapshot,
  sessionNotice,
  appVersion,
  focusSection,
  onFocusSectionHandled,
  onSaveSession,
  onLoadSession,
  onExportAnnotationsPng,
  onExportAnnotationsJson,
  onSetTimerVisibility,
  onSetTimerPreset,
  onSetCustomTimerDuration,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onUpdateTimerStyle,
  onUpdateSelectedObject,
  onSetSelectedLocked,
  onReorderSelected,
  onDeleteSelected,
  onDuplicateSelected,
  onClearSelection,
  onClose
}: SettingsPanelProps) {
  const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null);
  const [shortcutNotice, setShortcutNotice] = useState<string | null>(null);
  const [levelDraft, setLevelDraft] = useState("");
  const [levelNotice, setLevelNotice] = useState<string | null>(null);
  const keybindsRef = useRef<HTMLDivElement | null>(null);
  const aboutRef = useRef<HTMLDivElement | null>(null);

  const customMinutes = Math.floor(settings.timerDurationMs / 60_000);
  const customSeconds = Math.floor((settings.timerDurationMs % 60_000) / 1_000);
  const favoritePreview = normalizeFavoriteTools(settings.favoriteTools);
  const selectedLocked = snapshot.selectedObject?.locked === true;
  const selectedObject = snapshot.selectedObject;
  const shortcutStatusMap = useMemo(() => getShortcutStatusMap(shortcutStatuses), [shortcutStatuses]);
  const recentTools = settings.recentTools
    .map((toolId) => TOOL_DEFINITIONS.find((tool) => tool.id === toolId))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  const updateShortcut = (action: ShortcutAction, accelerator: string | null) => {
    const duplicate =
      accelerator !== null ? getDuplicateShortcutAction(settings.shortcuts, action, accelerator) : undefined;

    if (duplicate) {
      setShortcutNotice(
        `${duplicate.label} already uses ${formatAcceleratorForDisplay(duplicate.accelerator)}. Clear or change it first.`
      );
      return false;
    }

    setShortcutNotice(null);
    setSettings((current) => ({
      ...current,
      shortcuts: normalizeShortcutBindings(
        current.shortcuts.map((binding) =>
          binding.action === action
            ? {
                ...binding,
                accelerator,
                enabled: accelerator !== null
              }
            : binding
        )
      )
    }));
    return true;
  };

  const isSelectedFib =
    selectedObject?.type === "fibonacci_retracement" || selectedObject?.type === "fibonacci_fan";
  const isSelectedPitchfork = selectedObject?.type === "andrews_pitchfork";

  useEffect(() => {
    if (isSelectedFib && selectedObject?.levels) {
      setLevelDraft(selectedObject.levels.join(", "));
      setLevelNotice(null);
      return;
    }

    setLevelDraft("");
    setLevelNotice(null);
  }, [isSelectedFib, selectedObject?.id, selectedObject?.levels]);

  const applyLevelDraft = () => {
    if (!isSelectedFib || !selectedObject?.levels) {
      return;
    }

    const parsed = levelDraft
      .split(/[,\s]+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => Number(value));
    const fallback =
      selectedObject.type === "fibonacci_retracement"
        ? DEFAULT_FIBONACCI_RETRACEMENT_LEVELS
        : DEFAULT_FIBONACCI_FAN_LEVELS;
    const normalized = normalizeFibLevels(parsed, fallback);

    if (parsed.length === 0 || normalized.length === 0) {
      setLevelNotice("Enter one or more numeric Fibonacci levels separated by commas or spaces.");
      return;
    }

    if (parsed.some((value) => !Number.isFinite(value))) {
      setLevelNotice("Malformed Fibonacci levels were ignored. Only numeric values can be applied.");
    } else {
      setLevelNotice(null);
    }

    onUpdateSelectedObject({ levels: normalized });
    setLevelDraft(normalized.join(", "));
  };

  const resetShortcut = (action: ShortcutAction) => {
    const definition = getShortcutDefinition(action);
    if (!definition) {
      return;
    }

    setShortcutNotice(null);
    setSettings((current) => ({
      ...current,
      shortcuts: normalizeShortcutBindings(
        current.shortcuts.map((binding) =>
          binding.action === action
            ? {
                ...binding,
                accelerator: definition.defaultAccelerator,
                enabled: definition.defaultAccelerator !== null
              }
            : binding
        )
      )
    }));
  };

  useEffect(() => {
    if (!open || !recordingAction) {
      return;
    }

    const definition = getShortcutDefinition(recordingAction);
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (isTypingTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const result = captureShortcutFromKeyboardEvent(event, {
        requireModifier: definition?.global !== false
      });

      if (result.type === "cancel") {
        setRecordingAction(null);
        return;
      }

      if (result.type === "clear") {
        updateShortcut(recordingAction, null);
        setRecordingAction(null);
        return;
      }

      if (result.type === "ignore") {
        return;
      }

      if (result.type === "invalid") {
        setShortcutNotice(result.message);
        return;
      }

      if (updateShortcut(recordingAction, result.accelerator)) {
        setRecordingAction(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, recordingAction, setSettings, settings.shortcuts]);

  useEffect(() => {
    if (!open || !focusSection) {
      return;
    }

    const target = focusSection === "keybinds" ? keybindsRef.current : aboutRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    onFocusSectionHandled();
  }, [focusSection, onFocusSectionHandled, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-[rgba(148,163,184,0.22)] bg-[rgba(2,8,23,0.94)] p-5 shadow-[0_26px_60px_rgba(2,8,23,0.52)] backdrop-blur-xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <img src="/logo.svg" alt="TradeReality Ink" className="mt-0.5 h-10 w-10 rounded-xl" />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#94A3B8]">
              TradeReality Ink
            </div>
            <div className="mt-1 text-sm font-semibold text-[#E5E7EB]">
              Compact overlay controls
            </div>
            <div className="mt-1 text-xs text-[#94A3B8]">
              Toolbar and overlay preferences sync immediately.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] text-[#E5E7EB] transition hover:border-[rgba(148,163,184,0.3)]"
          onClick={onClose}
          title="Close settings"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <label className="block">
          <span className="mb-2 block text-[#94A3B8]">Toolbar size</span>
          <select
            value={settings.toolbarSize}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                toolbarSize: event.target.value as AppSettings["toolbarSize"]
              }))
            }
            className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[#94A3B8]">Toolbar opacity</span>
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
          <span className="mb-2 block text-[#94A3B8]">Drawing target monitor</span>
          <select
            value={settings.drawingTargetMonitor}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                drawingTargetMonitor: event.target.value as AppSettings["drawingTargetMonitor"]
              }))
            }
            className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
          >
            {monitorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[#94A3B8]">Default tool</span>
          <select
            value={settings.defaultTool}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                defaultTool: event.target.value as AppSettings["defaultTool"]
              }))
            }
            className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
          >
            {TOOL_CATEGORY_ORDER.map((category) => (
              <optgroup key={category} label={TOOL_CATEGORY_LABELS[category]}>
                {getToolsByCategory(category).map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-[#94A3B8]">Default color</span>
          <input
            type="color"
            value={settings.defaultColor}
            onChange={(event) => setSettings((current) => ({ ...current, defaultColor: event.target.value }))}
            className="h-11 w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] p-1"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[#94A3B8]">Stroke width</span>
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
          <span className="mb-2 block text-[#94A3B8]">Drawing opacity</span>
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
          <span className="mb-2 block text-[#94A3B8]">Startup mode</span>
          <select
            value={settings.defaultMode}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                defaultMode: event.target.value as AppSettings["defaultMode"]
              }))
            }
            className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
          >
            <option value="draw">Start in draw mode</option>
            <option value="click-through">Start in click-through mode</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-[#E5E7EB]">
        <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2">
          <input
            type="checkbox"
            checked={settings.showCursorHints}
            onChange={(event) =>
              setSettings((current) => ({ ...current, showCursorHints: event.target.checked }))
            }
          />
          <span>Show cursor hints</span>
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2">
          <input
            type="checkbox"
            checked={settings.showPatternLabels}
            onChange={(event) =>
              setSettings((current) => ({ ...current, showPatternLabels: event.target.checked }))
            }
          />
          <span>Show pattern labels</span>
        </label>
      </div>

      <div className="mt-5" ref={keybindsRef}>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#E5E7EB]">Keybinds</div>
            <div className="mt-1 text-xs text-[#94A3B8]">
              Global shortcuts re-register immediately. Focused local `V` still switches to Select while TRInk is focused.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShortcutNotice(null);
              setRecordingAction(null);
              setSettings((current) => ({ ...current, shortcuts: buildDefaultShortcutBindings() }));
            }}
            className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[11px] text-[#CBD5E1]"
          >
            Reset all shortcuts
          </button>
        </div>
        {shortcutNotice ? (
          <div className="mb-3 rounded-xl border border-[rgba(245,158,11,0.32)] bg-[rgba(146,64,14,0.22)] px-3 py-2 text-xs text-[#FDE68A]">
            {shortcutNotice}
          </div>
        ) : null}
        <div className="space-y-3">
          {SHORTCUT_CATEGORY_ORDER.map((category) => (
            <div
              key={category}
              className="rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3"
            >
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                {SHORTCUT_CATEGORY_LABELS[category]}
              </div>
              <div className="space-y-2">
                {getShortcutBindingsByCategory(settings.shortcuts, category).map((binding) => {
                  const status = shortcutStatusMap.get(binding.action);
                  const isRecording = recordingAction === binding.action;
                  return (
                    <div
                      key={binding.action}
                      className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-[#E5E7EB]">{binding.label}</div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${
                                status?.state === "unavailable"
                                  ? "border border-[rgba(248,113,113,0.28)] bg-[rgba(127,29,29,0.22)] text-[#FECACA]"
                                  : status?.state === "disabled"
                                    ? "border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] text-[#94A3B8]"
                                    : "border border-[rgba(74,222,128,0.28)] bg-[rgba(20,83,45,0.22)] text-[#BBF7D0]"
                              }`}
                            >
                              {status?.state ?? (binding.enabled ? "registered" : "disabled")}
                            </span>
                            {isRecording ? (
                              <span className="rounded-full border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#DBEAFE]">
                                Listening
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 text-xs text-[#94A3B8]">
                            {getShortcutDefinition(binding.action)?.description}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#CBD5E1]">
                            <span>Current: {formatAcceleratorForDisplay(binding.enabled ? binding.accelerator : null)}</span>
                            <span className="text-[#64748B]">
                              Default: {formatAcceleratorForDisplay(binding.defaultAccelerator)}
                            </span>
                          </div>
                          {status?.message ? (
                            <div className="mt-1 text-[11px] text-[#FCA5A5]">{status.message}</div>
                          ) : null}
                        </div>
                        <div className="grid shrink-0 grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShortcutNotice(null);
                              setRecordingAction((current) => (current === binding.action ? null : binding.action));
                            }}
                            className="rounded-lg border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-2 py-1.5 text-[11px] text-[#DBEAFE]"
                          >
                            {isRecording ? "Cancel" : "Change"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRecordingAction(null);
                              updateShortcut(binding.action, null);
                            }}
                            className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1.5 text-[11px] text-[#E5E7EB]"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRecordingAction(null);
                              resetShortcut(binding.action);
                            }}
                            className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1.5 text-[11px] text-[#E5E7EB]"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-sm font-medium text-[#E5E7EB]">Timer</div>
        <div className="rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#E5E7EB]">Manual countdown</div>
              <div className="mt-1 text-xs text-[#94A3B8]">
                Local only. No chart, broker, or platform time is read.
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-[#E5E7EB]">
              <input
                type="checkbox"
                checked={settings.timerVisible}
                onChange={(event) => onSetTimerVisibility(event.target.checked)}
              />
              <span>Show timer</span>
            </label>
          </div>
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] px-3 py-2">
            <div className="text-2xl font-semibold tabular-nums text-[#F8FAFC]">
              {formatTimerClock(snapshot.timer.remainingMs)}
            </div>
            <div className="text-right text-xs text-[#94A3B8]">
              <div>{snapshot.timer.status}</div>
              <div className="mt-1">{settings.timerPreset === "custom" ? "Custom" : settings.timerPreset}</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => onSetTimerPreset(60_000, "1m")}
              className="rounded-xl border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-3 py-2 text-xs font-medium text-[#DBEAFE]"
            >
              1m
            </button>
            <button
              type="button"
              onClick={() => onSetTimerPreset(300_000, "5m")}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-xs font-medium text-[#E5E7EB]"
            >
              5m
            </button>
            <button
              type="button"
              onClick={() => onSetTimerPreset(900_000, "15m")}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-xs font-medium text-[#E5E7EB]"
            >
              15m
            </button>
            <button
              type="button"
              onClick={() => onSetCustomTimerDuration(settings.timerDurationMs)}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-xs font-medium text-[#E5E7EB]"
            >
              Custom
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-[#94A3B8]">Custom minutes</span>
              <input
                type="number"
                min={0}
                max={1440}
                value={customMinutes}
                onChange={(event) => {
                  const minutes = Math.max(0, Number(event.target.value) || 0);
                  onSetCustomTimerDuration(Math.max(1_000, minutes * 60_000 + customSeconds * 1_000));
                }}
                className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[#94A3B8]">Custom seconds</span>
              <input
                type="number"
                min={0}
                max={59}
                value={customSeconds}
                onChange={(event) => {
                  const seconds = Math.max(0, Math.min(59, Number(event.target.value) || 0));
                  onSetCustomTimerDuration(Math.max(1_000, customMinutes * 60_000 + seconds * 1_000));
                }}
                className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
              />
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <label className="block">
              <span className="mb-2 block text-[#94A3B8]">Timer size</span>
              <select
                value={settings.timerSize}
                onChange={(event) =>
                  onUpdateTimerStyle({ size: event.target.value as AppSettings["timerSize"] })
                }
                className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-[#94A3B8]">Timer opacity</span>
              <input
                type="range"
                min={0.35}
                max={1}
                step={0.05}
                value={settings.timerOpacity}
                onChange={(event) => onUpdateTimerStyle({ opacity: Number(event.target.value) })}
                className="w-full"
              />
            </label>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={snapshot.timer.status === "paused" ? onResumeTimer : onStartTimer}
              className="rounded-xl border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-3 py-2 text-xs font-medium text-[#DBEAFE]"
            >
              {snapshot.timer.status === "paused" ? "Resume" : "Start"}
            </button>
            <button
              type="button"
              onClick={onPauseTimer}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-xs font-medium text-[#E5E7EB]"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={onResetTimer}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-xs font-medium text-[#E5E7EB]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => onSetTimerVisibility(!settings.timerVisible)}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-xs font-medium text-[#E5E7EB]"
            >
              {settings.timerVisible ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#E5E7EB]">Session</div>
            <div className="mt-1 text-xs text-[#94A3B8]">
              {snapshot.currentSessionName}
              {snapshot.isDirty ? (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Unsaved
                </span>
              ) : (
                <span className="ml-2 text-emerald-300">Saved</span>
              )}
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#64748B]">v{appVersion}</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onSaveSession}
            className="rounded-xl border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-3 py-2 text-sm font-medium text-[#DBEAFE]"
          >
            Save Session
          </button>
          <button
            type="button"
            onClick={onLoadSession}
            className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-sm font-medium text-[#E5E7EB]"
          >
            Load Session
          </button>
        </div>
        <div className="mt-2 text-xs text-[#64748B]">
          Sessions stay local only and use the `.trink.json` format.
        </div>
        {sessionNotice ? (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
              sessionNotice.status === "error"
                ? "border-[rgba(248,113,113,0.35)] bg-[rgba(127,29,29,0.22)] text-[#FECACA]"
                : sessionNotice.status === "success"
                  ? "border-[rgba(74,222,128,0.3)] bg-[rgba(20,83,45,0.22)] text-[#BBF7D0]"
                  : "border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] text-[#CBD5E1]"
            }`}
          >
            {sessionNotice.message}
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="mb-2 text-sm font-medium text-[#E5E7EB]">Export</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onExportAnnotationsPng}
            className="rounded-xl border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-3 py-2 text-sm font-medium text-[#DBEAFE]"
          >
            Export annotations PNG
          </button>
          <button
            type="button"
            onClick={onExportAnnotationsJson}
            className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-sm font-medium text-[#E5E7EB]"
          >
            Export annotations JSON
          </button>
        </div>
        <div className="mt-2 text-xs text-[#64748B]">
          Exports are created only when you trigger them. PNG export contains annotations only.
        </div>
      </div>

      {selectedObject ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#E5E7EB]">Selected object</div>
              <div className="mt-1 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#94A3B8]">
                <span>{selectedObject.type}</span>
                {selectedLocked ? (
                  <span className="rounded-full border border-[rgba(245,158,11,0.32)] bg-[rgba(146,64,14,0.22)] px-2 py-0.5 text-[10px] tracking-[0.12em] text-[#FDE68A]">
                    Locked
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[11px] text-[#CBD5E1]"
            >
              Clear selection
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <label className="block">
              <span className="mb-2 block text-[#94A3B8]">
                {selectedObject.text !== undefined ? "Text color" : "Stroke color"}
              </span>
              <input
                type="color"
                value={selectedObject.strokeColor ?? "#3B82F6"}
                disabled={selectedLocked}
                onChange={(event) => onUpdateSelectedObject({ strokeColor: event.target.value })}
                className="h-11 w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] p-1"
              />
            </label>
            {selectedObject.text === undefined ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Fill color</span>
                <input
                  type="color"
                  value={selectedObject.fillColor ?? selectedObject.strokeColor ?? "#3B82F6"}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ fillColor: event.target.value })}
                  className="h-11 w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] p-1"
                />
              </label>
            ) : null}
            <label className="block">
              <span className="mb-2 block text-[#94A3B8]">Stroke width</span>
              <input
                type="range"
                min={1}
                max={12}
                value={selectedObject.strokeWidth ?? 3}
                disabled={selectedLocked}
                onChange={(event) => onUpdateSelectedObject({ strokeWidth: Number(event.target.value) })}
                className="w-full"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[#94A3B8]">Opacity</span>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={selectedObject.opacity ?? 1}
                disabled={selectedLocked}
                onChange={(event) => onUpdateSelectedObject({ opacity: Number(event.target.value) })}
                className="w-full"
              />
            </label>
            {selectedObject.text !== undefined ? (
              <label className="col-span-2 block">
                <span className="mb-2 block text-[#94A3B8]">Text</span>
                <textarea
                  rows={4}
                  value={selectedObject.text}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ text: event.target.value })}
                  className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
                />
              </label>
            ) : null}
            {selectedObject.fontSize !== undefined ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Font size</span>
                <input
                  type="range"
                  min={8}
                  max={96}
                  value={selectedObject.fontSize}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ fontSize: Number(event.target.value) })}
                  className="w-full"
                />
              </label>
            ) : null}
            {selectedObject.fontWeight !== undefined ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Font weight</span>
                <select
                  value={selectedObject.fontWeight}
                  disabled={selectedLocked}
                  onChange={(event) =>
                    onUpdateSelectedObject({
                      fontWeight: event.target.value as "normal" | "medium" | "semibold" | "bold"
                    })
                  }
                  className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="semibold">Semibold</option>
                  <option value="bold">Bold</option>
                </select>
              </label>
            ) : null}
            {selectedObject.textAlign !== undefined ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Alignment</span>
                <select
                  value={selectedObject.textAlign}
                  disabled={selectedLocked}
                  onChange={(event) =>
                    onUpdateSelectedObject({
                      textAlign: event.target.value as "left" | "center" | "right"
                    })
                  }
                  className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            ) : null}
            {selectedObject.label !== undefined ? (
              <label className="col-span-2 block">
                <span className="mb-2 block text-[#94A3B8]">Label</span>
                <input
                  type="text"
                  value={selectedObject.label}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ label: event.target.value })}
                  className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
                />
              </label>
            ) : null}
            {selectedObject.showLabels !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.showLabels}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ showLabels: event.target.checked })}
                />
                <span>Show labels</span>
              </label>
            ) : null}
            {selectedObject.showNeckline !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.showNeckline}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ showNeckline: event.target.checked })}
                />
                <span>Show neckline</span>
              </label>
            ) : null}
            {selectedObject.showRetestZone !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.showRetestZone}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ showRetestZone: event.target.checked })}
                />
                <span>Show retest zone</span>
              </label>
            ) : null}
            {selectedObject.showDirectionArrow !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.showDirectionArrow}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ showDirectionArrow: event.target.checked })}
                />
                <span>Show direction arrow</span>
              </label>
            ) : null}
            {selectedObject.extendRight !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.extendRight}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ extendRight: event.target.checked })}
                />
                <span>Extend right</span>
              </label>
            ) : null}
            {selectedObject.extendLeft !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.extendLeft}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ extendLeft: event.target.checked })}
                />
                <span>Extend left</span>
              </label>
            ) : null}
            {selectedObject.showSweepMarker !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.showSweepMarker}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ showSweepMarker: event.target.checked })}
                />
                <span>Show sweep marker</span>
              </label>
            ) : null}
            {selectedObject.showPercentages !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.showPercentages}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ showPercentages: event.target.checked })}
                />
                <span>Show percentages</span>
              </label>
            ) : null}
            {selectedObject.showMedianLine !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.showMedianLine}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ showMedianLine: event.target.checked })}
                />
                <span>Show median line</span>
              </label>
            ) : null}
            {selectedObject.showOuterLines !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.showOuterLines}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ showOuterLines: event.target.checked })}
                />
                <span>Show outer lines</span>
              </label>
            ) : null}
            {selectedObject.showAnchorLine !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.showAnchorLine}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ showAnchorLine: event.target.checked })}
                />
                <span>Show anchor line</span>
              </label>
            ) : null}
            {selectedObject.backgroundEnabled !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.backgroundEnabled}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ backgroundEnabled: event.target.checked })}
                />
                <span>Background</span>
              </label>
            ) : null}
            {selectedObject.borderEnabled !== undefined ? (
              <label className="flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[#E5E7EB]">
                <input
                  type="checkbox"
                  checked={selectedObject.borderEnabled}
                  disabled={selectedLocked}
                  onChange={(event) => onUpdateSelectedObject({ borderEnabled: event.target.checked })}
                />
                <span>Border</span>
              </label>
            ) : null}
            {selectedObject.backgroundColor !== undefined ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Background color</span>
                <input
                  type="color"
                  value={selectedObject.backgroundColor}
                  disabled={selectedLocked || selectedObject.backgroundEnabled === false}
                  onChange={(event) => onUpdateSelectedObject({ backgroundColor: event.target.value })}
                  className="h-11 w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] p-1"
                />
              </label>
            ) : null}
            {selectedObject.backgroundOpacity !== undefined ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Background opacity</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={selectedObject.backgroundOpacity}
                  disabled={selectedLocked || selectedObject.backgroundEnabled === false}
                  onChange={(event) =>
                    onUpdateSelectedObject({ backgroundOpacity: Number(event.target.value) })
                  }
                  className="w-full"
                />
              </label>
            ) : null}
            {selectedObject.padding !== undefined ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Padding</span>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={selectedObject.padding}
                  disabled={
                    selectedLocked ||
                    (selectedObject.backgroundEnabled === false && selectedObject.borderEnabled === false)
                  }
                  onChange={(event) => onUpdateSelectedObject({ padding: Number(event.target.value) })}
                  className="w-full"
                />
              </label>
            ) : null}
            {selectedObject.borderColor !== undefined ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Border color</span>
                <input
                  type="color"
                  value={selectedObject.borderColor}
                  disabled={selectedLocked || selectedObject.borderEnabled === false}
                  onChange={(event) => onUpdateSelectedObject({ borderColor: event.target.value })}
                  className="h-11 w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] p-1"
                />
              </label>
            ) : null}
            {selectedObject.borderRadius !== undefined ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Border radius</span>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={selectedObject.borderRadius}
                  disabled={selectedLocked || selectedObject.borderEnabled === false}
                  onChange={(event) => onUpdateSelectedObject({ borderRadius: Number(event.target.value) })}
                  className="w-full"
                />
              </label>
            ) : null}
            {isSelectedPitchfork ? (
              <label className="block">
                <span className="mb-2 block text-[#94A3B8]">Pitchfork variant</span>
                <select
                  value={selectedObject.pitchforkVariant ?? "standard"}
                  disabled={selectedLocked}
                  onChange={(event) =>
                    onUpdateSelectedObject({
                      pitchforkVariant: event.target.value as "standard" | "schiff" | "modified_schiff"
                    })
                  }
                  className="w-full rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
                >
                  <option value="standard">Standard</option>
                  <option value="schiff">Schiff</option>
                  <option value="modified_schiff">Modified Schiff</option>
                </select>
              </label>
            ) : null}
            {isSelectedFib ? (
              <div className="col-span-2 rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#E5E7EB]">Fibonacci levels</div>
                    <div className="mt-1 text-[11px] text-[#94A3B8]">
                      Current labels: {(selectedObject.levels ?? []).map((level) => formatFibLevelLabel(level, selectedObject.showPercentages)).join(", ")}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={selectedLocked}
                    onClick={() =>
                      onUpdateSelectedObject({
                        levels:
                          selectedObject.type === "fibonacci_retracement"
                            ? DEFAULT_FIBONACCI_RETRACEMENT_LEVELS
                            : DEFAULT_FIBONACCI_FAN_LEVELS
                      })
                    }
                    className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[11px] text-[#CBD5E1]"
                  >
                    Reset levels
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={levelDraft}
                    disabled={selectedLocked}
                    onChange={(event) => setLevelDraft(event.target.value)}
                    placeholder="0, 0.236, 0.382, 0.5, 0.618..."
                    className="flex-1 rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.8)] px-3 py-2 text-[#E5E7EB]"
                  />
                  <button
                    type="button"
                    disabled={selectedLocked}
                    onClick={applyLevelDraft}
                    className="rounded-xl border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-3 py-2 text-sm font-medium text-[#DBEAFE]"
                  >
                    Apply
                  </button>
                </div>
                <div className="mt-2 text-[11px] text-[#64748B]">
                  Values are sorted, deduplicated, capped, and malformed entries are ignored safely.
                </div>
                {levelNotice ? (
                  <div className="mt-2 rounded-xl border border-[rgba(245,158,11,0.32)] bg-[rgba(146,64,14,0.22)] px-3 py-2 text-[11px] text-[#FDE68A]">
                    {levelNotice}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSetSelectedLocked(!selectedLocked)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                selectedLocked
                  ? "border-[rgba(245,158,11,0.32)] bg-[rgba(146,64,14,0.22)] text-[#FDE68A]"
                  : "border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] text-[#E5E7EB]"
              }`}
            >
              {selectedLocked ? "Unlock object" : "Lock object"}
            </button>
            <button
              type="button"
              onClick={onDuplicateSelected}
              className="rounded-xl border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-3 py-2 text-sm font-medium text-[#DBEAFE]"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => onReorderSelected("forward")}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-sm font-medium text-[#E5E7EB]"
            >
              Bring forward
            </button>
            <button
              type="button"
              onClick={() => onReorderSelected("backward")}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-sm font-medium text-[#E5E7EB]"
            >
              Send backward
            </button>
            <button
              type="button"
              onClick={() => onReorderSelected("front")}
              className="rounded-xl border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-3 py-2 text-sm font-medium text-[#DBEAFE]"
            >
              Bring to front
            </button>
            <button
              type="button"
              onClick={() => onReorderSelected("back")}
              className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-sm font-medium text-[#E5E7EB]"
            >
              Send to back
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={selectedLocked}
              className="rounded-xl border border-[rgba(248,113,113,0.28)] bg-[rgba(127,29,29,0.22)] px-3 py-2 text-sm font-medium text-[#FECACA]"
            >
              {selectedLocked ? "Unlock to delete" : "Delete selected"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <div className="mb-2 text-sm font-medium text-[#E5E7EB]">Favorite tools</div>
        <div className="mb-3 rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs text-[#94A3B8]">Favorites preview ({favoritePreview.length}/8)</div>
            <button
              type="button"
              onClick={() => setSettings((current) => ({ ...current, favoriteTools: normalizeFavoriteTools(DEFAULT_FAVORITE_TOOLS) }))}
              className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[11px] text-[#CBD5E1]"
            >
              Reset favorites
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {favoritePreview.map((toolId) => {
              const tool = TOOL_DEFINITIONS.find((entry) => entry.id === toolId);
              return tool ? (
                <span
                  key={tool.id}
                  className="rounded-full border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-2.5 py-1 text-[11px] text-[#DBEAFE]"
                >
                  {tool.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
        <div className="space-y-3">
          {TOOL_CATEGORY_ORDER.map((category) => (
            <div
              key={category}
              className="rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3"
            >
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                {TOOL_CATEGORY_LABELS[category]}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {getToolsByCategory(category)
                  .filter((tool) => canFavoriteTool(tool.id))
                  .map((tool) => {
                    const active = favoritePreview.includes(tool.id);
                    const disabled = !active && favoritePreview.length >= 8;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          setSettings((current) => {
                            const exists = current.favoriteTools.includes(tool.id);
                            const nextFavorites = exists
                              ? current.favoriteTools.filter((entry) => entry !== tool.id)
                              : normalizeFavoriteTools([...current.favoriteTools, tool.id]);
                            return { ...current, favoriteTools: nextFavorites };
                          })
                        }
                        className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                          active
                            ? "border-[#3B82F6] bg-[rgba(59,130,246,0.16)] text-[#DBEAFE]"
                            : "border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] text-[#94A3B8] hover:border-[rgba(148,163,184,0.28)]"
                        }`}
                        title={tool.description}
                      >
                        <div className="font-medium">{tool.label}</div>
                        <div className="mt-1 text-[10px] text-[#64748B]">{tool.description}</div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
        {recentTools.length > 0 ? (
          <div className="mt-3 rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              Recent tools
            </div>
            <div className="flex flex-wrap gap-2">
              {recentTools.map((tool) => (
                <span
                  key={tool.id}
                  className="rounded-full border border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] px-2.5 py-1 text-[11px] text-[#CBD5E1]"
                >
                  {tool.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div
        ref={aboutRef}
        className="mt-5 rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-4"
      >
        <div className="mb-3 text-sm font-medium text-[#E5E7EB]">About</div>
        <div className="flex items-start gap-3">
          <img src="/logo.svg" alt="TradeReality Ink" className="h-10 w-10 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-1 text-xs text-[#CBD5E1]">
            <div className="font-semibold text-[#E5E7EB]">{APP_PRODUCT_NAME}</div>
            <div>Short name: {APP_SHORT_NAME}</div>
            <div>Version: {appVersion}</div>
            <div>Build channel: {APP_BUILD_CHANNEL}</div>
            <div>Publisher: {APP_PUBLISHER}</div>
            <div>Distribution: {APP_DISTRIBUTION}</div>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] px-3 py-3 text-xs text-[#94A3B8]">
          Local-only overlay. No broker integration, no trading automation, no trading signals, no telemetry by default, no cloud sync, no Expiry UI.
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[#CBD5E1]">
          <div className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] px-3 py-2">
            Release docs: README, COMPATIBILITY, PRIVACY, EULA, plus beta handoff docs when packaged.
          </div>
          <div className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] px-3 py-2">
            Sessions and exports stay on the local machine only.
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSettings((current) => ({ ...current, welcomeDismissed: false }))}
            className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[11px] text-[#E5E7EB]"
          >
            Show welcome next launch
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-4 py-3 text-xs text-[#94A3B8]">
        <div>
          Click-through affects only the canvas window.
          <div className="mt-1 text-[#64748B]">Toolbar stays clickable on any monitor.</div>
        </div>
        <button
          type="button"
          className="rounded-xl border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.14)] px-3 py-2 font-medium text-[#E9D5FF]"
          onClick={() => setSettings(DEFAULT_SETTINGS)}
        >
          Reset settings
        </button>
      </div>
    </div>
  );
}
