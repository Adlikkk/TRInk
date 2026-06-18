import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const configPath = resolve(repoRoot, "config", "edition-config.json");
const tauriBaseConfigPath = resolve(repoRoot, "src-tauri", "tauri.conf.base.json");
const tauriConfigPath = resolve(repoRoot, "src-tauri", "tauri.conf.json");

const editionConfig = JSON.parse(readFileSync(configPath, "utf8"));
const baseConfig = JSON.parse(readFileSync(tauriBaseConfigPath, "utf8"));

const edition = process.env.TRINK_EDITION ?? editionConfig.defaultEdition ?? "trading";
const metadata = editionConfig.editions?.[edition];

if (!metadata) {
  throw new Error(`Unknown TRINK_EDITION '${edition}'.`);
}

const titleMap = {
  overlay: `${metadata.shortName} Overlay`,
  toolbar: `${metadata.shortName} Toolbar`,
  palette: `${metadata.shortName} Palette`,
  settings: `${metadata.shortName} Settings`
};

const generatedConfig = {
  ...baseConfig,
  productName: metadata.productName,
  version: metadata.version,
  identifier: metadata.identifier,
  mainBinaryName: metadata.executableName,
  app: {
    ...baseConfig.app,
    windows: (baseConfig.app?.windows ?? []).map((window) => ({
      ...window,
      title: titleMap[window.label] ?? window.title
    }))
  },
  bundle: {
    ...baseConfig.bundle,
    shortDescription: metadata.bundleShortDescription,
    longDescription: metadata.bundleLongDescription,
    publisher: editionConfig.publisher
  }
};

writeFileSync(tauriConfigPath, `${JSON.stringify(generatedConfig, null, 2)}\n`, "utf8");

console.log(`Prepared edition '${edition}'`);
console.log(`productName=${metadata.productName}`);
console.log(`version=${metadata.version}`);
console.log(`identifier=${metadata.identifier}`);
console.log(`mainBinaryName=${metadata.executableName}`);
