import { resolveSkillInputs } from "@/shared/chat/skillInputs.ts";
import { expect, it } from "vitest";
it("submits defaults, preserves false/zero, and blocks missing required inputs", () => {
  const definitions = {
    name: "test",
    required: [
      { name: "jurisdiction" },
      { name: "count", default: 0 },
      { name: "enabled", default: false },
    ],
    optional: [{ name: "perspective", default: "both" }],
  };
  expect(resolveSkillInputs(definitions, {})).toEqual({
    values: { count: 0, enabled: false, perspective: "both" },
    missing: ["jurisdiction"],
  });
  expect(resolveSkillInputs(definitions, { jurisdiction: "New York", count: NaN }).missing).toEqual(
    ["count"],
  );
});
