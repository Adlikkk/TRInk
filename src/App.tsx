import { useEffect, useMemo, useReducer, useRef, useState } from "react";
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
  getDesktopBounds,
  resolveTargetMonitor,
  type MonitorOption
} from "./lib/monitor-utils";
import type { ShortcutRegistrationStatus } from "./lib/shortcuts";
import { addRecentTool, clampTimerPosition, clampToolbarPosition } from "./lib/settings-store";
import {
  createIdleTimerState,
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
  applyInitialOverlayMode,
  getWindowMode,
  listenOverlayCommands,
  listenOverlayVisibility,
  listenSessionNotice,
  listenSettingsSync,
  listenToolbarCommands,
  listenToolbarSnapshot,
  publishSettingsSync,
  publishSessionNotice,
  publishToolbarSnapshot,
  sendOverlayCommand,
  setClickThrough
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
import { getToolMode } from "./lib/tool-definitions";
import {
  TOOLBAR_WINDOW_COMPACT_SIZE,
  TOOLBAR_WINDOW_NORMAL_SIZE,
  TOOLBAR_WINDOW_SETTINGS_HEIGHT,
  TIMER_SIZE_COMPACT,
  TIMER_SIZE_NORMAL
} from "./lib/ui-constants";
import type { ToolbarSnapshot } from "./lib/window-protocol";
import { createInitialDrawingState, drawingReducer } from "./state/drawing-state";
import type { OverlayInteractionMode } from "./types/settings";
import type { SessionNotice } from "./lib/window-protocol";

function getTimerBox(size: OverlayTimerState["size"]) {
  return size === "compact" ? TIMER_SIZE_COMPACT : TIMER_SIZE_NORMAL;
}

function getMonotonicNow() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

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

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    overlayModeRef.current = state.overlayMode;
  }, [state.overlayMode]);

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
    settings.timerDurationMs,
    settings.timerOpacity,
    settings.timerPosition,
    settings.timerPreset,
    settings.timerSize,
    settings.timerVisible
  ]);

  useEffect(() => {
    if (timerState.status !== "running") {
      return;
    }

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
        if (nextPosition.x === current.position.x && nextPosition.y === current.position.y) {
          return current;
        }
        setSettings((settingsCurrent) => ({ ...settingsCurrent, timerPosition: nextPosition }));
        return { ...current, position: nextPosition };
      });
    };

    window.addEventListener("resize", syncTimerBounds);
    return () => window.removeEventListener("resize", syncTimerBounds);
  }, [setSettings]);

  useEffect(() => {
    dispatch({ type: "set-tool", tool: settings.defaultTool });
  }, [settings.defaultTool]);

  useEffect(() => {
    dispatch({ type: "set-tool-mode", mode: settings.toolMode });
  }, [settings.toolMode]);

  useEffect(() => {
    const mode = settings.defaultMode;
    dispatch({ type: "set-overlay-mode", mode });
    applyInitialOverlayMode(mode).catch(() => undefined);
  }, [settings.defaultMode]);

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
        state.drawables.find((drawable) => drawable.id === state.selectedDrawableId) ?? null
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
      }
    };

    publishToolbarSnapshot(snapshot).catch(() => undefined);
  }, [
    state.activeTool,
    state.currentSessionName,
    state.drawables,
    state.hidden,
    state.isDirty,
    state.overlayMode,
    state.overlayVisible,
    state.redoStack.length,
    state.selectedDrawableId,
    state.toolMode,
    state.undoStack.length,
    timerState
  ]);

  const sendSessionNotice = (notice: SessionNotice) => {
    publishSessionNotice(notice).catch(() => undefined);
  };

  const saveSession = async () => {
    const currentState = stateRef.current;
    const currentSettings = settingsRef.current;
    const now = new Date().toISOString();
    const defaultPath =
      currentState.currentSessionPath ?? buildDefaultSessionFilename(new Date());
    const selectedPath = await requestSaveSessionPath(defaultPath);

    if (!selectedPath) {
      return;
    }

    const sessionName = getSessionNameFromPath(selectedPath);

    try {
      const session = createSessionPayload({
        name: sessionName,
        drawings: currentState.drawables,
        drawingTargetMonitor: currentSettings.drawingTargetMonitor,
        canvasWidth: window.innerWidth,
        canvasHeight: window.innerHeight,
        createdAt: currentState.sessionCreatedAt ?? now,
        updatedAt: now
      });

      await writeSessionFile(selectedPath, session);
      dispatch({
        type: "mark-saved",
        name: session.name,
        path: selectedPath,
        createdAt: session.createdAt
      });
      sendSessionNotice({ status: "success", message: `Saved ${session.name}.` });
    } catch (error) {
      sendSessionNotice({
        status: "error",
        message: error instanceof Error ? error.message : "TRInk could not save the session."
      });
    }
  };

  const loadSession = async () => {
    const currentState = stateRef.current;
    const selectedPath = await requestOpenSessionPath();

    if (!selectedPath) {
      return;
    }

    if (currentState.isDirty) {
      const confirmed = await confirmSessionReplace();
      if (!confirmed) {
        sendSessionNotice({ status: "info", message: "Load cancelled." });
        return;
      }
    }

    const result = await readSessionFile(selectedPath);

    if (!result.ok) {
      if ("cancelled" in result) {
        return;
      }

      sendSessionNotice({ status: "error", message: result.error });
      return;
    }

    const displayName = result.parsed.session.name || getSessionNameFromPath(result.path);
    dispatch({
      type: "load-session",
      drawables: result.parsed.session.drawings,
      name: displayName,
      path: result.path,
      createdAt: result.parsed.session.createdAt
    });

    if (result.parsed.ignoredDrawables > 0) {
      sendSessionNotice({
        status: "info",
        message: `Loaded ${displayName}. Some unsupported annotations were skipped (${result.parsed.ignoredDrawables}).`
      });
    } else {
      sendSessionNotice({ status: "success", message: `Loaded ${displayName}.` });
    }
  };

  const exportAnnotationsPng = async () => {
    const currentState = stateRef.current;
    const selectedPath = await requestSaveAnnotationsPngPath(buildDefaultAnnotationsPngFilename(new Date()));

    if (!selectedPath) {
      return;
    }

    try {
      const plan = prepareAnnotationExportPlan({
        drawables: currentState.drawables,
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio
      });
      const bytes = await renderAnnotationsToPngBytes({
        drawables: currentState.drawables,
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio
      });

      await writeBinaryExportFile(selectedPath, bytes);
      sendSessionNotice(
        plan.ignoredDrawables > 0
          ? {
              status: "info",
              message: `Exported annotations PNG. Some unsupported annotations were skipped (${plan.ignoredDrawables}).`
            }
          : { status: "success", message: "Exported annotations PNG." }
      );
    } catch (error) {
      sendSessionNotice({
        status: "error",
        message: error instanceof Error ? error.message : "TRInk could not export the annotations PNG."
      });
    }
  };

  const exportAnnotationsJson = async () => {
    const currentState = stateRef.current;
    const selectedPath = await requestSaveAnnotationsJsonPath(buildDefaultAnnotationsJsonFilename(new Date()));

    if (!selectedPath) {
      return;
    }

    try {
      const exportResult = createAnnotationsExportPayload({
        name: currentState.currentSessionName.replace(/\.trink$/i, ""),
        drawings: currentState.drawables
      });

      await writeJsonExportFile(selectedPath, serializeAnnotationsExport(exportResult.payload));
      sendSessionNotice(
        exportResult.ignoredDrawables > 0
          ? {
              status: "info",
              message: `Exported annotations JSON. Some unsupported annotations were skipped (${exportResult.ignoredDrawables}).`
            }
          : { status: "success", message: "Exported annotations JSON." }
      );
    } catch (error) {
      sendSessionNotice({
        status: "error",
        message: error instanceof Error ? error.message : "TRInk could not export the annotations JSON."
      });
    }
  };

  const updateTimerPosition = (position: { x: number; y: number }) => {
    const nextPosition = clampTimerPosition(
      position,
      { width: window.innerWidth, height: window.innerHeight },
      getTimerBox(timerState.size)
    );
    setTimerState((current) => ({ ...current, position: nextPosition }));
  };

  const persistTimerPosition = (position: { x: number; y: number }) => {
    const nextPosition = clampTimerPosition(
      position,
      { width: window.innerWidth, height: window.innerHeight },
      getTimerBox(timerState.size)
    );
    setSettings((current) => ({ ...current, timerPosition: nextPosition }));
  };

  useEffect(() => {
    if (applyingRemoteSettingsRef.current) {
      applyingRemoteSettingsRef.current = false;
      return;
    }

    publishSettingsSync({ source: "overlay", settings }).catch(() => undefined);
  }, [settings]);

  useEffect(() => {
    let unlistenCommands: (() => void) | undefined;
    let unlistenVisibility: (() => void) | undefined;
    let unlistenSettings: (() => void) | undefined;

    listenOverlayCommands((payload) => {
      switch (payload.type) {
        case "set-tool":
          dispatch({ type: "set-tool", tool: payload.tool });
          setSettings((current) => addRecentTool(current, payload.tool));
          break;
        case "set-tool-mode":
          dispatch({ type: "set-tool-mode", mode: payload.mode });
          setSettings((current) => ({ ...current, toolMode: payload.mode }));
          break;
        case "toggle-click-through": {
          const nextMode: OverlayInteractionMode =
            overlayModeRef.current === "draw" ? "click-through" : "draw";
          dispatch({ type: "set-overlay-mode", mode: nextMode });
          setSettings((current) => ({ ...current, defaultMode: nextMode }));
          setClickThrough(nextMode === "click-through").catch(() => undefined);
          break;
        }
        case "set-click-through": {
          const nextMode: OverlayInteractionMode = payload.enabled ? "click-through" : "draw";
          dispatch({ type: "set-overlay-mode", mode: nextMode });
          setSettings((current) => ({ ...current, defaultMode: nextMode }));
          setClickThrough(payload.enabled).catch(() => undefined);
          break;
        }
        case "undo":
          dispatch({ type: "undo" });
          break;
        case "redo":
          dispatch({ type: "redo" });
          break;
        case "clear":
          dispatch({ type: "clear" });
          break;
        case "save-session":
          void saveSession();
          break;
        case "load-session":
          void loadSession();
          break;
        case "update-selected-object": {
          const current = stateRef.current.drawables.find((drawable) => drawable.id === payload.id);
          if (!current || current.id !== stateRef.current.selectedDrawableId) {
            break;
          }
          dispatch({
            type: "replace-selected-drawable",
            drawable: patchDrawableProperties(current, payload.patch)
          });
          break;
        }
        case "set-selected-locked":
          dispatch({ type: "set-selected-locked", locked: payload.locked });
          break;
        case "reorder-selected":
          dispatch({ type: "reorder-selected", direction: payload.direction });
          break;
        case "duplicate-selected": {
          const current = stateRef.current.drawables.find(
            (drawable) => drawable.id === stateRef.current.selectedDrawableId
          );
          if (current) {
            dispatch({ type: "duplicate-drawable", drawable: duplicateDrawable(current) });
          }
          break;
        }
        case "clear-selection":
          dispatch({ type: "select-drawable", id: null });
          break;
        case "delete-selected":
          dispatch({ type: "delete-selected" });
          break;
        case "export-annotations-png":
          void exportAnnotationsPng();
          break;
        case "export-annotations-json":
          void exportAnnotationsJson();
          break;
        case "toggle-hidden":
          dispatch({ type: "toggle-hidden" });
          break;
        case "set-timer-visible":
          setTimerState((current) => ({ ...current, visible: payload.visible }));
          setSettings((current) => ({ ...current, timerVisible: payload.visible }));
          break;
        case "toggle-timer-visible":
          setTimerState((current) => ({ ...current, visible: !current.visible }));
          setSettings((current) => ({ ...current, timerVisible: !current.timerVisible }));
          break;
        case "set-timer-duration":
          setTimerState((current) => setTimerDuration(current, payload.durationMs, payload.preset));
          setSettings((current) => ({
            ...current,
            timerDurationMs: payload.durationMs,
            timerPreset: payload.preset
          }));
          break;
        case "start-timer":
          setTimerState((current) => startTimer(current, getMonotonicNow()));
          break;
        case "toggle-timer-start-pause":
          setTimerState((current) => {
            if (current.status === "running") {
              return pauseTimer(current, getMonotonicNow());
            }
            if (current.status === "paused") {
              return resumeTimer(current, getMonotonicNow());
            }
            return startTimer(current, getMonotonicNow());
          });
          break;
        case "pause-timer":
          setTimerState((current) => pauseTimer(current, getMonotonicNow()));
          break;
        case "resume-timer":
          setTimerState((current) => resumeTimer(current, getMonotonicNow()));
          break;
        case "reset-timer":
          setTimerState((current) => resetTimer(current));
          break;
        case "update-timer-position": {
          const nextPosition = clampTimerPosition(
            payload.position,
            { width: window.innerWidth, height: window.innerHeight },
            getTimerBox(settingsRef.current.timerSize)
          );
          setTimerState((current) => ({ ...current, position: nextPosition }));
          setSettings((current) => ({ ...current, timerPosition: nextPosition }));
          break;
        }
        case "update-timer-style":
          setTimerState((current) => ({
            ...current,
            size: payload.size ?? current.size,
            opacity: payload.opacity ?? current.opacity
          }));
          setSettings((current) => ({
            ...current,
            timerSize: payload.size ?? current.timerSize,
            timerOpacity: payload.opacity ?? current.timerOpacity
          }));
          break;
        case "set-settings-open":
          break;
      }
    })
      .then((unlisten) => {
        unlistenCommands = unlisten;
      })
      .catch(() => undefined);

    listenOverlayVisibility((visible) => {
      dispatch({ type: "set-overlay-visible", visible });
    })
      .then((unlisten) => {
        unlistenVisibility = unlisten;
      })
      .catch(() => undefined);

    listenSettingsSync((payload) => {
      if (payload.source !== "toolbar") {
        return;
      }

      applyingRemoteSettingsRef.current = true;
      setSettings(payload.settings);
    })
      .then((unlisten) => {
        unlistenSettings = unlisten;
      })
      .catch(() => undefined);

    return () => {
      unlistenCommands?.();
      unlistenVisibility?.();
      unlistenSettings?.();
    };
  }, [setSettings]);

  useEffect(() => {
    const applyMonitorBounds = async () => {
      const monitors = await availableMonitors();
      const primary = await primaryMonitor();
      const options = createMonitorOptions(monitors, primary);
      const target = resolveTargetMonitor(settings.drawingTargetMonitor, options);
      if (!target) {
        return;
      }

      const window = getCurrentWindow();
      await window.setFullscreen(false);
      await window.setPosition(new PhysicalPosition(target.position.x, target.position.y));
      await window.setSize(new PhysicalSize(target.size.width, target.size.height));

      const nextTimerPosition = clampTimerPosition(
        settingsRef.current.timerPosition,
        { width: target.size.width, height: target.size.height },
        getTimerBox(settingsRef.current.timerSize)
      );
      setTimerState((current) => ({ ...current, position: nextTimerPosition }));
      if (
        settingsRef.current.timerPosition.x !== nextTimerPosition.x ||
        settingsRef.current.timerPosition.y !== nextTimerPosition.y
      ) {
        setSettings((current) => ({ ...current, timerPosition: nextTimerPosition }));
      }
    };

    applyMonitorBounds().catch(() => undefined);
  }, [settings.drawingTargetMonitor]);

  return (
    <main className="relative h-full w-full bg-transparent">
      <div
        className="absolute inset-0"
        style={{ pointerEvents: state.overlayMode === "draw" && state.overlayVisible ? "auto" : "none" }}
      >
        <CanvasSurface state={state} dispatch={dispatch} settings={settings} />
      </div>
      {timerState.visible ? (
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

function ToolbarWindowApp() {
  const { settings, setSettings } = usePersistentSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsFocusSection, setSettingsFocusSection] = useState<"keybinds" | "about" | null>(null);
  const [sessionNotice, setSessionNotice] = useState<SessionNotice | null>(null);
  const [shortcutStatuses, setShortcutStatuses] = useState<ShortcutRegistrationStatus[]>([]);
  const [launchState, setLaunchState] = useState<"starting" | "ready" | "error" | "idle">("starting");
  const [launchMessage, setLaunchMessage] = useState(`Starting ${APP_SHORT_NAME}…`);
  const [hasReceivedSnapshot, setHasReceivedSnapshot] = useState(false);
  const [monitorOptions, setMonitorOptions] = useState<MonitorOption[]>([
    { id: "auto", label: "Auto / Primary monitor", monitor: null }
  ]);
  const [desktopBounds, setDesktopBounds] = useState({
    x: 0,
    y: 0,
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

  const baseSize = settings.toolbarSize === "compact" ? TOOLBAR_WINDOW_COMPACT_SIZE : TOOLBAR_WINDOW_NORMAL_SIZE;
  const windowSize = useMemo(
    () => ({
      width: baseSize.width,
      height: settingsOpen ? TOOLBAR_WINDOW_SETTINGS_HEIGHT : baseSize.height
    }),
    [baseSize.height, baseSize.width, settingsOpen]
  );

  useEffect(() => {
    const refreshMonitors = async () => {
      const monitors = await availableMonitors();
      const primary = await primaryMonitor();
      setMonitorOptions(createMonitorOptions(monitors, primary));
      setDesktopBounds(getDesktopBounds(monitors));
    };

    refreshMonitors().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (launchState !== "ready") {
      return;
    }

    const timer = window.setTimeout(() => {
      setLaunchState("idle");
      setLaunchMessage("");
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [launchState]);

  useEffect(() => {
    if (hasReceivedSnapshot) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (!hasReceivedSnapshot) {
        setLaunchState("error");
        setLaunchMessage("Waiting for overlay…");
      }
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [hasReceivedSnapshot]);

  useEffect(() => {
    if (applyingRemoteSettingsRef.current) {
      applyingRemoteSettingsRef.current = false;
      return;
    }

    publishSettingsSync({ source: "toolbar", settings }).catch(() => undefined);
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    applyShortcutBindings(settings.shortcuts)
      .then((statuses) => {
        if (!cancelled) {
          setShortcutStatuses(statuses);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setShortcutStatuses(
          settings.shortcuts.map((binding) => ({
            action: binding.action,
            accelerator: binding.enabled ? binding.accelerator : null,
            state: binding.enabled && binding.accelerator ? "unavailable" : "disabled",
            message: error instanceof Error ? error.message : "TRInk could not update the global shortcuts."
          }))
        );
      });

    return () => {
      cancelled = true;
    };
  }, [settings.shortcuts]);

  useEffect(() => {
    const currentWindow = getCurrentWindow();
    const clamped = clampToolbarPosition(settings.toolbarPosition, desktopBounds, windowSize);

    currentWindow.setSize(new LogicalSize(windowSize.width, windowSize.height)).catch(() => undefined);
    currentWindow.setPosition(new LogicalPosition(clamped.x, clamped.y)).catch(() => undefined);

    if (settings.toolbarPosition.x !== clamped.x || settings.toolbarPosition.y !== clamped.y) {
      setSettings((current) => ({ ...current, toolbarPosition: clamped }));
    }
  }, [desktopBounds, setSettings, settings.toolbarPosition, windowSize]);

  useEffect(() => {
    if (!sessionNotice) {
      return;
    }

    const timer = window.setTimeout(() => setSessionNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [sessionNotice]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (!isTypingTarget && event.key.toLowerCase() === "v") {
        setSettings((current) =>
          addRecentTool({ ...current, defaultTool: "select", toolMode: "basic" }, "select")
        );
        sendOverlayCommand({ type: "set-tool", tool: "select" }).catch(() => undefined);
        sendOverlayCommand({ type: "set-tool-mode", mode: "basic" }).catch(() => undefined);
        return;
      }

      if (event.key === "Escape" && settingsOpen) {
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen]);

  useEffect(() => {
    let unlistenMoved: (() => void) | undefined;
    let unlistenSnapshot: (() => void) | undefined;
    let unlistenToolbarCommands: (() => void) | undefined;
    let unlistenSettings: (() => void) | undefined;
    let unlistenVisibility: (() => void) | undefined;
    let unlistenNotice: (() => void) | undefined;
    const currentWindow = getCurrentWindow();

    currentWindow
      .onMoved(({ payload }) => {
        const next = clampToolbarPosition(
          { x: payload.x, y: payload.y },
          desktopBounds,
          windowSize
        );

        if (next.x !== payload.x || next.y !== payload.y) {
          currentWindow.setPosition(new LogicalPosition(next.x, next.y)).catch(() => undefined);
        }

        setSettings((current) => {
          if (current.toolbarPosition.x === next.x && current.toolbarPosition.y === next.y) {
            return current;
          }
          return { ...current, toolbarPosition: next };
        });
      })
      .then((unlisten) => {
        unlistenMoved = unlisten;
      })
      .catch(() => undefined);

    listenToolbarSnapshot((nextSnapshot) => {
      if (!hasReceivedSnapshot) {
        setHasReceivedSnapshot(true);
        setLaunchState("ready");
        setLaunchMessage("Ready");
      }
      setSnapshot(nextSnapshot);
    })
      .then((unlisten) => {
        unlistenSnapshot = unlisten;
      })
      .catch(() => undefined);

    listenToolbarCommands((command) => {
      if (command.type === "open-settings") {
        setSettingsOpen(true);
      }
    })
      .then((unlisten) => {
        unlistenToolbarCommands = unlisten;
      })
      .catch(() => undefined);

    listenSettingsSync((payload) => {
      if (payload.source !== "overlay") {
        return;
      }

      applyingRemoteSettingsRef.current = true;
      setSettings(payload.settings);
    })
      .then((unlisten) => {
        unlistenSettings = unlisten;
      })
      .catch(() => undefined);

    listenOverlayVisibility((visible) => {
      setSnapshot((current) => ({ ...current, overlayVisible: visible }));
    })
      .then((unlisten) => {
        unlistenVisibility = unlisten;
      })
      .catch(() => undefined);

    listenSessionNotice((notice) => {
      setSessionNotice(notice);
    })
      .then((unlisten) => {
        unlistenNotice = unlisten;
      })
      .catch(() => undefined);

    return () => {
      unlistenMoved?.();
      unlistenSnapshot?.();
      unlistenToolbarCommands?.();
      unlistenSettings?.();
      unlistenVisibility?.();
      unlistenNotice?.();
    };
  }, [desktopBounds, hasReceivedSnapshot, setSettings, windowSize]);

  const setTimerPreset = (durationMs: number, preset: typeof settings.timerPreset) => {
    setSettings((current) => ({
      ...current,
      timerDurationMs: durationMs,
      timerPreset: preset,
      timerVisible: true
    }));
    sendOverlayCommand({ type: "set-timer-visible", visible: true }).catch(() => undefined);
    sendOverlayCommand({ type: "set-timer-duration", durationMs, preset }).catch(() => undefined);
  };

  const setTimerVisibility = (visible: boolean) => {
    setSettings((current) => ({ ...current, timerVisible: visible }));
    sendOverlayCommand({ type: "set-timer-visible", visible }).catch(() => undefined);
  };

  const dismissWelcome = () => {
    setSettings((current) => ({ ...current, welcomeDismissed: true }));
  };

  const showWelcome =
    !settings.welcomeDismissed &&
    !settingsOpen &&
    launchState !== "starting" &&
    launchState !== "error";

  return (
    <main className="h-full w-full bg-transparent p-3">
      <div className="space-y-3">
        <Toolbar
          snapshot={snapshot}
          settings={settings}
          shortcutStatuses={shortcutStatuses}
          startupState={launchState}
          startupMessage={launchMessage}
          onSetTool={(tool) => {
            setSettings((current) =>
              addRecentTool(
                {
                  ...current,
                  defaultTool: tool,
                  toolMode: getToolMode(tool)
                },
                tool
              )
            );
            sendOverlayCommand({ type: "set-tool", tool }).catch(() => undefined);
          }}
          onSetToolMode={(mode) => {
            setSettings((current) => ({ ...current, toolMode: mode }));
            sendOverlayCommand({ type: "set-tool-mode", mode }).catch(() => undefined);
          }}
          onUndo={() => {
            sendOverlayCommand({ type: "undo" }).catch(() => undefined);
          }}
          onRedo={() => {
            sendOverlayCommand({ type: "redo" }).catch(() => undefined);
          }}
          onClear={() => {
            sendOverlayCommand({ type: "clear" }).catch(() => undefined);
          }}
          onSaveSession={() => {
            sendOverlayCommand({ type: "save-session" }).catch(() => undefined);
          }}
          onLoadSession={() => {
            sendOverlayCommand({ type: "load-session" }).catch(() => undefined);
          }}
          onExportAnnotationsPng={() => {
            sendOverlayCommand({ type: "export-annotations-png" }).catch(() => undefined);
          }}
          onExportAnnotationsJson={() => {
            sendOverlayCommand({ type: "export-annotations-json" }).catch(() => undefined);
          }}
          onTimerPreset={(durationMs, preset) => {
            setTimerPreset(durationMs, preset);
          }}
          onToggleTimerVisibility={() => {
            setTimerVisibility(!snapshot.timer.visible);
          }}
          onStartTimer={() => {
            sendOverlayCommand({ type: "start-timer" }).catch(() => undefined);
          }}
          onPauseTimer={() => {
            sendOverlayCommand({ type: "pause-timer" }).catch(() => undefined);
          }}
          onResumeTimer={() => {
            sendOverlayCommand({ type: "resume-timer" }).catch(() => undefined);
          }}
          onResetTimer={() => {
            sendOverlayCommand({ type: "reset-timer" }).catch(() => undefined);
          }}
          onToggleHidden={() => {
            sendOverlayCommand({ type: "toggle-hidden" }).catch(() => undefined);
          }}
          onToggleClickThrough={() => {
            sendOverlayCommand({ type: "toggle-click-through" }).catch(() => undefined);
          }}
          onToggleSettings={() => {
            setSettingsOpen((current) => !current);
          }}
        />
        {showWelcome ? (
          <div className="rounded-[22px] border border-[rgba(148,163,184,0.22)] bg-[rgba(2,8,23,0.92)] px-4 py-4 shadow-[0_20px_54px_rgba(2,8,23,0.44)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <img src="/logo.svg" alt={APP_PRODUCT_NAME} className="h-10 w-10 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#E5E7EB]">{APP_PRODUCT_NAME}</div>
                <div className="mt-1 text-xs text-[#CBD5E1]">
                  {APP_SHORT_NAME} is a local screen annotation overlay for TradeReality users.
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#94A3B8]">
                  <div>No financial advice</div>
                  <div>No trading signals</div>
                  <div>No broker connections</div>
                  <div>No trade automation</div>
                  <div>No broker page reading</div>
                  <div>No platform bypasses</div>
                </div>
                <div className="mt-3 text-[11px] text-[#CBD5E1]">
                  Use it to draw, explain, review, and teach.
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      dismissWelcome();
                    }}
                    className="rounded-xl border border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] px-3 py-2 text-xs font-medium text-[#DBEAFE]"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      dismissWelcome();
                      setSettingsFocusSection("about");
                      setSettingsOpen(true);
                    }}
                    className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-xs text-[#E5E7EB]"
                  >
                    Open settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      dismissWelcome();
                      setSettingsFocusSection("keybinds");
                      setSettingsOpen(true);
                    }}
                    className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.72)] px-3 py-2 text-xs text-[#E5E7EB]"
                  >
                    View shortcuts
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {sessionNotice && !settingsOpen ? (
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
        <SettingsPanel
          open={settingsOpen}
          settings={settings}
          setSettings={setSettings}
          shortcutStatuses={shortcutStatuses}
          monitorOptions={monitorOptions}
          snapshot={snapshot}
          sessionNotice={sessionNotice}
          appVersion={APP_VERSION}
          focusSection={settingsFocusSection}
          onFocusSectionHandled={() => setSettingsFocusSection(null)}
          onSaveSession={() => {
            sendOverlayCommand({ type: "save-session" }).catch(() => undefined);
          }}
          onLoadSession={() => {
            sendOverlayCommand({ type: "load-session" }).catch(() => undefined);
          }}
          onExportAnnotationsPng={() => {
            sendOverlayCommand({ type: "export-annotations-png" }).catch(() => undefined);
          }}
          onExportAnnotationsJson={() => {
            sendOverlayCommand({ type: "export-annotations-json" }).catch(() => undefined);
          }}
          onSetTimerVisibility={setTimerVisibility}
          onSetTimerPreset={(durationMs, preset) => {
            setTimerPreset(durationMs, preset);
          }}
          onSetCustomTimerDuration={(durationMs) => {
            setTimerPreset(durationMs, "custom");
          }}
          onStartTimer={() => {
            sendOverlayCommand({ type: "start-timer" }).catch(() => undefined);
          }}
          onPauseTimer={() => {
            sendOverlayCommand({ type: "pause-timer" }).catch(() => undefined);
          }}
          onResumeTimer={() => {
            sendOverlayCommand({ type: "resume-timer" }).catch(() => undefined);
          }}
          onResetTimer={() => {
            sendOverlayCommand({ type: "reset-timer" }).catch(() => undefined);
          }}
          onUpdateTimerStyle={(patch) => {
            setSettings((current) => ({
              ...current,
              timerSize: patch.size ?? current.timerSize,
              timerOpacity: patch.opacity ?? current.timerOpacity
            }));
            sendOverlayCommand({ type: "update-timer-style", ...patch }).catch(() => undefined);
          }}
          onUpdateSelectedObject={(patch) => {
            if (!snapshot.selectedObject) {
              return;
            }
            sendOverlayCommand({
              type: "update-selected-object",
              id: snapshot.selectedObject.id,
              patch
            }).catch(() => undefined);
          }}
          onDeleteSelected={() => {
            sendOverlayCommand({ type: "delete-selected" }).catch(() => undefined);
          }}
          onSetSelectedLocked={(locked) => {
            sendOverlayCommand({ type: "set-selected-locked", locked }).catch(() => undefined);
          }}
          onReorderSelected={(direction) => {
            sendOverlayCommand({ type: "reorder-selected", direction }).catch(() => undefined);
          }}
          onDuplicateSelected={() => {
            sendOverlayCommand({ type: "duplicate-selected" }).catch(() => undefined);
          }}
          onClearSelection={() => {
            sendOverlayCommand({ type: "clear-selection" }).catch(() => undefined);
          }}
          onClose={() => {
            setSettingsFocusSection(null);
            setSettingsOpen(false);
          }}
        />
      </div>
    </main>
  );
}

function App() {
  const mode = getWindowMode();
  return mode === "toolbar" ? <ToolbarWindowApp /> : <OverlayWindowApp />;
}

export default App;
