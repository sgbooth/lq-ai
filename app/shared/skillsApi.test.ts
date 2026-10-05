import { parseInputsFromYaml, parseSkillFrontmatter } from "@/shared/skillsApi.ts";
import { expect, it } from "vitest";
it("preserves nested metadata and parses typed inputs when forking a skill", () => {
  const yaml =
    "---\nname: review\njurisdiction: New York\ninputs:\n  - name: perspective\n    type: enum\n    enum: [recipient, discloser]\n    required: true\n    default: recipient\n---";
  expect(parseSkillFrontmatter(yaml)).toMatchObject({ jurisdiction: "New York" });
  expect(parseInputsFromYaml(yaml)).toEqual([
    {
      name: "perspective",
      type: "enum",
      enum: ["recipient", "discloser"],
      required: true,
      default: "recipient",
    },
  ]);
});
