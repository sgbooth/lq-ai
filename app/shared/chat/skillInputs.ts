import type { SkillInputs } from "@/shared/types.ts";
export function resolveSkillInputs(definitions: SkillInputs, values: Record<string, unknown>) {
  const resolved: Record<string, unknown> = {};
  const missing: string[] = [];
  for (const input of [...definitions.required, ...definitions.optional]) {
    const value = values[input.name] ?? input.default;
    if (value !== undefined) resolved[input.name] = value;
    if (
      definitions.required.some((required) => required.name === input.name) &&
      (value === undefined ||
        value === null ||
        value === "" ||
        (typeof value === "number" && !Number.isFinite(value)))
    )
      missing.push(input.name);
  }
  return { values: resolved, missing };
}
