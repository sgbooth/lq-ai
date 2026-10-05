import * as api from "@/features/autonomous/autonomousApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { PaginationPanel } from "@/shared/PaginationPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Anchor, Button, Card, Checkbox, Group, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { Link } from "wouter";
export const AutonomousSchedulesPage = () => {
  const [offset, setOffset] = useState(0);
  const r = useResource(() => api.listSchedules(undefined, 50, offset), [offset]);
  const a = useAction();
  return (
    <FeaturePanel
      title="Schedules"
      actions={
        <Button component={Link} href="/autonomous/schedules/new">
          New schedule
        </Button>
      }
    >
      <ActionFeedback {...a} />
      <ResourcePanel {...r}>
        {r.data?.schedules.map((e) => (
          <Card key={e.id} withBorder mb="md">
            <Stack>
              <Group justify="space-between">
                <Text fw={600}>{e.name || e.cron_expr}</Text>
                <Checkbox
                  label="Enabled"
                  checked={e.enabled}
                  disabled={a.busy}
                  onChange={(event) => {
                    const enabled = event.currentTarget.checked;
                    void a.run(async () => {
                      await api.updateSchedule(e.id, { enabled });
                      r.reload();
                    });
                  }}
                />
              </Group>
              <Text>Task: {e.skill_ref || e.playbook_id}</Text>
              <Text size="sm">
                Cron (UTC): {e.cron_expr} · next:{" "}
                {e.next_run_at ? new Date(e.next_run_at).toLocaleString() : "—"} · last:{" "}
                {e.last_run_at ? new Date(e.last_run_at).toLocaleString() : "—"}
              </Text>
              <TextInput
                label="Edit cron expression"
                defaultValue={e.cron_expr}
                onBlur={(event) => {
                  const cron_expr = event.currentTarget.value;
                  if (cron_expr !== e.cron_expr)
                    void a.run(async () => {
                      await api.updateSchedule(e.id, { cron_expr });
                      r.reload();
                    });
                }}
              />
              <Group>
                {e.project_id && (
                  <Anchor component={Link} href={"/matters/" + e.project_id}>
                    View matter
                  </Anchor>
                )}
                <ConfirmButton
                  label="Delete schedule"
                  description="Stop future automatic executions. Existing runs and receipts are preserved."
                  onConfirm={async () => {
                    await api.deleteSchedule(e.id);
                    r.reload();
                  }}
                />
              </Group>
            </Stack>
          </Card>
        ))}
        {r.data?.schedules.length === 0 && <Text>No schedules yet.</Text>}
        <PaginationPanel offset={offset} total={r.data?.total_count ?? 0} onChange={setOffset} />
      </ResourcePanel>
    </FeaturePanel>
  );
};
