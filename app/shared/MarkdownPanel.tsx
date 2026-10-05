import { ScrollArea, Text, Typography } from "@mantine/core";
import DOMPurify from "dompurify";
import { marked } from "marked";
import React from "react";
import {
  citationTooltip,
  iterCitationMarkers,
  matchMarkerState,
} from "@/shared/chat/citationState.ts";
import type { Citation } from "@/shared/types.ts";
const forbiddenTags = ["style", "iframe", "form", "input"];
const forbiddenAttributes = ["style", "class"];
const citationColors = {
  "verified-exact": "teal",
  "verified-tolerant": "green",
  "verified-paraphrase": "yellow",
  unverified: "red",
};
const citationLabels = {
  "verified-exact": "Verified verbatim",
  "verified-tolerant": "Verified with formatting differences",
  "verified-paraphrase": "Judge verified",
  unverified: "Unverified",
};
interface Props {
  content: string;
  citations?: Citation[];
}
/** Render sanitized Markdown as React nodes so inline indicators use Mantine. */
function renderNode(
  node: Node,
  key: number,
  citations: Citation[],
  inCode = false,
): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (inCode) return text;
    const pieces: React.ReactNode[] = [];
    let cursor = 0;
    for (const marker of iterCitationMarkers(text)) {
      pieces.push(text.slice(cursor, marker.start));
      const { state, citation } = matchMarkerState(marker, citations);
      pieces.push(
        <Text
          span
          key={marker.start}
          c={citationColors[state]}
          td="underline"
          title={citationTooltip(state, citation)}
        >
          {text.slice(marker.start, marker.end)}{" "}
          <Text span size="xs">
            [{citationLabels[state]}
            {citation?.partial ? " · caveats" : ""}]
          </Text>
        </Text>,
      );
      cursor = marker.end;
    }
    pieces.push(text.slice(cursor));
    return pieces;
  }
  if (!(node instanceof Element)) return null;
  const tag = node.tagName.toLowerCase();
  const attrs: Record<string, unknown> = { key };
  for (const attr of node.attributes) {
    if (["href", "src", "alt", "title", "colspan", "rowspan"].includes(attr.name))
      attrs[attr.name === "colspan" ? "colSpan" : attr.name === "rowspan" ? "rowSpan" : attr.name] =
        attr.value;
  }
  if (tag === "a") attrs.rel = "noopener noreferrer";
  const children = Array.from(node.childNodes).map((child, i) =>
    renderNode(child, i, citations, inCode || tag === "code" || tag === "pre"),
  );
  return React.createElement(tag, attrs, ...children);
}
export const MarkdownPanel: React.FC<Props> = ({ content, citations }) => {
  const html = DOMPurify.sanitize(marked.parse(content, { async: false }), {
    FORBID_TAGS: forbiddenTags,
    FORBID_ATTR: forbiddenAttributes,
  });
  const nodes =
    citations === undefined
      ? null
      : Array.from(new DOMParser().parseFromString(html, "text/html").body.childNodes).map(
          (node, i) => renderNode(node, i, citations),
        );
  return (
    <ScrollArea type="auto">
      <Typography>{nodes ?? <div dangerouslySetInnerHTML={{ __html: html }} />}</Typography>
    </ScrollArea>
  );
};
