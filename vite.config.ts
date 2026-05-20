import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true
  },
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.pnpm-store/**", "**/dist/**", "**/src-tauri/**"]
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: ["es2021", "chrome105", "safari13"]
  }
});
