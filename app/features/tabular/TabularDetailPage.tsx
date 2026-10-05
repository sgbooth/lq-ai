import * as api from "@/features/tabular/tabularApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { download } from "@/shared/download.ts";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { StatusBadge } from "@/shared/StatusBadge.tsx";
import type { TabularCellResult } from "@/shared/types.ts";
import { Alert, Button, Group, Modal, Stack, Table, Text, UnstyledButton } from "@mantine/core";
import type React from "react";
import { useState } from "react";

const exportFormats = ["csv", "xlsx"];

const activeExecutionStatuses = ["pending", "running"];

interface Props {
  id: string;
}
export const TabularDetailPage: React.FC<Props> = ({ id }) => {
  const [terminal, setTerminal] = useState(false);
  const resource = useResource(
    async () => {
      const row = await api.getTabularExecution(id);
      if (!activeExecutionStatuses.includes(row.status)) setTerminal(true);
      return row;
    },
    [id],
    terminal ? undefined : 3000,
  );
  const [cell, setCell] = useState<TabularCellResult | null>(null);
  const action = useAction();
  const row = resource.data;
  return (
    <FeaturePanel
      title="Tabular results"
      actions={
        <Group>
          {exportFormats.map((format) => (
            <Button
              key={format}
              variant="light"
              loading={action.busy}
              onClick={() =>
                void action.run(async () => {
                  const file = await api.exportTabularExecution(id, format as "csv" | "xlsx");
                  download(file.blob, file.filename);
                })
              }
            >
              Export {format.toUpperCase()}
            </Button>
          ))}
          {row && activeExecutionStatuses.includes(row.status) && (
            <ConfirmButton
              label="Cancel review"
              description="Cancel remaining cells? Completed cells are retained."
              onConfirm={async () => {
                await api.cancelTabularExecution(id);
                resource.reload();
              }}
            />
          )}
        </Group>
      }
    >
      <ActionFeedback {...action} />
      <ResourcePanel {...resource}>
        {row && (
          <Stack>
            <Group>
              <StatusBadge status={row.status} />
              <Text>
                Estimated ${row.cost_estimate_usd || "—"} · Actual ${row.cost_actual_usd || "—"}
              </Text>
            </Group>
            {row.error_text && <Alert color="red">{row.error_text}</Alert>}
            <Table.ScrollContainer minWidth={700}>
              <Table withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Document</Table.Th>
                    {row.columns.map((c) => (
                      <Table.Th key={c.name}>{c.name}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {row.document_ids.map((doc, i) => {
                    const result = row.results?.rows.find((r) => r.document_id === doc);
                    return (
                      <Table.Tr key={doc}>
                        <Table.Td>{row.document_names[i] || result?.document_name || doc}</Table.Td>
                        {row.columns.map((c) => {
                          const value = result?.cells[c.name];
                          return (
                            <Table.Td key={c.name}>
                              {value ? (
                                <UnstyledButton onClick={() => setCell(value)}>
                                  <Stack gap={4}>
                                    <Text size="sm">{value.value || value.error || "—"}</Text>
                                    <StatusBadge status={value.confidence} />
                                  </Stack>
                                </UnstyledButton>
                              ) : (
                                <Text c="dimmed">Pending</Text>
                              )}
                            </Table.Td>
                          );
                        })}
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>
        )}
      </ResourcePanel>
      <Modal opened={!!cell} onClose={() => setCell(null)} title="Cell provenance">
        <Stack>
          <Text>{cell?.value}</Text>
          {cell?.error && <Alert color="red">{cell.error}</Alert>}
          {cell && <StatusBadge status={cell.confidence} />}
          <Text>
            Tier {cell?.tier_used || "—"} · ${cell?.cost_usd || "—"}
          </Text>
          {cell?.citations.map((c) => (
            <Text key={c.citation_id}>
              Citation {c.citation_id} · Document {c.document_id} · {c.confidence}
            </Text>
          ))}
        </Stack>
      </Modal>
    </FeaturePanel>
  );
};
