import { SkillInputsPanel } from "@/shared/SkillInputsPanel.tsx";
import { Alert, Card, Checkbox, MultiSelect, Stack, Text } from "@mantine/core";

import { useChatPanel } from "@/shared/chat/chatPanelContext.ts";
export const ChatSkillsPanel = () => {
  const {
    busy,
    skills,
    setSkills,
    inputValues,
    setInputValues,
    definitions,
    sticky,
    setSticky,
    choices,
    skillDefinitions,
  } = useChatPanel();
  const skillOptions =
    choices.data?.skills.map((s) => ({ value: s.name, label: s.title || s.name })) || [];
  return (
    <Stack>
      <MultiSelect
        label="Attached skills"
        searchable
        clearable
        data={skillOptions}
        value={skills}
        onChange={setSkills}
        disabled={busy}
      />
      {definitions.error && <Alert color="red">{definitions.error}</Alert>}
      {skillDefinitions?.map((def) => (
        <Card key={def.slug} withBorder>
          <Text fw={600}>{def.slug} inputs</Text>
          <SkillInputsPanel
            inputs={def.inputs}
            values={inputValues[def.slug] ?? {}}
            onChange={(values) => setInputValues({ ...inputValues, [def.slug]: values })}
          />
        </Card>
      ))}
      <Checkbox
        label="Keep skills attached for subsequent turns"
        checked={sticky}
        onChange={(e) => setSticky(e.currentTarget.checked)}
      />
    </Stack>
  );
};
