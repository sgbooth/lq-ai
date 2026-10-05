import { routes } from "@/routes.ts";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
const root = fileURLToPath(new URL("./", import.meta.url));
const files = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .filter((e) => !["node_modules", "dist", "test-results", ".git"].includes(e.name))
    .flatMap((e) => (e.isDirectory() ? files(directory + e.name + "/") : [directory + e.name]));
it("covers every LQ.AI Svelte page with a React route", () => {
  const pages = files(root + "../web/src/routes/lq-ai/").filter((p) => p.endsWith("/+page.svelte"));
  const patterns = [...routes, "/login", "/change-password", "/word-addin/oauth-start"].map(
    (p) => new RegExp("^" + p.replace(/:[a-z]+/g, "[^/]+") + "$"),
  );
  const missing = pages
    .map((p) => p.split("/routes/lq-ai")[1].replace("/+page.svelte", "") || "/")
    .map((p) => p.replace("[id]", "example"))
    .filter((p) => !patterns.some((pattern) => pattern.test(p)));
  expect(missing).toEqual([]);
});
it("keeps component styling and shared dependencies within the explicit rules", () => {
  const all = files(root);
  expect(all.filter((p) => p.endsWith(".css") && !p.endsWith("/global.css"))).toEqual([]);
  for (const path of all.filter((p) => /\.(ts|tsx)$/.test(p) && !p.endsWith(".test.ts"))) {
    const source = readFileSync(path, "utf8");
    expect(source, path).not.toMatch(/\b(?:style|styles)=|<style\b|\.module\.css/);
    expect(source, path).not.toMatch(/from ["']@\/[^"']+(?<!\.tsx?)["']/);
    expect(source, path).not.toMatch(/from ["'][^"']*\/web\/src\//);
    if (path.includes("/shared/")) expect(source, path).not.toMatch(/from ["']@\/features\//);
    if (path.endsWith(".tsx") && !path.endsWith("/Icon.tsx"))
      expect(source, path).not.toContain('from "@tabler/icons-react"');
  }
});
