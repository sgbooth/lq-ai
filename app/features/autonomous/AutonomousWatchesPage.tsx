import * as api from "@/features/autonomous/autonomousApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { PaginationPanel } from "@/shared/PaginationPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Anchor, Button, Card, Checkbox, Group, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { Link } from "wouter";
export const AutonomousWatchesPage = () => {
  const [offset, setOffset] = useState(0);
  const r = useResource(() => api.listWatches(undefined, undefined, 50, offset), [offset]);
  const a = useAction();
  return (
    <FeaturePanel
      title="Watches"
      actions={
        <Button component={Link} href="/autonomous/watches/new">
          New watch
        </Button>
      }
    >
      <ActionFeedback {...a} />
      <ResourcePanel {...r}>
        {r.data?.watches.map((e) => (
          <Card key={e.id} withBorder mb="md">
            <Stack>
              <Group justify="space-between">
                <Text fw={600}>{e.knowledge_base_id}</Text>
                <Checkbox
                  label="Enabled"
                  checked={e.enabled}
                  disabled={a.busy}
                  onChange={(event) => {
                    const enabled = event.currentTarget.checked;
                    void a.run(async () => {
                      await api.updateWatch(e.id, { enabled });
                      r.reload();
                    });
                  }}
                />
              </Group>
              <Text>Task: {e.skill_ref || e.playbook_id}</Text>
              <Group>
                {e.project_id && (
                  <Anchor component={Link} href={"/matters/" + e.project_id}>
                    View matter
                  </Anchor>
                )}
                <ConfirmButton
                  label="Delete watch"
                  description="Stop future automatic executions. Existing runs and receipts are preserved."
                  onConfirm={async () => {
                    await api.deleteWatch(e.id);
                    r.reload();
                  }}
                />
              </Group>
            </Stack>
          </Card>
        ))}
        {r.data?.watches.length === 0 && <Text>No watches yet.</Text>}
        <PaginationPanel offset={offset} total={r.data?.total_count ?? 0} onChange={setOffset} />
      </ResourcePanel>
    </FeaturePanel>
  );
};
