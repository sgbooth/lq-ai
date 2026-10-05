import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import type { Plugin } from "vite";
const directory = fileURLToPath(new URL("../web/static/learn/playgrounds/", import.meta.url));
/** Existing self-contained educational documents are assets, independent of Svelte. */
export function learningArtifacts(): Plugin {
  return {
    name: "learning-artifacts",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const match = /^\/learn\/playgrounds\/([a-z0-9-]+\.html)(?:\?.*)?$/.exec(req.url ?? "");
        if (!match) return next();
        try {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(await readFile(directory + match[1], "utf8"));
        } catch {
          res.statusCode = 404;
          res.end("Playground not found");
        }
      });
    },
    async generateBundle() {
      let names: string[];
      try {
        names = await readdir(directory);
      } catch {
        return;
      }
      for (const name of names) {
        if (name.endsWith(".html"))
          this.emitFile({
            type: "asset",
            fileName: "learn/playgrounds/" + name,
            source: await readFile(directory + name),
          });
      }
    },
  };
}
