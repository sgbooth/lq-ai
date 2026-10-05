import type { SkillInputDef } from "@/shared/types.ts";
import { Checkbox, NumberInput, Select, Stack, TextInput } from "@mantine/core";
import type React from "react";
interface Props {
  inputs: SkillInputDef[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}
export const SkillInputsPanel: React.FC<Props> = ({ inputs, values, onChange }) => (
  <Stack>
    {inputs.map((input) => {
      const value = values[input.name] ?? input.default;
      const update = (v: unknown) => onChange({ ...values, [input.name]: v });
      const props = { label: input.name, description: input.description, required: input.required };
      return input.type === "boolean" ? (
        <Checkbox
          key={input.name}
          {...props}
          checked={Boolean(value)}
          onChange={(e) => update(e.currentTarget.checked)}
        />
      ) : input.type === "integer" ? (
        <NumberInput
          key={input.name}
          {...props}
          allowDecimal={false}
          value={typeof value === "number" ? value : ""}
          onChange={update}
        />
      ) : input.type === "enum" ? (
        <Select
          key={input.name}
          {...props}
          data={input.enum ?? []}
          value={value === undefined ? null : String(value)}
          onChange={update}
        />
      ) : (
        <TextInput
          key={input.name}
          {...props}
          value={value === undefined ? "" : String(value)}
          onChange={(e) => update(e.currentTarget.value)}
        />
      );
    })}
  </Stack>
);
