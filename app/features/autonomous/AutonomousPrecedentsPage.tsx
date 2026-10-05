import * as api from "@/features/autonomous/autonomousApi.ts";
import { listProjects } from "@/features/matters/mattersApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { MarkdownPanel } from "@/shared/MarkdownPanel.tsx";
import { PaginationPanel } from "@/shared/PaginationPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Anchor, Badge, Button, Card, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { Link } from "wouter";
export const AutonomousPrecedentsPage = () => {
  const [kind, setKind] = useState("");
  const [offset, setOffset] = useState(0);
  const [projects, setProjects] = useState<Record<string, string>>({});
  const r = useResource(
    async () => ({
      board: await api.listPrecedents(kind || undefined, 50, offset),
      projects: await listProjects(),
    }),
    [kind, offset],
  );
  const a = useAction();
  return (
    <FeaturePanel
      title="Precedents"
      description="Promoting a precedent creates a proposal for your review; accepting that proposal updates the matter context."
    >
      <TextInput
        label="Pattern filter"
        value={kind}
        onChange={(e) => {
          setKind(e.currentTarget.value);
          setOffset(0);
        }}
      />
      <ActionFeedback {...a} />
      <ResourcePanel {...r}>
        {r.data?.board.entries.map((e) => (
          <Card key={e.id} withBorder mb="md">
            <Stack>
              <Group>
                <Badge>{e.pattern_kind}</Badge>
                <Text size="sm">Observed {e.observed_count} times</Text>
              </Group>
              <MarkdownPanel content={e.summary} />
              <Select
                label="Target matter"
                searchable
                data={r.data?.projects.map((p) => ({ value: p.id, label: p.name })) ?? []}
                value={projects[e.id] ?? null}
                onChange={(v) => setProjects({ ...projects, [e.id]: v ?? "" })}
              />
              <Group>
                <Button
                  disabled={!projects[e.id]}
                  loading={a.busy}
                  onClick={() =>
                    void a.run(async () => {
                      await api.promotePrecedent(e.id, projects[e.id]);
                    }, "Proposal created. Review it in Proposals.")
                  }
                >
                  Propose matter context
                </Button>
                <ConfirmButton
                  label="Dismiss precedent"
                  description="Remove this precedent from the board."
                  onConfirm={async () => {
                    await api.dismissPrecedent(e.id);
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
        <PaginationPanel
          offset={offset}
          total={r.data?.board.total_count ?? 0}
          onChange={setOffset}
        />
      </ResourcePanel>
    </FeaturePanel>
  );
};
