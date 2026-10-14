import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/* a short hash of every file in public/, keyed by its URL path; src/lib/pub.ts puts it on the end of
   each address, so an updated photo or video can never come from a stale cache */
function publicVersions(dir = "public") {
  const out: Record<string, string> = {};
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out["/" + relative(dir, p).split("\\").join("/")] = createHash("sha1").update(readFileSync(p)).digest("hex").slice(0, 8);
    }
  };
  walk(dir);
  return out;
}

export default defineConfig({
  plugins: [react()],
  define: { __PUBLIC_V__: JSON.stringify(publicVersions()) },
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
