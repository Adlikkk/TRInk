import type { AppEdition } from "./edition";

export const basicEdition: AppEdition = {
  id: "basic",
  name: "TRInk Basic",
  productName: "TRInk Basic",
  shortName: "TRInk Basic",
  toolbarLabel: "Basic",
  windowTitle: "TRInk Basic",
  description: "A lightweight local screen annotation overlay for quick markup and presentation work.",
  aboutSummary: "Local screen annotation overlay.",
  availableModes: ["basic"],
  visibleToolIds: ["select", "pen", "highlighter", "line", "arrow", "rectangle", "eraser"],
  defaultTool: "select",
  defaultFavoriteTools: ["select", "pen", "highlighter", "line", "arrow", "rectangle", "eraser"],
  features: {
    timer: false,
    quickSessionActions: false,
    annotationExport: false,
    toolModeSwitcher: false,
    patternLabels: false,
    updateChecks: false
  }
};
