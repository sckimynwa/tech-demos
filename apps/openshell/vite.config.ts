import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { openshellGateway } from "./vite-plugin-gateway.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), openshellGateway()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
