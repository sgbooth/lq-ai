import { atom } from "jotai";
import type { Preferences } from "@/shared/types.ts";
import { atomWithStorage } from "jotai/utils";
export const autoEnhanceAtom = atomWithStorage("lq-ai:auto-enhance", false);
export const captureInlineAtom = atomWithStorage("lq-ai:capture-inline", true);

export const settingsAtom = atom<Preferences>({
  reasoning_visibility: "disclosure",
  featured_tools: "prominent",
  workspace_layout: "three_pane",
  trust_pills: "labels",
  provenance_pills: "always",
  autonomous_enabled: false,
});
