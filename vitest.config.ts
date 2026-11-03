import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      // Unit coverage targets pure logic. Browser-bound modules (canvas
      // rasterization, PDF, File API decoding, font fetching, downloads) can't
      // run in Node and are exercised end-to-end in real browsers (e2e/).
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/render/**/*.{ts,tsx}",
        "src/features/studio/store/**/*.ts",
        "src/features/studio/interactions/**/*.ts",
        "src/features/export/qrDocument.ts",
        "src/features/templates/**/*.ts",
      ],
      exclude: ["**/*.d.ts", "src/lib/text/measure.ts", "src/lib/security/csp.ts"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
