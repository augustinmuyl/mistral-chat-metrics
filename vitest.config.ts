import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    environmentMatchGlobs: [["tests/integration/**", "node"]],
    globals: true,
    setupFiles: [],
    exclude: ["node_modules", ".next", "out", "build"],
  },
});
