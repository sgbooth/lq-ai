import * as api from "@/features/autonomous/autonomousApi.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { MarkdownPanel } from "@/shared/MarkdownPanel.tsx";
import { PaginationPanel } from "@/shared/PaginationPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Anchor, Badge, Card, Group, Select, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { Link } from "wouter";

const proposalStatusOptions = ["proposed", "accepted", "rejected"];

export const AutonomousProposalsPage = () => {
  const [state, setState] = useState<string | null>("proposed");
  const [offset, setOffset] = useState(0);
  const r = useResource(
    () => api.listProposals((state as api.ProposalState) || undefined, undefined, 50, offset),
    [state, offset],
  );
  return (
    <FeaturePanel title="Matter context proposals">
      <Select
        label="State"
        value={state}
        data={proposalStatusOptions}
        clearable
        onChange={(v) => {
          setState(v);
          setOffset(0);
        }}
      />
      <ResourcePanel {...r}>
        {r.data?.proposals.map((p) => (
          <Card key={p.id} withBorder mb="md">
            <Stack>
              <Group>
                <Badge>{p.state}</Badge>
                <Anchor component={Link} href={"/matters/" + p.project_id}>
                  View matter
                </Anchor>
              </Group>
              <MarkdownPanel content={p.suggested_md} />
              {p.state === "proposed" && (
                <Group>
                  <ConfirmButton
                    color="teal"
                    label="Accept proposal"
                    description="Append this proposed text to the matter context. Future conversations will use it."
                    onConfirm={async () => {
                      await api.acceptProposal(p.id);
                      r.reload();
                    }}
                  />
                  <ConfirmButton
                    label="Reject proposal"
                    description="Reject this proposed context addition."
                    onConfirm={async () => {
                      await api.rejectProposal(p.id);
                      r.reload();
                    }}
                  />
                </Group>
              )}
            </Stack>
          </Card>
        ))}
        {r.data?.proposals.length === 0 && <Text>No proposals match this filter.</Text>}
        <PaginationPanel offset={offset} total={r.data?.total_count ?? 0} onChange={setOffset} />
      </ResourcePanel>
    </FeaturePanel>
  );
};
