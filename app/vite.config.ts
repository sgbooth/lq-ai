import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { learningArtifacts } from "./learningArtifacts.ts";
export default defineConfig({
  plugins: [react(), learningArtifacts()],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  server: {
    port: 5173,
    proxy: {
      "/lq": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lq/, ""),
      },
      // Swagger UI at /lq/docs requests the schema from the site root.
      "/openapi.json": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});
