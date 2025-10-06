import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
      "@generated": resolve(
        dirname(fileURLToPath(import.meta.url)),
        "src/generated",
      ),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
