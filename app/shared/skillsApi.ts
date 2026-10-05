import { parse } from "yaml";
/**
 * /api/v1/skills — list + detail.
 *
 * The detail call's response carries `content_yaml` (frontmatter); the input
 * form needs the parsed `inputs` block. We parse it client-side via a small
 * YAML-subset parser keyed only at the keys the skill-authoring guide
 * documents (`inputs:` followed by a list of mappings).
 *
 * If the upstream backend later surfaces parsed `inputs` directly on the
 * Skill payload, this client adopts that and skips the local parse.
 */
import { apiRequest } from "@/shared/api.ts";
import type {
  Skill,
  SkillAutocompleteResponse,
  SkillInputDef,
  SkillInputs,
  SkillSummary,
} from "@/shared/types.ts";

/** GET /api/v1/skills — summary list. */
export async function listSkills(scope?: "builtin" | "user" | "team"): Promise<SkillSummary[]> {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : "";
  return apiRequest<SkillSummary[]>(`/skills${qs}`);
}

/** GET /api/v1/skills/{name}/inputs — canonical input definitions resolved user > team > built-in. */
export async function getInputs(name: string): Promise<SkillInputs> {
  return apiRequest<SkillInputs>(`/skills/${encodeURIComponent(name)}/inputs`);
}

/**
 * GET /api/v1/skills/autocomplete?q=&limit= — Wave D.2 Task 2.5.
 *
 * Lightweight typeahead suggestions for the slash-invocation dropdown
 * and the Skill Creator's "fork from existing" picker. The backend ranks
 * results by slash-alias prefix > slug prefix > title-substring; this
 * client just forwards the query unchanged. ``limit`` defaults to 10
 * (the backend caps at 50).
 */
export async function autocompleteSkills(
  q: string,
  limit: number = 10,
): Promise<SkillAutocompleteResponse> {
  const path = `/skills/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`;
  return apiRequest<SkillAutocompleteResponse>(path);
}

/**
 * GET /api/v1/skills/{name} — full skill payload, with `inputs` parsed
 * from `content_yaml` when the backend doesn't already surface it.
 */
export async function getSkill(name: string): Promise<Skill> {
  const skill = await apiRequest<Skill>(`/skills/${encodeURIComponent(name)}`);
  if (!skill.inputs && skill.content_yaml) {
    skill.inputs = parseInputsFromYaml(skill.content_yaml);
  }
  return skill;
}

export function parseSkillFrontmatter(yaml: string): Record<string, unknown> {
  const data = parse(yaml.replace(/^---\s*\n/, "").replace(/\n---\s*$/, ""));
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}
export function parseInputsFromYaml(yaml: string): SkillInputDef[] {
  try {
    const inputs = parseSkillFrontmatter(yaml).inputs;
    if (!Array.isArray(inputs)) return [];
    return inputs.filter(
      (input): input is SkillInputDef =>
        !!input && typeof input === "object" && typeof input.name === "string",
    );
  } catch {
    return [];
  }
}
