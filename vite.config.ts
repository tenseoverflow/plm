import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@store": resolve(dirname(fileURLToPath(import.meta.url)), "src/store"),
      "@lib": resolve(dirname(fileURLToPath(import.meta.url)), "src/lib"),
      "@components": resolve(
        dirname(fileURLToPath(import.meta.url)),
        "src/components",
      ),
      "@pages": resolve(
        dirname(fileURLToPath(import.meta.url)),
        "src/components/pages",
      ),
    },
  },
});
