import { save } from "@tauri-apps/plugin-dialog";
import { writeFile, writeTextFile } from "@tauri-apps/plugin-fs";

export async function requestSaveAnnotationsPngPath(defaultPath: string) {
  return save({
    title: "Export TRInk annotations as PNG",
    defaultPath,
    filters: [{ name: "PNG image", extensions: ["png"] }]
  });
}

export async function requestSaveAnnotationsJsonPath(defaultPath: string) {
  return save({
    title: "Export TRInk annotations as JSON",
    defaultPath,
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
}

export async function writeBinaryExportFile(path: string, bytes: Uint8Array) {
  await writeFile(path, bytes);
}

export async function writeJsonExportFile(path: string, contents: string) {
  await writeTextFile(path, contents);
}
