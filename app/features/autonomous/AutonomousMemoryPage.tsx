import * as api from "@/features/autonomous/autonomousApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { PaginationPanel } from "@/shared/PaginationPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Anchor, Badge, Button, Card, Group, Select, Stack, Text, Textarea } from "@mantine/core";
import { useState } from "react";
import { Link } from "wouter";

const memoryStatusOptions = ["proposed", "kept", "dismissed"];

export const AutonomousMemoryPage = () => {
  const [state, setState] = useState<string | null>("proposed");
  const [offset, setOffset] = useState(0);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const r = useResource(
    () => api.listMemory((state as api.MemoryState) || undefined, 50, offset),
    [state, offset],
  );
  const a = useAction();
  return (
    <FeaturePanel
      title="Memory"
      description="Review and edit proposed memories before keeping them."
    >
      <Select
        label="State"
        value={state}
        data={memoryStatusOptions}
        clearable
        onChange={(v) => {
          setState(v);
          setOffset(0);
        }}
      />
      <ActionFeedback {...a} />
      <ResourcePanel {...r}>
        {r.data?.entries.map((e) => (
          <Card key={e.id} withBorder mb="md">
            <Stack>
              <Group justify="space-between">
                <Text fw={600}>{e.category}</Text>
                <Badge>{e.state}</Badge>
              </Group>
              <Textarea
                label="Memory content"
                autosize
                minRows={3}
                value={edits[e.id] ?? e.content}
                onChange={(event) => setEdits({ ...edits, [e.id]: event.currentTarget.value })}
              />
              <Group>
                <Button
                  loading={a.busy}
                  onClick={() =>
                    void a.run(async () => {
                      await api.keepMemory(e.id, edits[e.id] ?? e.content);
                      r.reload();
                    })
                  }
                >
                  Keep
                </Button>
                {e.state === "proposed" && (
                  <Button
                    variant="light"
                    disabled={a.busy}
                    onClick={() =>
                      void a.run(async () => {
                        await api.dismissMemory(e.id);
                        r.reload();
                      })
                    }
                  >
                    Dismiss
                  </Button>
                )}
                <ConfirmButton
                  label="Delete memory"
                  description="Remove this memory from future autonomous context."
                  onConfirm={async () => {
                    await api.deleteMemory(e.id);
                    r.reload();
                  }}
                />
                {e.source_session_id && (
                  <Anchor component={Link} href={"/autonomous/sessions/" + e.source_session_id}>
                    Source receipt
                  </Anchor>
                )}
              </Group>
            </Stack>
          </Card>
        ))}
        {r.data?.entries.length === 0 && <Text>No memories match this filter.</Text>}
        <PaginationPanel offset={offset} total={r.data?.total_count ?? 0} onChange={setOffset} />
      </ResourcePanel>
    </FeaturePanel>
  );
};
