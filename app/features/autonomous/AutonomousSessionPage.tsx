import * as api from "@/features/autonomous/autonomousApi.ts";
import { buildTimeline } from "@/features/autonomous/receiptTimeline.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { MarkdownPanel } from "@/shared/MarkdownPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Alert, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import type React from "react";
import { useState } from "react";
import { Link } from "wouter";
interface Props {
  id: string;
}
export const AutonomousSessionPage: React.FC<Props> = ({ id }) => {
  const [terminal, setTerminal] = useState(false);
  const resource = useResource(
    async () => {
      const d = await api.getSession(id);
      setTerminal(d.session.status !== "running");
      return d;
    },
    [id],
    terminal ? undefined : 3000,
  );
  const s = resource.data?.session;
  const r = resource.data?.receipt;
  return (
    <FeaturePanel
      title="Run receipt"
      actions={
        <Button variant="default" component={Link} href="/autonomous">
          All runs
        </Button>
      }
    >
      <ResourcePanel {...resource}>
        {s && r && (
          <Stack>
            <Group>
              <Badge>{s.status}</Badge>
              <Badge>{s.halt_state}</Badge>
              <Text>Phase: {s.current_phase}</Text>
              <Text>
                Spend: ${s.cost_total_usd} · cap:{" "}
                {s.max_cost_usd ? "$" + s.max_cost_usd : "default"}
              </Text>
              {s.status === "running" && (
                <ConfirmButton
                  label="Halt run"
                  description="Request an immediate stop. Completed work and its receipt remain available."
                  onConfirm={async () => {
                    await api.haltSession(id);
                    resource.reload();
                  }}
                />
              )}
            </Group>
            {s.error && <Alert color="red">{s.error}</Alert>}
            {r.terminal_reason && <Alert>{r.terminal_reason}</Alert>}
            {s.cost_cap_reached && <Alert color="orange">Spending cap reached.</Alert>}
            <Text fw={600}>Receipt timeline</Text>
            {buildTimeline(r).map((node, i) => (
              <Card key={i} withBorder>
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text fw={600}>
                      {node.kind === "phase" ? "Phase: " + node.phase : node.tool}
                    </Text>
                    {node.kind === "tool" && (
                      <Text size="sm">
                        {node.outcome}
                        {node.cost_usd !== undefined ? " · $" + node.cost_usd : ""}
                      </Text>
                    )}
                  </Stack>
                  <Text size="sm" c="dimmed">
                    {node.at ? new Date(node.at).toLocaleString() : "Time unavailable"}
                  </Text>
                </Group>
              </Card>
            ))}
            {s.result && (
              <Card withBorder>
                <Text fw={600}>Result</Text>
                <MarkdownPanel
                  content={
                    typeof s.result.summary === "string"
                      ? s.result.summary
                      : JSON.stringify(s.result, null, 2)
                  }
                />
              </Card>
            )}
          </Stack>
        )}
      </ResourcePanel>
    </FeaturePanel>
  );
};
