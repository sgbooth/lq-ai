#!/usr/bin/env python3
"""Reproduce ADR 0038's local-source comparison; no third-party dependencies.

Run from any directory: python3 scripts/frontend_maintenance_metrics.py
Counts physical lines (including blanks/comments), heuristic code lines (excluding
blank and comment-only lines) and Unicode characters, not
tokens, AST complexity, bundle size, or functional coverage. Component units are
files, including entry points/pages/layouts, not individual exported functions.
"""

from __future__ import annotations

import json
import re
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".svelte", ".css", ".scss", ".html"}
STYLE = re.compile(r"<style\b[^>]*>(.*?)</style\s*>", re.DOTALL | re.IGNORECASE)
EXCLUDED_DIRS = {"node_modules", "dist", "build", "coverage", "__tests__", "browser"}
EXCLUDED_FILES = {"vite.config.ts", "playwright.config.ts", "index.html"}


def source_files(roots: list[str]) -> list[Path]:
    return sorted(
        path
        for root in roots
        for path in (ROOT / root).rglob("*")
        if path.is_file()
        and path.suffix in EXTENSIONS
        and not EXCLUDED_DIRS.intersection(path.relative_to(ROOT / root).parts)
        and path.name not in EXCLUDED_FILES
        and not re.search(r"\.(test|spec|browser)\.", path.name)
        and not path.name.endswith(".d.ts")
        and ".generated." not in path.name
    )


def lines(value: str) -> int:
    return len(value.splitlines())


def code_lines(value: str) -> int:
    """Lines that are neither blank nor comment-only (//, /* */, HTML comments).

    A heuristic, not a parser: comment markers inside strings are not special-cased.
    """
    count, block_end = 0, None
    for raw in value.splitlines():
        line = raw.strip()
        if block_end:
            if block_end in line:
                block_end = None
            continue
        if not line or line.startswith(("//", "*")):
            continue
        if line.startswith(("/*", "<!--")):
            end = "*/" if line.startswith("/*") else "-->"
            if end not in line[2:]:
                block_end = end
            continue
        count += 1
    return count


def metrics(roots: list[str]) -> dict:
    files = source_files(roots)
    texts = {path: path.read_text(encoding="utf-8") for path in files}
    components = {p: t for p, t in texts.items() if p.suffix in {".tsx", ".jsx", ".svelte"}}
    without_css = {p: STYLE.sub("", t) for p, t in components.items()}
    css = [t for p, t in texts.items() if p.suffix in {".css", ".scss"}]
    embedded = [block for t in components.values() for block in STYLE.findall(t)]
    component_lengths = [lines(t) for t in components.values()]
    return {
        "production_files": len(files),
        "source_lines": sum(lines(t) for t in texts.values()),
        "source_code_lines_excluding_blank_and_comment": sum(code_lines(t) for t in texts.values()),
        "source_characters": sum(len(t) for t in texts.values()),
        "median_file_characters": statistics.median(len(t) for t in texts.values()),
        "component_files": len(components),
        "component_lines": sum(component_lengths),
        "median_component_lines": statistics.median(component_lengths),
        "average_component_characters": sum(len(t) for t in components.values()) / len(components),
        "components_over_500_lines": sum(n > 500 for n in component_lengths),
        "component_lines_without_style_blocks": sum(lines(t) for t in without_css.values()),
        "median_component_lines_without_style_blocks": statistics.median(
            lines(t) for t in without_css.values()
        ),
        "components_over_500_lines_without_style_blocks": sum(
            lines(t) > 500 for t in without_css.values()
        ),
        "standalone_css_files": len(css),
        "components_with_style_blocks": sum(bool(STYLE.search(t)) for t in components.values()),
        # The opening style tag's newline is a delimiter, not an authored CSS line.
        "css_lines": sum(lines(t) for t in css) + sum(lines(t.lstrip("\r\n")) for t in embedded),
        "css_characters": sum(len(t) for t in css + embedded),
        "largest_components": [
            {
                "file": str(p.relative_to(ROOT)),
                "lines": lines(t),
                "lines_without_style_blocks": lines(without_css[p]),
            }
            for p, t in sorted(
                components.items(), key=lambda item: (-lines(item[1]), str(item[0]))
            )[:5]
        ],
        "files": [str(p.relative_to(ROOT)) for p in files],
    }


def shared_consumers() -> dict[str, list[str]]:
    files = source_files(["app"])
    shared = [
        p for p in files if p.suffix == ".tsx" and "shared" in p.relative_to(ROOT / "app").parts
    ]
    consumers = {}
    for target in shared:
        # Resolve literal @/ imports, with or without a TS/TSX extension.
        module = "@/" + str(target.relative_to(ROOT / "app").with_suffix(""))
        pattern = re.compile(r"(?:from\s*|import\s*)[\"']" + re.escape(module) + r"(?:\.tsx)?[\"']")
        consumers[str(target.relative_to(ROOT))] = [
            str(p.relative_to(ROOT))
            for p in files
            if p != target and pattern.search(p.read_text(encoding="utf-8"))
        ]
    return consumers


def main() -> None:
    print(
        json.dumps(
            {
                "react": metrics(["app"]),
                "svelte": metrics(["web/src/lib/lq-ai", "web/src/routes/lq-ai"]),
                "react_shared_direct_importers": shared_consumers(),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
