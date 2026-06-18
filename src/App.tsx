import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  LogicalPosition,
  LogicalSize,
  PhysicalPosition,
  PhysicalSize,
  availableMonitors,
  getCurrentWindow,
  primaryMonitor
} from "@tauri-apps/api/window";
import { CanvasSurface } from "./components/CanvasSurface";
import { SettingsPanel } from "./components/SettingsPanel";
import { TimerOverlay } from "./components/TimerOverlay";
import { Toolbar } from "./components/Toolbar";
import { getCurrentEdition, getEditionCategoryLabel, getEditionCategoryOrder, getEditionTools, searchEditionTools } from "./editions/edition";
import { usePersistentSettings } from "./hooks/usePersistentSettings";
import { APP_PRODUCT_NAME, APP_SHORT_NAME, APP_VERSION } from "./lib/app-meta";
import {
  buildDefaultAnnotationsJsonFilename,
  buildDefaultAnnotationsPngFilename,
  createAnnotationsExportPayload,
  serializeAnnotationsExport
} from "./lib/export-format";
import {
  requestSaveAnnotationsJsonPath,
  requestSaveAnnotationsPngPath,
  writeBinaryExportFile,
  writeJsonExportFile
} from "./lib/export-file";
import { prepareAnnotationExportPlan, renderAnnotationsToPngBytes } from "./lib/export-renderer";
import {
  duplicateDrawable,
  getSelectedObjectSummary,
  patchDrawableProperties
} from "./lib/object-editing";
import {
  createMonitorOptions,
  getMonitorFrame,
  getDesktopBounds,
  resolveTargetMonitor,
  type MonitorOption
} from "./lib/monitor-utils";
import { buildShortcutConflictNotice } from "./lib/shortcuts";
import type { ShortcutRegistrationStatus } from "./lib/shortcuts";
import { addRecentTool, clampTimerPosition } from "./lib/settings-store";
import {
  createIdleTimerState,
  formatTimerClock,
  pauseTimer,
  resetTimer,
  resumeTimer,
  setTimerDuration,
  startTimer,
  tickTimer,
  type OverlayTimerState
} from "./lib/timer";
import {
  applyShortcutBindings,
  bringToolbarToFront,
  closePaletteWindow,
  closeSettingsWindow,
  getWindowMode,
  listenOverlayCommands,
  listenOverlayVisibility,
  listenPaletteCommands,
  listenSessionNotice,
  listenSettingsSync,
  listenToolbarCommands,
  listenToolbarSnapshot,
  listenTrayEvent,
  listenUiWindowBounds,
  publishUiWindowBounds,
  publishSettingsSync,
  publishSessionNotice,
  publishToolbarSnapshot,
  sendOverlayCommand,
  sendPaletteCommand,
  setClickThrough,
  togglePaletteWindow,
  toggleSettingsWindow
} from "./lib/tauri-bridge";
import {
  confirmSessionReplace,
  readSessionFile,
  requestOpenSessionPath,
  requestSaveSessionPath,
  writeSessionFile
} from "./lib/session-file";
import {
  buildDefaultSessionFilename,
  createSessionPayload,
  getSessionNameFromPath
} from "./lib/session-format";
import { getToolMode, TOOL_DEFINITIONS } from "./lib/tool-definitions";
import {
  TIMER_SIZE_COMPACT,
  TIMER_SIZE_NORMAL
} from "./lib/ui-constants";
import { clampWindowPositionToDesktop, getToolbarWindowSize, type ToolbarWindowState } from "./lib/window-layout";
import type { ToolbarSnapshot } from "./lib/window-protocol";
import { createInitialDrawingState, drawingReducer } from "./state/drawing-state";
import type { AppSettings, OverlayInteractionMode } from "./types/settings";
import type { SessionNotice } from "./lib/window-protocol";
import { Search } from "lucide-react";
import type { ToolKind } from "./types/drawables";
import type { UiWindowBounds, UiWindowBoundsSource } from "./lib/ui-window-bounds";

function getTimerBox(size: OverlayTimerState["size"]) {
  return size === "compact" ? TIMER_SIZE_COMPACT : TIMER_SIZE_NORMAL;
}

function getMonotonicNow() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return element?.tagName === "INPUT" || element?.tagName === "TEXTAREA" || element?.isContentEditable;
}

function useEscToCancelDrawing() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isTypingTarget(event.target)) {
        return;
      }
      sendOverlayCommand({ type: "cancel-active-drawing" }).catch(() => undefined);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

function usePublishCurrentWindowBounds(source: UiWindowBoundsSource) {
  useEffect(() => {
    let disposed = false;
    let unlistenMoved: (() => void) | undefined;
    let unlistenResized: (() => void) | undefined;
    const currentWindow = getCurrentWindow();

    const publishBounds = () => {
      Promise.all([currentWindow.outerPosition(), currentWindow.outerSize()])
        .then(([position, size]) => {
          if (disposed) {
            return;
          }

          const bounds: UiWindowBounds = {
            source,
            x: position.x,
            y: position.y,
            width: size.width,
            height: size.height
          };
          publishUiWindowBounds({ source, bounds }).catch(() => undefined);
        })
        .catch(() => undefined);
    };

    publishBounds();
    currentWindow.onMoved(() => publishBounds()).then((unlisten) => {
      unlistenMoved = unlisten;
    }).catch(() => undefined);
    currentWindow.onResized(() => publishBounds()).then((unlisten) => {
      unlistenResized = unlisten;
    }).catch(() => undefined);

    return () => {
      disposed = true;
      unlistenMoved?.();
      unlistenResized?.();
      publishUiWindowBounds({ source, bounds: null }).catch(() => undefined);
    };
  }, [source]);
}

const EDITION = getCurrentEdition();
function persistToolSelectionForEdition(
  current: AppSettings,
  tool: ToolKind,
  toolMode: ToolbarSnapshot["toolMode"]
) {
  if (EDITION.id === "basic") {
    return addRecentTool(current, tool);
  }

  return addRecentTool({ ...current, defaultTool: tool, toolMode }, tool);
}

// ---------------------------------------------------------------------------
// Overlay window
// ---------------------------------------------------------------------------

