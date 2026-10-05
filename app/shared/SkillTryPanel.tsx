import { useResource } from "@/hooks/useResource.ts";
import { ChatPanel } from "@/shared/chat/ChatPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { ensureSandbox } from "@/shared/sandboxApi.ts";
import { Stack, Text } from "@mantine/core";
import type React from "react";
interface Props {
  skillName?: string;
  inlineBody?: string;
}
export const SkillTryPanel: React.FC<Props> = ({ skillName, inlineBody }) => {
  const sandbox = useResource(ensureSandbox, []);
  return (
    <ResourcePanel {...sandbox}>
      {sandbox.data && (
        <Stack>
          <Text size="sm" c="dimmed">
            Try this skill in your sandbox matter. Model calls use your configured providers.
          </Text>
          <ChatPanel
            projectId={sandbox.data.id}
            initialSkills={skillName ? [skillName] : []}
            inlineSkill={inlineBody}
          />
        </Stack>
      )}
    </ResourcePanel>
  );
};
