import * as api from "@/features/autonomous/autonomousApi.ts";
import { useResource } from "@/hooks/useResource.ts";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { PaginationPanel } from "@/shared/PaginationPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Anchor, Button, Group, Table, Text } from "@mantine/core";
import { useState } from "react";
import { Link } from "wouter";

const autonomousLinks = [
  ["Matter intake", "matters"],
  ["Schedules", "schedules"],
  ["Watches", "watches"],
  ["Memory", "memory"],
  ["Precedents", "precedents"],
  ["Proposals", "proposals"],
  ["Notifications", "notifications"],
  ["Orchestration", "orchestration/chat"],
];

export const AutonomousPage = () => {
  const [offset, setOffset] = useState(0);
  const resource = useResource(() => api.listSessions(50, offset), [offset], 5000);
  return (
    <FeaturePanel
      title="Autonomous work"
      description="Review runs, control spending, and halt work at any time."
      actions={
        <Button component={Link} href="/autonomous/configure">
          Run now
        </Button>
      }
    >
      <Group>
        {autonomousLinks.map(([label, path]) => (
          <Button key={path} component={Link} href={"/autonomous/" + path} variant="light">
            {label}
          </Button>
        ))}
      </Group>
      <ResourcePanel {...resource}>
        <Table.ScrollContainer minWidth={600}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Run</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Phase</Table.Th>
                <Table.Th>Cost / cap</Table.Th>
                <Table.Th>Created</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {resource.data?.sessions.map((s) => (
                <Table.Tr key={s.id}>
                  <Table.Td>
                    <Anchor component={Link} href={"/autonomous/sessions/" + s.id}>
                      {s.trigger_kind} · {s.id.slice(0, 8)}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    {s.status} / {s.halt_state}
                  </Table.Td>
                  <Table.Td>{s.current_phase}</Table.Td>
                  <Table.Td>
                    ${s.cost_total_usd} / {s.max_cost_usd ? "$" + s.max_cost_usd : "default"}
                  </Table.Td>
                  <Table.Td>{new Date(s.created_at).toLocaleString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {resource.data?.sessions.length === 0 && <Text c="dimmed">No autonomous runs yet.</Text>}
        <PaginationPanel
          offset={offset}
          total={resource.data?.total_count ?? 0}
          onChange={setOffset}
        />
      </ResourcePanel>
    </FeaturePanel>
  );
};
