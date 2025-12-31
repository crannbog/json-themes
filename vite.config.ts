import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [],
  build:   {
    target: "esnext",
    lib:    {
      entry:    resolve(__dirname, "src/index.ts"),
      name:     "json-themes",
      fileName: "json-themes"
    },
    rollupOptions: {
      output: {
        exports: "named",
        compact: true,
      }
    }
  },
});
