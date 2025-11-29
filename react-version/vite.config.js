import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // 👈 now "@/..." maps to src/...
    },
  },
  // (optional) if you want to run on port 3000, see section B below
  server: { port: 3000 },
});