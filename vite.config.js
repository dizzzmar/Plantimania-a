import {defineConfig} from "vite";

// base relativa para poder publicarlo en GitHub Pages o en cualquier subcarpeta.
export default defineConfig({
  base: "./",
  worker: {format: "es"},
});
