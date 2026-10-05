import * as api from "@/features/admin/adminApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Badge, Button, Card, Group, PasswordInput, Stack, Text } from "@mantine/core";
import { useState } from "react";
export const ProviderKeysPage = () => {
  const resource = useResource(() => api.listProviderKeys());
  const [provider, setProvider] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const action = useAction();
  return (
    <FeaturePanel
      title="Provider keys"
      description="Keys are write-only and encrypted by the gateway."
    >
      <ActionFeedback {...action} />
      <ResourcePanel {...resource}>
        <Stack>
          {resource.data?.provider_keys.map((row) => (
            <Card withBorder key={row.provider}>
              <Stack>
                <Group>
                  <Text fw={600}>{row.provider}</Text>
                  <Badge>{row.configured ? "Configured" : "Not configured"}</Badge>
                  <Text size="xs">
                    Source: {row.source || "none"} · ending {row.last4 || "—"}
                  </Text>
                </Group>
                <Group>
                  <Button
                    variant="light"
                    onClick={() => {
                      setProvider(row.provider);
                      setKey("");
                    }}
                  >
                    Add / replace key
                  </Button>
                  <ConfirmButton
                    label="Revoke"
                    disabled={row.source !== "runtime"}
                    description="Revoke this runtime provider key?"
                    onConfirm={async () => {
                      await api.revokeProviderKey(row.provider);
                      resource.reload();
                    }}
                  />
                </Group>
                {provider === row.provider && (
                  <Stack
                    component="form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void action.run(async () => {
                        await api.setProviderKey(row.provider, key);
                        setKey("");
                        setProvider(null);
                        resource.reload();
                      }, "Provider key saved.");
                    }}
                  >
                    <PasswordInput
                      label="API key"
                      required
                      value={key}
                      onChange={(e) => setKey(e.currentTarget.value)}
                      autoComplete="off"
                    />
                    <Button type="submit" loading={action.busy}>
                      Save key
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
