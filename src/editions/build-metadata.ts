import editionConfig from "../../config/edition-config.json";
import type { AppEditionId } from "./edition";

export type EditionBuildMetadata = {
  edition: AppEditionId;
  editionLabel: "Basic" | "Trading";
  productName: string;
  shortName: string;
  distribution: string;
  identifier: string;
  executableName: string;
  version: string;
  installerBaseName: string;
  releaseFolder: string;
  bundleShortDescription: string;
  bundleLongDescription: string;
};

type EditionConfigFile = {
  defaultEdition: AppEditionId;
  publisher: string;
  channel: string;
  editions: Record<AppEditionId, EditionBuildMetadata>;
};

const config = editionConfig as EditionConfigFile;

export const EDITION_PUBLISHER = config.publisher;
export const EDITION_CHANNEL = config.channel;
export const DEFAULT_BUILD_EDITION = config.defaultEdition;

export function getEditionBuildMetadata(edition: AppEditionId) {
  return config.editions[edition];
}

export function getCurrentEditionBuildMetadata() {
  const candidate = import.meta.env.VITE_TRINK_EDITION;
  return getEditionBuildMetadata(candidate === "basic" || candidate === "trading" ? candidate : DEFAULT_BUILD_EDITION);
}

export function buildInstallerFilename(metadata: EditionBuildMetadata) {
  return `${metadata.installerBaseName}_${metadata.version}_x64-setup.exe`;
}

export function buildEditionWindowTitle(metadata: EditionBuildMetadata, surface: "overlay" | "toolbar" | "palette" | "settings") {
  const base = metadata.shortName;
  switch (surface) {
    case "overlay":
      return `${base} Overlay`;
    case "toolbar":
      return `${base} Toolbar`;
    case "palette":
      return `${base} Palette`;
    case "settings":
      return `${base} Settings`;
  }
}

export function createTauriConfig(baseConfig: Record<string, unknown>, metadata: EditionBuildMetadata) {
  const app = baseConfig.app as { windows?: Array<Record<string, unknown>> } | undefined;
  const windows = (app?.windows ?? []).map((window) => {
    const label = window.label;
    if (label !== "overlay" && label !== "toolbar" && label !== "palette" && label !== "settings") {
      return window;
    }

    return {
      ...window,
      title: buildEditionWindowTitle(metadata, label)
    };
  });

  return {
    ...baseConfig,
    productName: metadata.productName,
    version: metadata.version,
    identifier: metadata.identifier,
    mainBinaryName: metadata.executableName,
    app: {
      ...(app ?? {}),
      windows
    },
    bundle: {
      ...(baseConfig.bundle as Record<string, unknown>),
      shortDescription: metadata.bundleShortDescription,
      longDescription: metadata.bundleLongDescription,
      publisher: EDITION_PUBLISHER
    }
  };
}
