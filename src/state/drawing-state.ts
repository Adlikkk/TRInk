import type { Drawable, PreviewShape, ToolKind, ToolMode } from "../types/drawables";
import type { OverlayInteractionMode } from "../types/settings";

export type DrawingState = {
  drawables: Drawable[];
  undoStack: Drawable[][];
  redoStack: Drawable[][];
  sessionCreatedAt: string | null;
  currentSessionName: string;
  currentSessionPath: string | null;
  isDirty: boolean;
  selectedDrawableId: string | null;
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
  | { type: "load-session"; drawables: Drawable[]; name: string; path: string | null; createdAt: string }
  | { type: "mark-saved"; name: string; path: string | null; createdAt: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "clear" }
  | { type: "toggle-hidden" }
  | { type: "set-overlay-mode"; mode: OverlayInteractionMode }
  | { type: "set-overlay-visible"; visible: boolean }
  | { type: "set-toolbar-position"; position: { x: number; y: number } }
  | { type: "set-settings-open"; open: boolean }
  | { type: "select-drawable"; id: string | null }
  | { type: "delete-selected" }
  | { type: "replace-selected-drawable"; drawable: Drawable }
  | { type: "duplicate-drawable"; drawable: Drawable }
  | { type: "set-selected-locked"; locked: boolean }
  | { type: "reorder-selected"; direction: "forward" | "backward" | "front" | "back" };

export function createInitialDrawingState(
  activeTool: ToolKind,
  toolMode: ToolMode,
  toolbarPosition: { x: number; y: number }
): DrawingState {
  return {
    drawables: [],
    undoStack: [],
    redoStack: [],
    sessionCreatedAt: null,
    currentSessionName: "Untitled session",
    currentSessionPath: null,
    isDirty: false,
    selectedDrawableId: null,
    activeTool,
    toolMode,
    preview: null,
    hidden: false,
    overlayMode: "draw",
    overlayVisible: true,
    toolbarPosition,
    settingsOpen: false
  };
}

function pushHistory(state: DrawingState) {
  return [...state.undoStack, state.drawables];
}

function reorderDrawables(
  drawables: Drawable[],
  selectedId: string,
  direction: "forward" | "backward" | "front" | "back"
) {
  const index = drawables.findIndex((drawable) => drawable.id === selectedId);
  if (index < 0) {
    return drawables;
  }

  const next = [...drawables];
  const [selected] = next.splice(index, 1);
  if (!selected) {
    return drawables;
  }

  switch (direction) {
    case "forward":
      next.splice(Math.min(next.length, index + 1), 0, selected);
      break;
    case "backward":
      next.splice(Math.max(0, index - 1), 0, selected);
      break;
    case "front":
      next.push(selected);
      break;
    case "back":
      next.unshift(selected);
      break;
  }

  return next;
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
        isDirty: true,
        preview: null,
        selectedDrawableId: action.drawable.id
      };
    case "replace-drawables":
      return {
        ...state,
        drawables: action.drawables,
        undoStack: pushHistory(state),
        redoStack: [],
        isDirty: true,
        preview: null,
        selectedDrawableId: action.drawables.some((drawable) => drawable.id === state.selectedDrawableId)
          ? state.selectedDrawableId
          : null
      };
    case "load-session":
      return {
        ...state,
        drawables: action.drawables,
        undoStack: [],
        redoStack: [],
        sessionCreatedAt: action.createdAt,
        currentSessionName: action.name,
        currentSessionPath: action.path,
        isDirty: false,
        preview: null,
        selectedDrawableId: null
      };
    case "mark-saved":
      return {
        ...state,
        sessionCreatedAt: action.createdAt,
        currentSessionName: action.name,
        currentSessionPath: action.path,
        isDirty: false
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
        isDirty: true,
        preview: null,
        selectedDrawableId: previous.some((drawable) => drawable.id === state.selectedDrawableId)
          ? state.selectedDrawableId
          : null
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
        isDirty: true,
        preview: null,
        selectedDrawableId: next.some((drawable) => drawable.id === state.selectedDrawableId)
          ? state.selectedDrawableId
          : null
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
        isDirty: true,
        preview: null,
        selectedDrawableId: null
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
    case "select-drawable":
      return { ...state, selectedDrawableId: action.id };
    case "delete-selected": {
      if (!state.selectedDrawableId) {
        return state;
      }

       const selected = state.drawables.find((drawable) => drawable.id === state.selectedDrawableId);
       if (selected?.locked) {
        return state;
       }

      const nextDrawables = state.drawables.filter((drawable) => drawable.id !== state.selectedDrawableId);
      if (nextDrawables.length === state.drawables.length) {
        return { ...state, selectedDrawableId: null };
      }

      return {
        ...state,
        drawables: nextDrawables,
        undoStack: pushHistory(state),
        redoStack: [],
        isDirty: true,
        preview: null,
        selectedDrawableId: null
      };
    }
    case "replace-selected-drawable": {
      const selectedIndex = state.drawables.findIndex((drawable) => drawable.id === action.drawable.id);
      if (selectedIndex < 0) {
        return state;
      }

      const nextDrawables = state.drawables.map((drawable, index) =>
        index === selectedIndex ? action.drawable : drawable
      );

      return {
        ...state,
        drawables: nextDrawables,
        undoStack: pushHistory(state),
        redoStack: [],
        isDirty: true,
        preview: null,
        selectedDrawableId: action.drawable.id
      };
    }
    case "set-selected-locked": {
      if (!state.selectedDrawableId) {
        return state;
      }

      const selectedIndex = state.drawables.findIndex((drawable) => drawable.id === state.selectedDrawableId);
      if (selectedIndex < 0) {
        return state;
      }

      const current = state.drawables[selectedIndex];
      if ((current.locked === true) === action.locked) {
        return state;
      }

      const nextDrawables = state.drawables.map((drawable, index) =>
        index === selectedIndex ? { ...drawable, locked: action.locked } : drawable
      );

      return {
        ...state,
        drawables: nextDrawables,
        undoStack: pushHistory(state),
        redoStack: [],
        isDirty: true,
        preview: null
      };
    }
    case "reorder-selected": {
      if (!state.selectedDrawableId) {
        return state;
      }

      const nextDrawables = reorderDrawables(state.drawables, state.selectedDrawableId, action.direction);
      if (nextDrawables === state.drawables) {
        return state;
      }
      if (nextDrawables.every((drawable, index) => drawable.id === state.drawables[index]?.id)) {
        return state;
      }

      return {
        ...state,
        drawables: nextDrawables,
        undoStack: pushHistory(state),
        redoStack: [],
        isDirty: true,
        preview: null
      };
    }
    case "duplicate-drawable":
      return {
        ...state,
        drawables: [...state.drawables, action.drawable],
        undoStack: pushHistory(state),
        redoStack: [],
        isDirty: true,
        preview: null,
        selectedDrawableId: action.drawable.id
      };
    default:
      return state;
  }
}
