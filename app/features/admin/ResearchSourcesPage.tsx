import * as api from "@/features/admin/adminApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Badge, Button, Card, Group, PasswordInput, Stack, Text } from "@mantine/core";
import { useState } from "react";
export const ResearchSourcesPage = () => {
  const resource = useResource(() => api.listToolProviders());
  const [editing, setEditing] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const action = useAction();
  return (
    <FeaturePanel title="Research sources">
      <ActionFeedback {...action} />
      <ResourcePanel {...resource}>
        <Stack>
          {resource.data?.tool_providers.map((row) => (
            <Card withBorder key={row.type}>
              <Stack>
                <Group>
                  <Text fw={600}>{row.name || row.type}</Text>
                  <Badge>{row.enabled ? "Enabled" : "Disabled"}</Badge>
                  <Text size="sm">Egress tier {row.egress_tier || "—"}</Text>
                </Group>
                <Group>
                  {row.key_required ? (
                    <Button
                      onClick={() => {
                        setEditing(row.type);
                        setKey("");
                      }}
                    >
                      Set API key
                    </Button>
                  ) : (
                    <Button
                      disabled={row.enabled || action.busy}
                      onClick={() =>
                        void action.run(async () => {
                          await api.setToolProvider(row.type);
                          resource.reload();
                        })
                      }
                    >
                      Enable
                    </Button>
                  )}
                  <ConfirmButton
                    label="Disable"
                    disabled={!row.enabled}
                    description="Disable this research source?"
                    onConfirm={async () => {
                      await api.deleteToolProvider(row.type);
                      resource.reload();
                    }}
                  />
                </Group>
                {editing === row.type && (
                  <Stack
                    component="form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void action.run(async () => {
                        await api.setToolProvider(row.type, key);
                        setKey("");
                        setEditing(null);
                        resource.reload();
                      });
                    }}
                  >
                    <PasswordInput
                      label="API key"
                      required
                      value={key}
                      onChange={(e) => setKey(e.currentTarget.value)}
                    />
                    <Button type="submit" loading={action.busy}>
                      Save
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      </ResourcePanel>
    </FeaturePanel>
  );
};
