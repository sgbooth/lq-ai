import * as api from "@/features/tabular/tabularApi.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { StatusBadge } from "@/shared/StatusBadge.tsx";
import { Button, Table, Text } from "@mantine/core";
import { Link } from "wouter";

const reviewColumns = ["Review", "Status", "Documents", "Columns", "Cost", "Actions"];

export const TabularPage = () => {
  const resource = useResource(() => api.listTabularExecutions());
  return (
    <FeaturePanel
      title="Tabular review"
      actions={
        <Button component={Link} href="/tabular/new">
          New review
        </Button>
      }
    >
      <ResourcePanel {...resource}>
        <Table.ScrollContainer minWidth={600}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                {reviewColumns.map((h) => (
                  <Table.Th key={h}>{h}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {resource.data?.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Text component={Link} href={`/tabular/${row.id}`}>
                      {row.skill_name || "Ad hoc review"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge status={row.status} />
                  </Table.Td>
                  <Table.Td>{row.document_count}</Table.Td>
                  <Table.Td>{row.column_count}</Table.Td>
                  <Table.Td>${row.cost_actual_usd || row.cost_estimate_usd || "—"}</Table.Td>
                  <Table.Td>
                    <ConfirmButton
                      label="Delete"
                      description="Delete this review?"
                      onConfirm={async () => {
                        await api.deleteTabularExecution(row.id);
                        resource.reload();
                      }}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </ResourcePanel>
    </FeaturePanel>
  );
};
