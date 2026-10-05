import * as api from "@/features/admin/intakeBridgesApi.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Button, Card, Group, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
export const IntakeBridgesPage = () => {
  const resource = useResource(() => api.listIntakeBridges());
  const [slack, setSlack] = useState("");
  const [teams, setTeams] = useState("");
  return (
    <FeaturePanel title="Intake bridges">
      <ResourcePanel {...resource}>
        <Stack>
          <Text fw={600}>Slack workspaces</Text>
          {resource.data?.slack_workspaces.map((w) => (
            <Card key={w.id} withBorder>
              <Group>
                <Text>{w.team_name || w.team_id}</Text>
                <ConfirmButton
                  label="Disconnect"
                  description="Disconnect this Slack workspace?"
                  onConfirm={async () => {
                    await api.deleteSlackWorkspace(w.id);
                    resource.reload();
                  }}
                />
              </Group>
            </Card>
          ))}
          <TextInput
            label="Slack bridge public URL"
            placeholder="https://slack.example.com"
            value={slack}
            onChange={(e) => setSlack(e.currentTarget.value)}
          />
          <Button
            component="a"
            href={slack.replace(/\/$/, "") + "/slack/oauth/install"}
            target="_blank"
            disabled={!/^https?:\/\//.test(slack)}
          >
            Install Slack
          </Button>
          <Text fw={600}>Teams tenants</Text>
          {resource.data?.teams_tenants.map((t) => (
            <Card key={t.id} withBorder>
              <Group>
                <Text>{t.tenant_name || t.tenant_id}</Text>
                <ConfirmButton
                  label="Disconnect"
                  description="Disconnect this Teams tenant?"
                  onConfirm={async () => {
                    await api.deleteTeamsTenant(t.id);
                    resource.reload();
                  }}
                />
              </Group>
            </Card>
          ))}
          <TextInput
            label="Teams bridge public URL"
            placeholder="https://teams.example.com"
            value={teams}
            onChange={(e) => setTeams(e.currentTarget.value)}
          />
          <Button
            component="a"
            href={teams.replace(/\/$/, "") + "/teams/oauth/install"}
            target="_blank"
            disabled={!/^https?:\/\//.test(teams)}
          >
            Install Teams
          </Button>
          <Text c="dimmed">Quick-ask configuration is not yet available.</Text>
        </Stack>
      </ResourcePanel>
    </FeaturePanel>
  );
};
