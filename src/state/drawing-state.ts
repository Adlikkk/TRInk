import type { Drawable, PreviewShape, ToolKind, ToolMode } from "../types/drawables";
import type { OverlayInteractionMode } from "../types/settings";

export type DrawingState = {
  drawables: Drawable[];
  undoStack: Drawable[][];
  redoStack: Drawable[][];
  activeTool: ToolKind;
  toolMode: ToolMode;
  preview: PreviewShape | null;
  hidden: boolean;
  overlayMode: OverlayInteractionMode;
  overlayVisible: boolean;
  toolbarPosition: { x: number; y: number };
  settingsOpen: boolean;
};

export type DrawingAction =
  | { type: "set-tool"; tool: ToolKind }
  | { type: "set-tool-mode"; mode: ToolMode }
  | { type: "set-preview"; preview: PreviewShape | null }
  | { type: "commit"; drawable: Drawable }
  | { type: "replace-drawables"; drawables: Drawable[] }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "clear" }
  | { type: "toggle-hidden" }
  | { type: "set-overlay-mode"; mode: OverlayInteractionMode }
  | { type: "set-overlay-visible"; visible: boolean }
  | { type: "set-toolbar-position"; position: { x: number; y: number } }
  | { type: "set-settings-open"; open: boolean };

export function createInitialDrawingState(activeTool: ToolKind, toolMode: ToolMode): DrawingState {
  return {
    drawables: [],
    undoStack: [],
    redoStack: [],
    activeTool,
    toolMode,
    preview: null,
    hidden: false,
    overlayMode: "draw",
    overlayVisible: true,
    toolbarPosition: { x: 24, y: 24 },
    settingsOpen: false
  };
}

function pushHistory(state: DrawingState) {
  return [...state.undoStack, state.drawables];
}

export function drawingReducer(state: DrawingState, action: DrawingAction): DrawingState {
  switch (action.type) {
    case "set-tool":
      return { ...state, activeTool: action.tool };
    case "set-tool-mode":
      return { ...state, toolMode: action.mode };
    case "set-preview":
      return { ...state, preview: action.preview };
    case "commit":
      return {
        ...state,
        drawables: [...state.drawables, action.drawable],
        undoStack: pushHistory(state),
        redoStack: [],
        preview: null
      };
    case "replace-drawables":
      return {
        ...state,
        drawables: action.drawables,
        undoStack: pushHistory(state),
        redoStack: [],
        preview: null
      };
    case "undo": {
      const previous = state.undoStack[state.undoStack.length - 1];
      if (!previous) {
        return state;
      }

      return {
        ...state,
        drawables: previous,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.drawables],
        preview: null
      };
    }
    case "redo": {
      const next = state.redoStack[state.redoStack.length - 1];
      if (!next) {
        return state;
      }

      return {
        ...state,
        drawables: next,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, state.drawables],
        preview: null
      };
    }
    case "clear":
      if (state.drawables.length === 0) {
        return state;
      }
      return {
        ...state,
        drawables: [],
        undoStack: pushHistory(state),
        redoStack: [],
        preview: null
      };
    case "toggle-hidden":
      return { ...state, hidden: !state.hidden };
    case "set-overlay-mode":
      return { ...state, overlayMode: action.mode };
    case "set-overlay-visible":
      return { ...state, overlayVisible: action.visible };
    case "set-toolbar-position":
      return { ...state, toolbarPosition: action.position };
    case "set-settings-open":
      return { ...state, settingsOpen: action.open };
    default:
      return state;
  }
}
