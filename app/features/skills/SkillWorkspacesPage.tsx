import { skillWorkspacesApi as api } from "@/features/skills/skillWorkspacesApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Button, Card, Group, Modal, Stack, Text } from "@mantine/core";
import { useState } from "react";
export const SkillWorkspacesPage = () => {
  const [offset, setOffset] = useState(0);
  const resource = useResource(() => api.list(offset), [offset]);
  const action = useAction();
  const [preview, setPreview] = useState<{ name: string; content: string } | null>(null);
  return (
    <FeaturePanel title="Saved skill work">
      <ActionFeedback {...action} />
      <ResourcePanel {...resource}>
        <Stack>
          {resource.data?.map((w) => (
            <Card withBorder key={w.id}>
              <Stack>
                <Text fw={600}>
                  {w.skill_name} · {w.project_name || "Personal workspace"}
                </Text>
                {w.files.map((f) => (
                  <Button
                    key={f.name}
                    variant="subtle"
                    onClick={() =>
                      void action.run(async () => {
                        const file = await api.read(w.id, f.name);
                        setPreview({ name: f.name, content: file.content });
                      })
                    }
                  >
                    {f.name} · {f.size_bytes} bytes
                  </Button>
                ))}
                <ConfirmButton
                  label="Delete saved work"
                  description="Delete all files in this workspace?"
                  onConfirm={async () => {
                    await api.reset(w.id);
                    resource.reload();
                  }}
                />
              </Stack>
            </Card>
          ))}
          <Group>
            <Button disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 50))}>
              Previous
            </Button>
            <Button
              disabled={(resource.data?.length || 0) < 50}
              onClick={() => setOffset(offset + 50)}
            >
              Next
            </Button>
          </Group>
        </Stack>
      </ResourcePanel>
      <Modal opened={!!preview} onClose={() => setPreview(null)} title={preview?.name} size="lg">
        <Text component="pre">{preview?.content}</Text>
      </Modal>
    </FeaturePanel>
  );
};
