import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    sourcemap: false,
    // three.js and React Three Fiber load on their own, only once the hero or the demo needs them
    rollupOptions: {
      output: {
        manualChunks(id) {
          // the 3D libraries in one lazy chunk; every other package in "vendor", so nothing the page needs
          // up front gets folded into the 3D chunk (which would then load immediately)
          if (/node_modules\/(three|three-stdlib|@react-three|@monogrid)\//.test(id)) return "three";
          if (id.includes("node_modules") || id.includes("vite/preload-helper") || id.includes("commonjsHelpers")) return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 1100,
  },
});
