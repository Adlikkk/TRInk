import { useEffect, useReducer, useRef } from "react";
import { CanvasSurface } from "./components/CanvasSurface";
import { SettingsPanel } from "./components/SettingsPanel";
import { Toolbar } from "./components/Toolbar";
import { clampToolbarPosition } from "./lib/settings-store";
import { applyInitialOverlayMode, listenHotkeys, listenOverlayVisibility, setClickThrough } from "./lib/tauri-bridge";
import { usePersistentSettings } from "./hooks/usePersistentSettings";
import { createInitialDrawingState, drawingReducer } from "./state/drawing-state";
import type { OverlayInteractionMode } from "./types/settings";

function App() {
  const { settings, setSettings } = usePersistentSettings();
  const [state, dispatch] = useReducer(
    drawingReducer,
    createInitialDrawingState(settings.defaultTool, settings.toolMode, settings.toolbarPosition)
  );
  const overlayModeRef = useRef(state.overlayMode);

  useEffect(() => {
    overlayModeRef.current = state.overlayMode;
  }, [state.overlayMode]);

  useEffect(() => {
    dispatch({ type: "set-tool", tool: settings.defaultTool });
  }, [settings.defaultTool]);

  useEffect(() => {
    dispatch({ type: "set-tool-mode", mode: settings.toolMode });
  }, [settings.toolMode]);

  useEffect(() => {
    dispatch({ type: "set-toolbar-position", position: clampToolbarPosition(settings.toolbarPosition) });
  }, [settings.toolbarPosition]);

  useEffect(() => {
    const mode = settings.defaultMode;
    dispatch({ type: "set-overlay-mode", mode });
    applyInitialOverlayMode(mode).catch(() => undefined);
  }, [settings.defaultMode]);

  useEffect(() => {
    setSettings((current) => {
      const nextPosition = clampToolbarPosition(state.toolbarPosition);
      if (
        current.toolbarPosition.x === nextPosition.x &&
        current.toolbarPosition.y === nextPosition.y
      ) {
        return current;
      }

      return { ...current, toolbarPosition: nextPosition };
    });
  }, [setSettings, state.toolbarPosition]);

  useEffect(() => {
    const handleResize = () => {
      dispatch({ type: "set-toolbar-position", position: clampToolbarPosition(state.toolbarPosition) });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [state.toolbarPosition]);

  useEffect(() => {
    let unlistenHotkeys: (() => void) | undefined;
    let unlistenVisibility: (() => void) | undefined;

    listenHotkeys((payload) => {
      switch (payload.type) {
        case "set-tool":
          dispatch({ type: "set-tool", tool: payload.tool });
          break;
        case "toggle-click-through": {
          const nextMode: OverlayInteractionMode =
            overlayModeRef.current === "draw" ? "click-through" : "draw";
          dispatch({ type: "set-overlay-mode", mode: nextMode });
          setSettings((current) => ({ ...current, defaultMode: nextMode }));
          setClickThrough(nextMode === "click-through").catch(() => undefined);
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
        case "open-settings":
          dispatch({ type: "set-settings-open", open: true });
          break;
      }
    })
      .then((unlisten) => {
        unlistenHotkeys = unlisten;
      })
      .catch(() => undefined);

    listenOverlayVisibility((visible) => {
      dispatch({ type: "set-overlay-visible", visible });
    })
      .then((unlisten) => {
        unlistenVisibility = unlisten;
      })
      .catch(() => undefined);

    return () => {
      unlistenHotkeys?.();
      unlistenVisibility?.();
    };
  }, [setSettings]);

  const overlayInteractive = state.overlayMode === "draw" && state.overlayVisible;

  return (
    <main className="relative h-full w-full bg-transparent">
      <div
        className="absolute inset-0"
        style={{ pointerEvents: overlayInteractive ? "auto" : "none" }}
      >
        <CanvasSurface state={state} dispatch={dispatch} settings={settings} />
      </div>
      <Toolbar state={state} dispatch={dispatch} settings={settings} setSettings={setSettings} />
      <SettingsPanel
        open={state.settingsOpen}
        settings={settings}
        setSettings={setSettings}
        dispatch={dispatch}
      />

      {!state.overlayVisible ? (
        <div className="absolute left-4 top-4 rounded-full border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs text-slate-400">
          Overlay hidden. Press Ctrl+Shift+Space to restore.
        </div>
      ) : null}

      <div
        className={`absolute bottom-5 right-5 rounded-full border px-4 py-2 text-xs shadow-overlay ${
          state.overlayMode === "draw"
            ? "border-slate-800 bg-slate-950/85 text-slate-300"
            : "border-blue-500/40 bg-blue-500/15 text-blue-100"
        }`}
      >
        {state.overlayMode === "draw"
          ? "Draw mode"
          : "Click-through mode · Use Ctrl+Shift+X or tray to return"}
      </div>
    </main>
  );
}

export default App;