function OverlayWindowApp() {
  const { settings, setSettings } = usePersistentSettings();
  const [state, dispatch] = useReducer(
    drawingReducer,
    createInitialDrawingState(settings.defaultTool, settings.toolMode, settings.toolbarPosition)
  );
  const [timerState, setTimerState] = useState(() =>
    createIdleTimerState({
      visible: settings.timerVisible,
      durationMs: settings.timerDurationMs,
      position: clampTimerPosition(
        settings.timerPosition,
        { width: window.innerWidth, height: window.innerHeight },
        getTimerBox(settings.timerSize)
      ),
      size: settings.timerSize,
      opacity: settings.timerOpacity,
      preset: settings.timerPreset
    })
  );
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);
  const overlayModeRef = useRef(state.overlayMode);
  const applyingRemoteSettingsRef = useRef(false);
  const [cancelActiveDrawingSignal, setCancelActiveDrawingSignal] = useState(0);
  const [debugWindowInfo, setDebugWindowInfo] = useState<{
    outerX: number; outerY: number; outerW: number; outerH: number;
    innerW: number; innerH: number;
  } | null>(null);
  const [overlayViewport, setOverlayViewport] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
    pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
  }));
  const [uiWindowBounds, setUiWindowBounds] = useState<Record<UiWindowBoundsSource, UiWindowBounds | null>>({
    toolbar: null,
    palette: null,
    settings: null
  });

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { overlayModeRef.current = state.overlayMode; }, [state.overlayMode]);

  useEffect(() => {
    if (!settings.overlayDebugBounds) { setDebugWindowInfo(null); return; }
    const win = getCurrentWindow();
    const refresh = () => {
      Promise.all([win.outerPosition(), win.outerSize(), win.innerSize()])
        .then(([pos, outer, inner]) => {
          setDebugWindowInfo({ outerX: pos.x, outerY: pos.y, outerW: outer.width, outerH: outer.height, innerW: inner.width, innerH: inner.height });
        })
        .catch(() => undefined);
    };
    refresh();
    const timer = window.setInterval(refresh, 2000);
    return () => window.clearInterval(timer);
  }, [settings.overlayDebugBounds]);

  useEffect(() => {
    setTimerState((current) => {
      const clampedPosition = clampTimerPosition(
        settings.timerPosition,
        { width: window.innerWidth, height: window.innerHeight },
        getTimerBox(settings.timerSize)
      );
      const nextBase = {
        ...current,
        visible: settings.timerVisible,
        position: clampedPosition,
        size: settings.timerSize,
        opacity: settings.timerOpacity
      };
      if (
        current.durationMs !== settings.timerDurationMs ||
        current.preset !== settings.timerPreset
      ) {
        return setTimerDuration(nextBase, settings.timerDurationMs, settings.timerPreset);
      }
      return { ...nextBase, preset: settings.timerPreset };
    });
  }, [
    settings.timerDurationMs, settings.timerOpacity, settings.timerPosition,
    settings.timerPreset, settings.timerSize, settings.timerVisible
  ]);

  useEffect(() => {
    if (timerState.status !== "running") return;
    const timer = window.setInterval(() => {
      setTimerState((current) => tickTimer(current, getMonotonicNow()));
    }, 250);
    return () => window.clearInterval(timer);
  }, [timerState.status]);

  useEffect(() => {
    const syncTimerBounds = () => {
      setTimerState((current) => {
        const nextPosition = clampTimerPosition(
          current.position,
          { width: window.innerWidth, height: window.innerHeight },
          getTimerBox(current.size)
        );
        if (nextPosition.x === current.position.x && nextPosition.y === current.position.y) return current;
        setSettings((s) => ({ ...s, timerPosition: nextPosition }));
        return { ...current, position: nextPosition };
      });
    };
    window.addEventListener("resize", syncTimerBounds);
    return () => window.removeEventListener("resize", syncTimerBounds);
  }, [setSettings]);

  useEffect(() => { dispatch({ type: "set-tool", tool: settings.defaultTool }); }, [settings.defaultTool]);
  useEffect(() => { dispatch({ type: "set-tool-mode", mode: settings.toolMode }); }, [settings.toolMode]);

  useEffect(() => {
    dispatch({ type: "set-overlay-mode", mode: settings.defaultMode });
  }, [settings.defaultMode]);

  useEffect(() => {
    setClickThrough(state.overlayMode === "click-through").catch(() => undefined);
    bringToolbarToFront().catch(() => undefined);
  }, [state.overlayMode]);

  useEffect(() => {
    const snapshot: ToolbarSnapshot = {
      activeTool: state.activeTool,
      toolMode: state.toolMode,
      hidden: state.hidden,
      overlayMode: state.overlayMode,
      overlayVisible: state.overlayVisible,
      canUndo: state.undoStack.length > 0,
      canRedo: state.redoStack.length > 0,
      currentSessionName: state.currentSessionName,
      isDirty: state.isDirty,
      selectedObject: getSelectedObjectSummary(
        state.drawables.find((d) => d.id === state.selectedDrawableId) ?? null
      ),
      timer: {
        visible: timerState.visible,
        status: timerState.status,
        durationMs: timerState.durationMs,
        remainingMs: timerState.remainingMs,
        position: timerState.position,
        size: timerState.size,
        opacity: timerState.opacity,
        preset: timerState.preset
      },
      shortcutStatuses: []
    };
    publishToolbarSnapshot(snapshot).catch(() => undefined);
  }, [
    state.activeTool, state.currentSessionName, state.drawables, state.hidden,
    state.isDirty, state.overlayMode, state.overlayVisible, state.redoStack.length,
    state.selectedDrawableId, state.toolMode, state.undoStack.length, timerState
  ]);

  const sendSessionNotice = (notice: SessionNotice) => {
    publishSessionNotice(notice).catch(() => undefined);
  };

  const saveSession = async () => {
    const currentState = stateRef.current;
    const currentSettings = settingsRef.current;
    const now = new Date().toISOString();
    const defaultPath = currentState.currentSessionPath ?? buildDefaultSessionFilename(new Date());
    const selectedPath = await requestSaveSessionPath(defaultPath);
    if (!selectedPath) return;
    const sessionName = getSessionNameFromPath(selectedPath);
    try {
      const session = createSessionPayload({
        name: sessionName,
        drawings: currentState.drawables,
        drawingTargetMonitor: currentSettings.drawingTargetMonitor,
        canvasWidth: overlayViewport.width,
        canvasHeight: overlayViewport.height,
        createdAt: currentState.sessionCreatedAt ?? now,
        updatedAt: now
      });
      await writeSessionFile(selectedPath, session);
      dispatch({ type: "mark-saved", name: session.name, path: selectedPath, createdAt: session.createdAt });
      sendSessionNotice({ status: "success", message: `Saved ${session.name}.` });
    } catch (error) {
      sendSessionNotice({ status: "error", message: error instanceof Error ? error.message : "TRInk could not save the session." });
    }
  };

  const loadSession = async () => {
    const currentState = stateRef.current;
    const selectedPath = await requestOpenSessionPath();
    if (!selectedPath) return;
    if (currentState.isDirty) {
      const confirmed = await confirmSessionReplace();
      if (!confirmed) { sendSessionNotice({ status: "info", message: "Load cancelled." }); return; }
    }
    const result = await readSessionFile(selectedPath);
    if (!result.ok) {
      if ("cancelled" in result) return;
      sendSessionNotice({ status: "error", message: result.error });
      return;
    }
    const displayName = result.parsed.session.name || getSessionNameFromPath(result.path);
    dispatch({ type: "load-session", drawables: result.parsed.session.drawings, name: displayName, path: result.path, createdAt: result.parsed.session.createdAt });
    if (result.parsed.ignoredDrawables > 0) {
      sendSessionNotice({ status: "info", message: `Loaded ${displayName}. Some unsupported annotations were skipped (${result.parsed.ignoredDrawables}).` });
    } else {
      sendSessionNotice({ status: "success", message: `Loaded ${displayName}.` });
    }
  };

  const exportAnnotationsPng = async () => {
    const currentState = stateRef.current;
    const selectedPath = await requestSaveAnnotationsPngPath(buildDefaultAnnotationsPngFilename(new Date()));
    if (!selectedPath) return;
    try {
      const plan = prepareAnnotationExportPlan({ drawables: currentState.drawables, width: overlayViewport.width, height: overlayViewport.height, pixelRatio: overlayViewport.pixelRatio });
      const bytes = await renderAnnotationsToPngBytes({ drawables: currentState.drawables, width: overlayViewport.width, height: overlayViewport.height, pixelRatio: overlayViewport.pixelRatio });
      await writeBinaryExportFile(selectedPath, bytes);
      sendSessionNotice(plan.ignoredDrawables > 0 ? { status: "info", message: `Exported annotations PNG. Some unsupported annotations were skipped (${plan.ignoredDrawables}).` } : { status: "success", message: "Exported annotations PNG." });
    } catch (error) {
      sendSessionNotice({ status: "error", message: error instanceof Error ? error.message : "TRInk could not export the annotations PNG." });
    }
  };

  const exportAnnotationsJson = async () => {
    const currentState = stateRef.current;
    const selectedPath = await requestSaveAnnotationsJsonPath(buildDefaultAnnotationsJsonFilename(new Date()));
    if (!selectedPath) return;
    try {
      const exportResult = createAnnotationsExportPayload({ name: currentState.currentSessionName.replace(/\.trink$/i, ""), drawings: currentState.drawables });
      await writeJsonExportFile(selectedPath, serializeAnnotationsExport(exportResult.payload));
      sendSessionNotice(exportResult.ignoredDrawables > 0 ? { status: "info", message: `Exported annotations JSON. Some unsupported annotations were skipped (${exportResult.ignoredDrawables}).` } : { status: "success", message: "Exported annotations JSON." });
    } catch (error) {
      sendSessionNotice({ status: "error", message: error instanceof Error ? error.message : "TRInk could not export the annotations JSON." });
    }
  };

  const updateTimerPosition = (position: { x: number; y: number }) => {
    const nextPosition = clampTimerPosition(position, { width: overlayViewport.width, height: overlayViewport.height }, getTimerBox(timerState.size));
    setTimerState((current) => ({ ...current, position: nextPosition }));
  };

  const persistTimerPosition = (position: { x: number; y: number }) => {
    const nextPosition = clampTimerPosition(position, { width: overlayViewport.width, height: overlayViewport.height }, getTimerBox(timerState.size));
    setSettings((current) => ({ ...current, timerPosition: nextPosition }));
  };

  useEffect(() => {
    if (applyingRemoteSettingsRef.current) { applyingRemoteSettingsRef.current = false; return; }
    publishSettingsSync({ source: "overlay", settings }).catch(() => undefined);
  }, [settings]);

  useEffect(() => {
    let unlistenCommands: (() => void) | undefined;
    let unlistenVisibility: (() => void) | undefined;
    let unlistenSettings: (() => void) | undefined;
    let unlistenUiWindowBounds: (() => void) | undefined;
    let unlistenTrayEvent: (() => void) | undefined;

    listenTrayEvent((eventName) => {
      if (EDITION.id !== "basic") return;
      
      switch (eventName) {
        case "enable-click-through":
          dispatch({ type: "select-drawable", id: null });
          dispatch({ type: "set-tool", tool: "select" });
          dispatch({ type: "set-overlay-mode", mode: "click-through" });
          bringToolbarToFront().catch(() => undefined);
          break;
        case "disable-click-through":
          dispatch({ type: "set-tool", tool: "select" });
          dispatch({ type: "set-overlay-mode", mode: "draw" });
          bringToolbarToFront().catch(() => undefined);
          break;
        case "clear-drawings":
          dispatch({ type: "clear" });
          bringToolbarToFront().catch(() => undefined);
          break;
      }
    }).then((u) => { unlistenTrayEvent = u; }).catch(() => undefined);

    listenOverlayCommands((payload) => {
      switch (payload.type) {
        case "set-tool":
          dispatch({ type: "set-tool", tool: payload.tool });
          setSettings((current) => addRecentTool(current, payload.tool));
          bringToolbarToFront().catch(() => undefined);
          if (payload.tool !== "select" && overlayModeRef.current === "click-through") {
            dispatch({ type: "set-overlay-mode", mode: "draw" });
            // Do NOT update settings.defaultMode here. Keeping defaultMode as the user's
            // stored preference prevents the next settings-sync from toolbar (which still
            // carries the old "click-through" value) from reverting the overlay back to
            // click-through mode before the first drawing click arrives.
          }
          break;
        case "set-tool-mode":
          dispatch({ type: "set-tool-mode", mode: payload.mode });
          setSettings((current) => ({ ...current, toolMode: payload.mode }));
          break;
        case "toggle-click-through": {
          const nextMode: OverlayInteractionMode = overlayModeRef.current === "draw" ? "click-through" : "draw";
          dispatch({ type: "set-overlay-mode", mode: nextMode });
          setSettings((current) => ({ ...current, defaultMode: nextMode }));
          break;
        }
        case "set-click-through": {
          const nextMode: OverlayInteractionMode = payload.enabled ? "click-through" : "draw";
          dispatch({ type: "set-overlay-mode", mode: nextMode });
          setSettings((current) => ({ ...current, defaultMode: nextMode }));
          break;
        }
        case "activate-basic-pass-mode": {
          dispatch({ type: "select-drawable", id: null });
          dispatch({ type: "set-tool", tool: "select" });
          dispatch({ type: "set-tool-mode", mode: "basic" });
          dispatch({ type: "set-overlay-mode", mode: "click-through" });
          setSettings((current) => ({ ...current, defaultMode: "click-through", toolMode: "basic" }));
          bringToolbarToFront().catch(() => undefined);
          break;
        }
        case "activate-basic-edit-mode": {
          dispatch({ type: "set-tool", tool: "select" });
          dispatch({ type: "set-tool-mode", mode: "basic" });
          dispatch({ type: "set-overlay-mode", mode: "draw" });
          setSettings((current) => ({ ...current, defaultMode: "draw", toolMode: "basic" }));
          bringToolbarToFront().catch(() => undefined);
          break;
        }
        case "complete-basic-drawable": {
          dispatch({ type: "select-drawable", id: null });
          dispatch({ type: "set-tool", tool: "select" });
          dispatch({ type: "set-tool-mode", mode: "basic" });
          dispatch({ type: "set-overlay-mode", mode: "draw" });
          setSettings((current) => ({ ...current, defaultMode: "draw", toolMode: "basic" }));
          bringToolbarToFront().catch(() => undefined);
          break;
        }
        case "activate-basic-drawable-tool": {
          dispatch({ type: "select-drawable", id: null });
          dispatch({ type: "set-tool", tool: payload.tool });
          dispatch({ type: "set-tool-mode", mode: "basic" });
          dispatch({ type: "set-overlay-mode", mode: "draw" });
          setSettings((current) => addRecentTool({ ...current, defaultMode: "draw", toolMode: "basic" }, payload.tool));
          bringToolbarToFront().catch(() => undefined);
          break;
        }
        case "undo": dispatch({ type: "undo" }); break;
        case "redo": dispatch({ type: "redo" }); break;
        case "clear": dispatch({ type: "clear" }); break;
        case "save-session": void saveSession(); break;
        case "load-session": void loadSession(); break;
        case "update-selected-object": {
          const current = stateRef.current.drawables.find((d) => d.id === payload.id);
          if (!current || current.id !== stateRef.current.selectedDrawableId) break;
          dispatch({ type: "replace-selected-drawable", drawable: patchDrawableProperties(current, payload.patch) });
          break;
        }
        case "set-selected-locked": dispatch({ type: "set-selected-locked", locked: payload.locked }); break;
        case "reorder-selected": dispatch({ type: "reorder-selected", direction: payload.direction }); break;
        case "duplicate-selected": {
          const current = stateRef.current.drawables.find((d) => d.id === stateRef.current.selectedDrawableId);
          if (current) dispatch({ type: "duplicate-drawable", drawable: duplicateDrawable(current) });
          break;
        }
        case "clear-selection": dispatch({ type: "select-drawable", id: null }); break;
        case "delete-selected": dispatch({ type: "delete-selected" }); break;
        case "export-annotations-png": void exportAnnotationsPng(); break;
        case "export-annotations-json": void exportAnnotationsJson(); break;
        case "toggle-hidden": dispatch({ type: "toggle-hidden" }); break;
        case "set-timer-visible":
          if (!EDITION.features.timer) break;
          setTimerState((current) => ({ ...current, visible: payload.visible }));
          setSettings((current) => ({ ...current, timerVisible: payload.visible }));
          break;
        case "toggle-timer-visible":
          if (!EDITION.features.timer) break;
          setTimerState((current) => ({ ...current, visible: !current.visible }));
          setSettings((current) => ({ ...current, timerVisible: !current.timerVisible }));
          break;
        case "set-timer-duration":
          if (!EDITION.features.timer) break;
          setTimerState((current) => setTimerDuration(current, payload.durationMs, payload.preset));
          setSettings((current) => ({ ...current, timerDurationMs: payload.durationMs, timerPreset: payload.preset }));
          break;
        case "start-timer":
          if (!EDITION.features.timer) break;
          setTimerState((current) => startTimer(current, getMonotonicNow()));
          break;
        case "toggle-timer-start-pause":
          if (!EDITION.features.timer) break;
          setTimerState((current) => {
            if (current.status === "running") return pauseTimer(current, getMonotonicNow());
            if (current.status === "paused") return resumeTimer(current, getMonotonicNow());
            return startTimer(current, getMonotonicNow());
          });
          break;
        case "pause-timer":
          if (!EDITION.features.timer) break;
          setTimerState((current) => pauseTimer(current, getMonotonicNow()));
          break;
        case "resume-timer":
          if (!EDITION.features.timer) break;
          setTimerState((current) => resumeTimer(current, getMonotonicNow()));
          break;
        case "reset-timer":
          if (!EDITION.features.timer) break;
          setTimerState((current) => resetTimer(current));
          break;
        case "update-timer-position": {
          if (!EDITION.features.timer) break;
          const nextPosition = clampTimerPosition(payload.position, { width: window.innerWidth, height: window.innerHeight }, getTimerBox(settingsRef.current.timerSize));
          setTimerState((current) => ({ ...current, position: nextPosition }));
          setSettings((current) => ({ ...current, timerPosition: nextPosition }));
          break;
        }
        case "update-timer-style":
          if (!EDITION.features.timer) break;
          setTimerState((current) => ({ ...current, size: payload.size ?? current.size, opacity: payload.opacity ?? current.opacity }));
          setSettings((current) => ({ ...current, timerSize: payload.size ?? current.timerSize, timerOpacity: payload.opacity ?? current.timerOpacity }));
          break;
        case "cancel-active-drawing": setCancelActiveDrawingSignal((s) => s + 1); break;
        case "set-settings-open": break;
      }
    }).then((u) => { unlistenCommands = u; }).catch(() => undefined);

    listenOverlayVisibility((visible) => {
      dispatch({ type: "set-overlay-visible", visible });
    }).then((u) => { unlistenVisibility = u; }).catch(() => undefined);

    listenSettingsSync((payload) => {
      if (payload.source === "overlay") return;
      applyingRemoteSettingsRef.current = true;
      setSettings(payload.settings);
    }).then((u) => { unlistenSettings = u; }).catch(() => undefined);

    listenUiWindowBounds((payload) => {
      setUiWindowBounds((current) => ({ ...current, [payload.source]: payload.bounds }));
    }).then((u) => { unlistenUiWindowBounds = u; }).catch(() => undefined);

    return () => { unlistenCommands?.(); unlistenVisibility?.(); unlistenSettings?.(); unlistenUiWindowBounds?.(); unlistenTrayEvent?.(); };
  }, [setSettings]);

  useEffect(() => {
    const applyMonitorBounds = async () => {
      const monitors = await availableMonitors();
      const primary = await primaryMonitor();
      const options = createMonitorOptions(monitors, primary);
      const target = resolveTargetMonitor(settings.drawingTargetMonitor, options)
        ?? (monitors.length > 0 ? monitors[0] : null);
      if (!target) return;
      const frame = getMonitorFrame(target);
      const win = getCurrentWindow();
      await win.setPosition(new PhysicalPosition(target.position.x, target.position.y));
      await win.setSize(new PhysicalSize(target.size.width, target.size.height));
      await bringToolbarToFront().catch(() => undefined);
      const nextTimerPosition = clampTimerPosition(settingsRef.current.timerPosition, { width: frame.width, height: frame.height }, getTimerBox(settingsRef.current.timerSize));
      setTimerState((current) => ({ ...current, position: nextTimerPosition }));
      if (settingsRef.current.timerPosition.x !== nextTimerPosition.x || settingsRef.current.timerPosition.y !== nextTimerPosition.y) {
        setSettings((current) => ({ ...current, timerPosition: nextTimerPosition }));
      }
    };
    applyMonitorBounds().catch(() => undefined);
  }, [settings.drawingTargetMonitor]);


  useEffect(() => {
    if (import.meta.env.DEV) {
      const isPass = state.overlayMode === "click-through";
      console.log(`[TRInk Basic Input] activeTool=${state.activeTool} overlayMode=${isPass ? "pass" : "draw"} requestedClickThrough=${isPass} appliedClickThrough=${isPass}`);
    }
  }, [state.activeTool, state.overlayMode]);

  return (
    <main className="overlay-root bg-transparent">
      <div
        className="absolute inset-0"
        style={{ pointerEvents: state.overlayMode === "draw" && state.overlayVisible ? "auto" : "none" }}
      >
        <CanvasSurface
          state={state}
          dispatch={dispatch}
          settings={settings}
          onViewportChange={setOverlayViewport}
          cancelActiveDrawingSignal={cancelActiveDrawingSignal}
          debugWindowInfo={debugWindowInfo}
          onInteractionEnd={(type, tool) => {
            if (EDITION.id === "basic") {
              if (type === "cancel") {
                sendOverlayCommand({ type: "activate-basic-edit-mode" }).catch(() => undefined);
              } else if (type === "commit") {
                sendOverlayCommand({ type: "complete-basic-drawable", tool }).catch(() => undefined);
              }
            }
          }}
          uiWindowBounds={Object.values(uiWindowBounds).filter((bounds): bounds is UiWindowBounds => bounds !== null)}
          showPersistentCursorHints={EDITION.id !== "basic"}
        />
      </div>
      {EDITION.features.timer && timerState.visible ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          <TimerOverlay
            timer={timerState}
            onStart={() => setTimerState((current) => startTimer(current, getMonotonicNow()))}
            onPause={() => setTimerState((current) => pauseTimer(current, getMonotonicNow()))}
            onResume={() => setTimerState((current) => resumeTimer(current, getMonotonicNow()))}
            onReset={() => setTimerState((current) => resetTimer(current))}
            onMove={updateTimerPosition}
            onMoveEnd={persistTimerPosition}
          />
        </div>
      ) : null}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Toolbar window
