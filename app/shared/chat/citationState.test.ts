import { expect, it } from "vitest";
import {
  citationRenderState,
  citationTooltip,
  iterCitationMarkers,
  matchMarkerState,
} from "@/shared/chat/citationState.ts";
import type { Citation } from "@/shared/types.ts";
const citation: Citation = {
  id: "c",
  source_file_id: "f",
  source_offset_start: 0,
  source_offset_end: 5,
  source_text: "quote",
  verified: true,
  verification_method: "exact_match",
};
it("matches quotes against persisted source text, never source index alone", () => {
  const markers = [...iterCitationMarkers('“quote” (Source: [9]) and "invented" (Source: [9])')];
  expect(markers).toHaveLength(2);
  expect(matchMarkerState(markers[0], [citation]).state).toBe("verified-exact");
  expect(matchMarkerState(markers[1], [citation]).state).toBe("unverified");
  expect(citationRenderState({ ...citation, verified: false })).toBe("unverified");
});
it("surfaces ensemble disagreement and partial support without exact verification", () => {
  const partial = { ...citation, verification_method: "ensemble_majority" as const, partial: true };
  expect(citationRenderState(partial)).toBe("verified-paraphrase");
  expect(citationTooltip("verified-paraphrase", partial)).toContain("some disagreed");
  expect(
    citationTooltip("verified-paraphrase", { ...partial, verification_method: "paraphrase_judge" }),
  ).toContain("partially supports");
});
