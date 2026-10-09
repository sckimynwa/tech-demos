import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_PORT = Number(process.env.PORT ?? 8787);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.X402_UI_PORT ?? 5173),
    proxy: {
      "/api": `http://127.0.0.1:${API_PORT}`,
      "/facilitator": `http://127.0.0.1:${API_PORT}`,
    },
  },
});