// ---------------------------------------------------------------------------

function ToolbarWindowApp() {
  const { settings, setSettings } = usePersistentSettings();
  useEscToCancelDrawing();
  usePublishCurrentWindowBounds("toolbar");
  const [sessionNotice, setSessionNotice] = useState<SessionNotice | null>(null);
  const [shortcutStatuses, setShortcutStatuses] = useState<ShortcutRegistrationStatus[]>([]);
  const [launchState, setLaunchState] = useState<"starting" | "ready" | "error" | "idle">("starting");
  const [launchMessage, setLaunchMessage] = useState(`Starting ${APP_SHORT_NAME}...`);
  const [hasReceivedSnapshot, setHasReceivedSnapshot] = useState(false);
  const [monitorOptions] = useState<MonitorOption[]>([{ id: "auto", label: "Auto / Primary monitor", monitor: null }]);
  const [desktopBounds, setDesktopBounds] = useState({
    x: 0, y: 0,
    width: typeof window !== "undefined" ? window.screen.availWidth : 1920,
    height: typeof window !== "undefined" ? window.screen.availHeight : 1080
  });
  const [snapshot, setSnapshot] = useState<ToolbarSnapshot>({
    activeTool: settings.defaultTool,
    toolMode: settings.toolMode,
    hidden: false,
    overlayMode: settings.defaultMode,
    overlayVisible: true,
    canUndo: false,
    canRedo: false,
    currentSessionName: "Untitled session",
    isDirty: false,
    selectedObject: null,
    shortcutStatuses: [],
    timer: {
      visible: settings.timerVisible,
      status: "idle",
      durationMs: settings.timerDurationMs,
      remainingMs: settings.timerDurationMs,
      position: settings.timerPosition,
      size: settings.timerSize,
      opacity: settings.timerOpacity,
      preset: settings.timerPreset
    }
  });
  const applyingRemoteSettingsRef = useRef(false);
  const applyingNativeFrameRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ screenX: 0, screenY: 0, winX: 0, winY: 0 });
  const dragRafRef = useRef<number | null>(null);
  const reportedShortcutConflictsRef = useRef(new Set<string>());
  const autoOpenedSettingsRef = useRef(false);

  const toolbarWindowState: ToolbarWindowState =
    launchState === "starting" || launchState === "error"
      ? "startup"
      : sessionNotice
        ? (settings.toolbarSize === "normal" ? "normal-notice" : "compact-notice")
        : settings.toolbarSize === "normal"
          ? "normal"
          : "compact";

  const windowSize = useMemo(
    () => getToolbarWindowSize(settings.toolbarSize, toolbarWindowState, EDITION.id),
    [settings.toolbarSize, toolbarWindowState]
  );

  // Auto-open settings window on first install (welcomeDismissed is false)
  useEffect(() => {
    if (!autoOpenedSettingsRef.current && !settings.welcomeDismissed && launchState === "idle") {
      autoOpenedSettingsRef.current = true;
      toggleSettingsWindow(settings.toolbarPosition.x, settings.toolbarPosition.y + 100).catch(() => undefined);
      publishSettingsSync({ source: "toolbar", settings }).catch(() => undefined);
    }
  }, [launchState, settings.welcomeDismissed, settings.toolbarPosition, settings]);

  useEffect(() => {
    const refreshMonitors = async () => {
      const monitors = await availableMonitors();
      const primary = await primaryMonitor();
      setDesktopBounds(getDesktopBounds(monitors));
      monitorOptions.length = 0;
      monitorOptions.push(...createMonitorOptions(monitors, primary));
    };
    refreshMonitors().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (launchState !== "ready") return;
    const timer = window.setTimeout(() => { setLaunchState("idle"); setLaunchMessage(""); }, 1600);
    return () => window.clearTimeout(timer);
  }, [launchState]);

  useEffect(() => {
    if (hasReceivedSnapshot) return;
    const timer = window.setTimeout(() => {
      if (!hasReceivedSnapshot) { setLaunchState("error"); setLaunchMessage("Waiting for overlay..."); }
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [hasReceivedSnapshot]);

  useEffect(() => {
    if (applyingRemoteSettingsRef.current) { applyingRemoteSettingsRef.current = false; return; }
    publishSettingsSync({ source: "toolbar", settings }).catch(() => undefined);
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    applyShortcutBindings(settings.shortcuts)
      .then((statuses) => {
        if (!cancelled) setShortcutStatuses(statuses);
      })
      .catch((error) => {
        if (cancelled) return;
        setShortcutStatuses(settings.shortcuts.map((binding) => ({
          action: binding.action,
          accelerator: binding.enabled ? binding.accelerator : null,
          state: binding.enabled && binding.accelerator ? "unavailable" : "disabled",
          message: error instanceof Error ? error.message : "TRInk could not update the global shortcuts."
        })));
      });
    return () => { cancelled = true; };
  }, [settings.shortcuts]);

  useEffect(() => {
    if (EDITION.id === "basic") return;
    const conflictNotice = buildShortcutConflictNotice(shortcutStatuses, reportedShortcutConflictsRef.current);
    if (!conflictNotice) return;
    setSessionNotice({ status: "info", message: conflictNotice.message });
  }, [shortcutStatuses]);

  // Broadcast shortcut statuses to settings window via snapshot
  useEffect(() => {
    setSnapshot((current) => ({ ...current, shortcutStatuses }));
  }, [shortcutStatuses]);

  useEffect(() => {
    const currentWindow = getCurrentWindow();
    const clamped = clampWindowPositionToDesktop(settings.toolbarPosition, desktopBounds, windowSize, settings.toolbarPosition);
    applyingNativeFrameRef.current = true;
    currentWindow.setSize(new LogicalSize(windowSize.width, windowSize.height)).catch(() => undefined);
    currentWindow.setPosition(new LogicalPosition(clamped.x, clamped.y)).catch(() => undefined);
    window.setTimeout(() => { applyingNativeFrameRef.current = false; }, 160);
    if (settings.toolbarPosition.x !== clamped.x || settings.toolbarPosition.y !== clamped.y) {
      setSettings((current) => ({ ...current, toolbarPosition: clamped }));
    }
  }, [desktopBounds, setSettings, settings.toolbarPosition, windowSize]);

  useEffect(() => {
    if (!sessionNotice) return;
    const timer = window.setTimeout(() => setSessionNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [sessionNotice]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTypingTarget(event.target) && event.key.toLowerCase() === "v") {
        setSettings((current) => addRecentTool({ ...current, defaultTool: "select", toolMode: "basic" }, "select"));
        sendOverlayCommand({ type: "set-tool", tool: "select" }).catch(() => undefined);
        sendOverlayCommand({ type: "set-tool-mode", mode: "basic" }).catch(() => undefined);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let unlistenMoved: (() => void) | undefined;
    let unlistenSnapshot: (() => void) | undefined;
    let unlistenPalette: (() => void) | undefined;
    let unlistenSettings: (() => void) | undefined;
    let unlistenVisibility: (() => void) | undefined;
    let unlistenNotice: (() => void) | undefined;
    const currentWindow = getCurrentWindow();

    currentWindow.onMoved(({ payload }) => {
      if (applyingNativeFrameRef.current) return;
      setSettings((current) => {
        if (current.toolbarPosition.x === payload.x && current.toolbarPosition.y === payload.y) return current;
        return { ...current, toolbarPosition: { x: payload.x, y: payload.y } };
      });
    }).then((u) => { unlistenMoved = u; }).catch(() => undefined);

    listenToolbarSnapshot((nextSnapshot) => {
      if (!hasReceivedSnapshot) { setHasReceivedSnapshot(true); setLaunchState("ready"); setLaunchMessage("Ready"); }
      setSnapshot((current) => ({ ...nextSnapshot, shortcutStatuses: current.shortcutStatuses }));
    }).then((u) => { unlistenSnapshot = u; }).catch(() => undefined);

    listenPaletteCommands((command) => {
      if (command.type === "select-tool") {
        const tool = command.tool;
        const toolMode = getToolMode(tool);
        setSettings((current) => persistToolSelectionForEdition(current, tool, toolMode));
        sendOverlayCommand({ type: "set-tool", tool }).catch(() => undefined);
        sendOverlayCommand({ type: "set-tool-mode", mode: toolMode }).catch(() => undefined);
      } else if (command.type === "set-tool-mode") {
        setSettings((current) => ({ ...current, toolMode: command.mode }));
        sendOverlayCommand({ type: "set-tool-mode", mode: command.mode }).catch(() => undefined);
      }
    }).then((u) => { unlistenPalette = u; }).catch(() => undefined);

    listenToolbarCommands(() => {
      // settings command now handled by Rust directly opening the settings window
    }).then((u) => { unlistenSettings = u; }).catch(() => undefined);

    listenSettingsSync((payload) => {
      if (payload.source === "toolbar") return;
      applyingRemoteSettingsRef.current = true;
      setSettings(payload.settings);
    }).then((u) => { unlistenSettings = u; }).catch(() => undefined);

    listenOverlayVisibility((visible) => {
      setSnapshot((current) => ({ ...current, overlayVisible: visible }));
    }).then((u) => { unlistenVisibility = u; }).catch(() => undefined);

    listenSessionNotice((notice) => {
      setSessionNotice(notice);
    }).then((u) => { unlistenNotice = u; }).catch(() => undefined);

    return () => {
      unlistenMoved?.(); unlistenSnapshot?.(); unlistenPalette?.();
      unlistenSettings?.(); unlistenVisibility?.(); unlistenNotice?.();
    };
  }, [desktopBounds, hasReceivedSnapshot, setSettings, windowSize]);

  const handleDragPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    applyingNativeFrameRef.current = true;
    dragStartRef.current = {
      screenX: e.screenX, screenY: e.screenY,
      winX: settings.toolbarPosition.x, winY: settings.toolbarPosition.y
    };
  };

  const handleDragPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.screenX - dragStartRef.current.screenX;
    const dy = e.screenY - dragStartRef.current.screenY;
    const raw = { x: dragStartRef.current.winX + dx, y: dragStartRef.current.winY + dy };
    const clamped = clampWindowPositionToDesktop(raw, desktopBounds, windowSize, raw);
    if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      getCurrentWindow().setPosition(new LogicalPosition(clamped.x, clamped.y)).catch(() => undefined);
    });
  };

  const handleDragPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    if (dragRafRef.current !== null) { cancelAnimationFrame(dragRafRef.current); dragRafRef.current = null; }
    isDraggingRef.current = false;
    applyingNativeFrameRef.current = false;
    const dx = e.screenX - dragStartRef.current.screenX;
    const dy = e.screenY - dragStartRef.current.screenY;
    const raw = { x: dragStartRef.current.winX + dx, y: dragStartRef.current.winY + dy };
    const clamped = clampWindowPositionToDesktop(raw, desktopBounds, windowSize, raw);
    setSettings((current) => ({ ...current, toolbarPosition: clamped }));
  };

  const openPalette = () => {
    if (EDITION.id === "basic") return;
    const pos = settings.toolbarPosition;
    togglePaletteWindow(pos.x, pos.y + windowSize.height + 8).catch(() => undefined);
    publishSettingsSync({ source: "toolbar", settings }).catch(() => undefined);
  };

  const openSettings = () => {
    const pos = settings.toolbarPosition;
    toggleSettingsWindow(pos.x + windowSize.width + 12, pos.y).catch(() => undefined);
    publishSettingsSync({ source: "toolbar", settings }).catch(() => undefined);
    publishToolbarSnapshot({ ...snapshot, shortcutStatuses }).catch(() => undefined);
  };

  const quitApp = () => {
    invoke("quit_app").catch(() => undefined);
  };

  const activateTool = (tool: ToolKind) => {
    setSettings((current) => persistToolSelectionForEdition(current, tool, getToolMode(tool)));
    if (EDITION.id === "basic") {
      if (tool === "select") {
        sendOverlayCommand({ type: "activate-basic-edit-mode" }).catch(() => undefined);
      } else {
        sendOverlayCommand({ type: "activate-basic-drawable-tool", tool }).catch(() => undefined);
      }
    } else {
      sendOverlayCommand({ type: "set-tool", tool }).catch(() => undefined);
      bringToolbarToFront().catch(() => undefined);
    }
  };

  return (
    <main className="h-full w-full bg-transparent p-3">
      <div className="space-y-3">
        <Toolbar
          snapshot={snapshot}
          settings={settings}
          shortcutStatuses={shortcutStatuses}
          startupState={launchState}
          startupMessage={launchMessage}
          edition={EDITION}
          onSetTool={activateTool}
          onSetToolMode={(mode) => {
            setSettings((current) => ({ ...current, toolMode: mode }));
            sendOverlayCommand({ type: "set-tool-mode", mode }).catch(() => undefined);
          }}
          onOpenPalette={openPalette}
          onUndo={() => sendOverlayCommand({ type: "undo" }).catch(() => undefined)}
          onRedo={() => sendOverlayCommand({ type: "redo" }).catch(() => undefined)}
          onClear={() => sendOverlayCommand({ type: "clear" }).catch(() => undefined)}
          onToggleHidden={() => sendOverlayCommand({ type: "toggle-hidden" }).catch(() => undefined)}
          onToggleClickThrough={() => {
            if (EDITION.id === "basic") {
              if (snapshot.overlayMode === "click-through") {
                sendOverlayCommand({ type: "activate-basic-edit-mode" }).catch(() => undefined);
              } else {
                sendOverlayCommand({ type: "activate-basic-pass-mode" }).catch(() => undefined);
              }
            } else {
              sendOverlayCommand({ type: "toggle-click-through" }).catch(() => undefined);
              bringToolbarToFront().catch(() => undefined);
            }
          }}
          onToggleSettings={openSettings}
          onRotateOrientation={() => {
            setSettings((current) => ({
              ...current,
              toolbarOrientation: current.toolbarOrientation === "vertical" ? "horizontal" : "vertical"
            }));
          }}
          onQuit={quitApp}
          onDragPointerDown={handleDragPointerDown}
          onDragPointerMove={handleDragPointerMove}
          onDragPointerUp={handleDragPointerUp}
        />
        {sessionNotice ? (
          <div
            className={`rounded-2xl border px-3 py-2 text-xs shadow-[0_16px_40px_rgba(2,8,23,0.38)] backdrop-blur-xl ${
              sessionNotice.status === "error"
                ? "border-[rgba(248,113,113,0.35)] bg-[rgba(127,29,29,0.72)] text-[#FECACA]"
                : sessionNotice.status === "success"
                  ? "border-[rgba(74,222,128,0.28)] bg-[rgba(20,83,45,0.72)] text-[#BBF7D0]"
                  : "border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.82)] text-[#CBD5E1]"
            }`}
          >
            {sessionNotice.message}
          </div>
        ) : null}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Palette window
// ---------------------------------------------------------------------------

function PaletteWindowApp() {
  const { settings, setSettings } = usePersistentSettings();
  useEscToCancelDrawing();
  usePublishCurrentWindowBounds("palette");
  const applyingRemoteSettingsRef = useRef(false);
  const [snapshot, setSnapshot] = useState<ToolbarSnapshot | null>(null);
  const [paletteQuery, setPaletteQuery] = useState("");

  const recentTools = useMemo(() => {
    const recentSet = new Set(settings.recentTools);
    return getEditionTools(EDITION).filter((tool) => recentSet.has(tool.id));
  }, [settings.recentTools]);

  const paletteTools = useMemo(() => {
    const favoriteSet = new Set(settings.favoriteTools);
    return searchEditionTools(EDITION, paletteQuery).filter((tool) => !favoriteSet.has(tool.id));
  }, [paletteQuery, settings.favoriteTools]);

  const paletteSections = useMemo(
    () =>
      getEditionCategoryOrder(EDITION).map((category) => ({
        category,
        label: getEditionCategoryLabel(category),
        tools: paletteTools.filter((tool) => tool.category === category)
      })).filter((section) => section.tools.length > 0),
    [paletteTools]
  );

  const sizeStyle = {
    pill: "px-2.5 py-1 text-[10px]"
  };

  useEffect(() => {
    if (applyingRemoteSettingsRef.current) { applyingRemoteSettingsRef.current = false; return; }
    publishSettingsSync({ source: "palette", settings }).catch(() => undefined);
  }, [settings]);

  useEffect(() => {
    let unlistenSnapshot: (() => void) | undefined;
    let unlistenSettings: (() => void) | undefined;

    listenToolbarSnapshot((s) => setSnapshot(s)).then((u) => { unlistenSnapshot = u; }).catch(() => undefined);

    listenSettingsSync((payload) => {
      if (payload.source === "palette") return;
      applyingRemoteSettingsRef.current = true;
      setSettings(payload.settings);
    }).then((u) => { unlistenSettings = u; }).catch(() => undefined);

    return () => { unlistenSnapshot?.(); unlistenSettings?.(); };
  }, [setSettings]);

  const selectTool = (tool: ToolKind) => {
    sendPaletteCommand({ type: "select-tool", tool }).catch(() => undefined);
    if (EDITION.id === "basic") {
      if (tool === "select") {
        sendOverlayCommand({ type: "activate-basic-edit-mode" }).catch(() => undefined);
      } else {
        sendOverlayCommand({ type: "activate-basic-drawable-tool", tool }).catch(() => undefined);
      }
    } else {
      sendOverlayCommand({ type: "set-tool", tool }).catch(() => undefined);
      sendOverlayCommand({ type: "set-tool-mode", mode: getToolMode(tool) }).catch(() => undefined);
      bringToolbarToFront().catch(() => undefined);
    }
    closePaletteWindow().catch(() => undefined);
  };

  const activeTool = snapshot?.activeTool ?? settings.defaultTool;
  const toolMode = snapshot?.toolMode ?? settings.toolMode;
  const timerInfo = snapshot?.timer;

  return (
    <main className="h-full w-full bg-transparent p-2">
      <div className="rounded-2xl border border-[rgba(148,163,184,0.22)] bg-[rgba(2,8,23,0.94)] p-3 shadow-[0_24px_60px_rgba(2,8,23,0.5)] backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#94A3B8]">Tool Palette</div>
          <div className="text-[10px] text-[#64748B]">Select to switch tool</div>
        </div>
        <label className="mb-3 flex items-center gap-2 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2">
          <Search className="h-3.5 w-3.5 text-[#94A3B8]" />
          <input
            value={paletteQuery}
            onChange={(e) => setPaletteQuery(e.target.value)}
            placeholder="Filter tools"
            className="w-full bg-transparent text-xs text-[#E5E7EB] outline-none placeholder:text-[#64748B]"
          />
        </label>
        {EDITION.features.quickSessionActions && snapshot ? (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-[11px] text-[#E5E7EB]">
            <div className="truncate pr-3">
              {snapshot.currentSessionName}
              {snapshot.isDirty ? <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" /> : null}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { sendOverlayCommand({ type: "save-session" }).catch(() => undefined); }} className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[10px] text-[#DBEAFE]">Save</button>
              <button type="button" onClick={() => { sendOverlayCommand({ type: "load-session" }).catch(() => undefined); }} className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[10px] text-[#E5E7EB]">Load</button>
            </div>
          </div>
        ) : null}
        {recentTools.length > 0 && !paletteQuery ? (
          <div className="mb-3 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">Recent</div>
            <div className="grid grid-cols-1 gap-2">
              {recentTools.map((tool) => {
                const Icon = tool.icon;
                const active = activeTool === tool.id;
                return (
                  <button key={tool.id} type="button" onClick={() => selectTool(tool.id)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${active ? "border-[#3B82F6] bg-[rgba(59,130,246,0.16)] text-[#DBEAFE]" : "border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] text-[#E5E7EB] hover:border-[rgba(148,163,184,0.28)]"}`}
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
        {EDITION.features.timer && timerInfo ? (
          <div className="mb-3 rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
              <span>Timer</span>
              <button type="button" onClick={() => sendOverlayCommand({ type: "toggle-timer-visible" }).catch(() => undefined)} className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-1 text-[10px] text-[#E5E7EB]">{timerInfo.visible ? "Hide" : "Show"}</button>
            </div>
            <div className="mb-2 flex items-center justify-between rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] px-3 py-2">
              <div className="text-sm font-semibold tabular-nums text-[#F8FAFC]">{formatTimerClock(timerInfo.remainingMs)}</div>
              <div className="text-[10px] text-[#94A3B8]">{timerInfo.status === "running" ? "Running" : timerInfo.status === "paused" ? "Paused" : timerInfo.status === "finished" ? "Finished" : "Idle"}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {([["1m", 60_000], ["5m", 300_000], ["15m", 900_000]] as const).map(([label, ms]) => (
                <button key={label} type="button"
                  onClick={() => sendOverlayCommand({ type: "set-timer-duration", durationMs: ms, preset: label }).catch(() => undefined)}
                  className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]"
                >{label}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => sendOverlayCommand({ type: timerInfo.status === "paused" ? "resume-timer" : "start-timer" }).catch(() => undefined)} className="rounded-lg border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-2 py-2 text-[10px] text-[#DBEAFE]">{timerInfo.status === "paused" ? "Resume" : "Start"}</button>
              <button type="button" onClick={() => sendOverlayCommand({ type: "pause-timer" }).catch(() => undefined)} className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]">Pause</button>
              <button type="button" onClick={() => sendOverlayCommand({ type: "reset-timer" }).catch(() => undefined)} className="rounded-lg border border-[rgba(148,163,184,0.18)] px-2 py-2 text-[10px] text-[#E5E7EB]">Reset</button>
            </div>
          </div>
        ) : null}
        <div className="mb-3 max-h-[20rem] space-y-3 overflow-y-auto pr-1">
          {paletteSections.map((section) => (
            <div key={section.category} className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">{section.label}</div>
              <div className="grid grid-cols-1 gap-2">
                {section.tools.map((tool) => {
                  const Icon = tool.icon;
                  const active = activeTool === tool.id;
                  return (
                    <button key={tool.id} type="button" onClick={() => selectTool(tool.id)}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-left transition ${active ? "border-[#3B82F6] bg-[rgba(59,130,246,0.16)] text-[#DBEAFE]" : "border-[rgba(148,163,184,0.16)] bg-[rgba(2,8,23,0.52)] text-[#E5E7EB] hover:border-[rgba(148,163,184,0.28)]"}`}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium">{tool.label}</div>
                        <div className="mt-0.5 text-[10px] text-[#94A3B8]">{tool.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {paletteSections.length === 0 ? (
            <div className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] px-3 py-4 text-xs text-[#94A3B8]">No tools match.</div>
          ) : null}
        </div>
        {EDITION.features.toolModeSwitcher ? (
          <div className="flex items-center gap-2">
            {EDITION.availableModes.map((mode) => (
            <button key={mode} type="button"
              onClick={() => { sendPaletteCommand({ type: "set-tool-mode", mode }).catch(() => undefined); sendOverlayCommand({ type: "set-tool-mode", mode }).catch(() => undefined); }}
              className={`rounded-full border ${sizeStyle.pill} ${toolMode === mode ? "border-[#3B82F6] bg-[rgba(59,130,246,0.18)] text-[#DBEAFE]" : "border-[rgba(148,163,184,0.16)] bg-[rgba(15,23,42,0.72)] text-[#94A3B8]"}`}
            >{mode}</button>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Settings window
// ---------------------------------------------------------------------------

function SettingsWindowApp() {
  const { settings, setSettings } = usePersistentSettings();
  useEscToCancelDrawing();
  usePublishCurrentWindowBounds("settings");
  const applyingRemoteSettingsRef = useRef(false);
  const [snapshot, setSnapshot] = useState<ToolbarSnapshot>({
    activeTool: "select",
    toolMode: "basic",
    hidden: false,
    overlayMode: "click-through",
    overlayVisible: true,
    canUndo: false,
    canRedo: false,
    currentSessionName: "Untitled session",
    isDirty: false,
    selectedObject: null,
    shortcutStatuses: [],
    timer: {
      visible: false,
      status: "idle",
      durationMs: 60_000,
      remainingMs: 60_000,
      position: { x: 28, y: 28 },
      size: "compact",
      opacity: 0.92,
      preset: "1m"
    }
  });
  const [sessionNotice, setSessionNotice] = useState<SessionNotice | null>(null);
  const [monitorOptions, setMonitorOptions] = useState<MonitorOption[]>([{ id: "auto", label: "Auto / Primary monitor", monitor: null }]);
  const [focusSection, setFocusSection] = useState<"keybinds" | "about" | null>(null);

  useEffect(() => {
    const refreshMonitors = async () => {
      const monitors = await availableMonitors();
      const primary = await primaryMonitor();
      setMonitorOptions(createMonitorOptions(monitors, primary));
    };
    refreshMonitors().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (applyingRemoteSettingsRef.current) { applyingRemoteSettingsRef.current = false; return; }
    publishSettingsSync({ source: "settings", settings }).catch(() => undefined);
  }, [settings]);

  useEffect(() => {
    if (!sessionNotice) return;
    const timer = window.setTimeout(() => setSessionNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [sessionNotice]);

  useEffect(() => {
    let unlistenSnapshot: (() => void) | undefined;
    let unlistenSettings: (() => void) | undefined;
    let unlistenNotice: (() => void) | undefined;

    listenToolbarSnapshot((s) => setSnapshot(s)).then((u) => { unlistenSnapshot = u; }).catch(() => undefined);

    listenSettingsSync((payload) => {
      if (payload.source === "settings") return;
      applyingRemoteSettingsRef.current = true;
      setSettings(payload.settings);
    }).then((u) => { unlistenSettings = u; }).catch(() => undefined);

    listenSessionNotice((notice) => setSessionNotice(notice)).then((u) => { unlistenNotice = u; }).catch(() => undefined);

    return () => { unlistenSnapshot?.(); unlistenSettings?.(); unlistenNotice?.(); };
  }, [setSettings]);

  const setTimerPreset = (durationMs: number, preset: typeof settings.timerPreset) => {
    setSettings((current) => ({ ...current, timerDurationMs: durationMs, timerPreset: preset, timerVisible: true }));
    sendOverlayCommand({ type: "set-timer-visible", visible: true }).catch(() => undefined);
    sendOverlayCommand({ type: "set-timer-duration", durationMs, preset }).catch(() => undefined);
  };

  return (
    <main className="h-full w-full bg-transparent">
      <SettingsPanel
        open={true}
        settings={settings}
        setSettings={setSettings}
        shortcutStatuses={snapshot.shortcutStatuses}
        monitorOptions={monitorOptions}
        snapshot={snapshot}
        sessionNotice={sessionNotice}
        appVersion={APP_VERSION}
        edition={EDITION}
        focusSection={focusSection}
        onFocusSectionHandled={() => setFocusSection(null)}
        onSaveSession={() => sendOverlayCommand({ type: "save-session" }).catch(() => undefined)}
        onLoadSession={() => sendOverlayCommand({ type: "load-session" }).catch(() => undefined)}
        onExportAnnotationsPng={() => sendOverlayCommand({ type: "export-annotations-png" }).catch(() => undefined)}
        onExportAnnotationsJson={() => sendOverlayCommand({ type: "export-annotations-json" }).catch(() => undefined)}
        onSetTimerVisibility={(visible) => {
          setSettings((current) => ({ ...current, timerVisible: visible }));
          sendOverlayCommand({ type: "set-timer-visible", visible }).catch(() => undefined);
        }}
        onSetTimerPreset={(durationMs, preset) => setTimerPreset(durationMs, preset)}
        onSetCustomTimerDuration={(durationMs) => setTimerPreset(durationMs, "custom")}
        onStartTimer={() => sendOverlayCommand({ type: "start-timer" }).catch(() => undefined)}
        onPauseTimer={() => sendOverlayCommand({ type: "pause-timer" }).catch(() => undefined)}
        onResumeTimer={() => sendOverlayCommand({ type: "resume-timer" }).catch(() => undefined)}
        onResetTimer={() => sendOverlayCommand({ type: "reset-timer" }).catch(() => undefined)}
        onUpdateTimerStyle={(patch) => {
          setSettings((current) => ({ ...current, timerSize: patch.size ?? current.timerSize, timerOpacity: patch.opacity ?? current.timerOpacity }));
          sendOverlayCommand({ type: "update-timer-style", ...patch }).catch(() => undefined);
        }}
        onUpdateSelectedObject={(patch) => {
          if (!snapshot.selectedObject) return;
          sendOverlayCommand({ type: "update-selected-object", id: snapshot.selectedObject.id, patch }).catch(() => undefined);
        }}
        onSetSelectedLocked={(locked) => sendOverlayCommand({ type: "set-selected-locked", locked }).catch(() => undefined)}
        onReorderSelected={(direction) => sendOverlayCommand({ type: "reorder-selected", direction }).catch(() => undefined)}
        onDeleteSelected={() => sendOverlayCommand({ type: "delete-selected" }).catch(() => undefined)}
        onDuplicateSelected={() => sendOverlayCommand({ type: "duplicate-selected" }).catch(() => undefined)}
        onClearSelection={() => sendOverlayCommand({ type: "clear-selection" }).catch(() => undefined)}
        onClose={() => closeSettingsWindow().catch(() => undefined)}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

function App() {
  const mode = getWindowMode();
  if (mode === "toolbar") return <ToolbarWindowApp />;
  if (EDITION.id === "basic" && mode === "palette") {
    return null;
  }
  if (mode === "palette") return <PaletteWindowApp />;
  if (mode === "settings") return <SettingsWindowApp />;
  return <OverlayWindowApp />;
}

export default App;
