import {
  listAuditLog,
  type AuditLogEntry,
  type AuditLogFilters,
} from "@/features/admin/auditLogApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Button, Group, Select, Table, TextInput } from "@mantine/core";
import { useState } from "react";

const privilegeOptions = [
  { value: "true", label: "Privileged" },
  { value: "false", label: "Not privileged" },
];

const tierOptions = ["1", "2", "3", "4", "5"];

const auditColumns = ["Time", "Action", "User", "Resource", "Tier", "Privilege"];

export const AuditLogPage = () => {
  const [draft, setDraft] = useState<AuditLogFilters>({});
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [extra, setExtra] = useState<AuditLogEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const action = useAction();
  const resource = useResource(async () => {
    const page = await listAuditLog(filters);
    setExtra([]);
    setCursor(page.next_cursor);
    return page;
  }, [JSON.stringify(filters)]);
  const auditRows = [...(resource.data?.items || []), ...extra];
  return (
    <FeaturePanel title="Audit log">
      <Group
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ ...draft });
        }}
      >
        <TextInput
          label="Action"
          value={draft.action || ""}
          onChange={(e) => setDraft({ ...draft, action: e.currentTarget.value })}
        />
        <TextInput
          label="User ID"
          value={draft.user_id || ""}
          onChange={(e) => setDraft({ ...draft, user_id: e.currentTarget.value })}
        />
        <Select
          label="Privilege"
          clearable
          data={privilegeOptions}
          value={draft.privilege_marked == null ? null : String(draft.privilege_marked)}
          onChange={(v) =>
            setDraft({ ...draft, privilege_marked: v === null ? null : v === "true" })
          }
        />
        <Select
          label="Tier"
          clearable
          data={tierOptions}
          onChange={(v) =>
            setDraft({ ...draft, routed_inference_tier: v ? (Number(v) as 1) : null })
          }
        />
        <TextInput
          type="datetime-local"
          label="Since"
          onChange={(e) =>
            setDraft({
              ...draft,
              since: e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : null,
            })
          }
        />
        <TextInput
          type="datetime-local"
          label="Until"
          onChange={(e) =>
            setDraft({
              ...draft,
              until: e.currentTarget.value ? new Date(e.currentTarget.value).toISOString() : null,
            })
          }
        />
        <Button type="submit">Apply filters</Button>
      </Group>
      <ActionFeedback {...action} />
      <ResourcePanel {...resource}>
        <Table.ScrollContainer minWidth={700}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                {auditColumns.map((h) => (
                  <Table.Th key={h}>{h}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {auditRows.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{new Date(row.timestamp).toLocaleString()}</Table.Td>
                  <Table.Td>{row.action}</Table.Td>
                  <Table.Td>{row.user_id}</Table.Td>
                  <Table.Td>
                    {row.resource_type}/{row.resource_id}
                  </Table.Td>
                  <Table.Td>{row.routed_inference_tier}</Table.Td>
                  <Table.Td>{row.privilege_marked ? "Yes" : "No"}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {cursor && (
          <Button
            loading={action.busy}
            onClick={() =>
              void action.run(async () => {
                const page = await listAuditLog({ ...filters, cursor });
                setExtra([...extra, ...page.items]);
                setCursor(page.next_cursor);
              })
            }
          >
            Load more
          </Button>
        )}
      </ResourcePanel>
    </FeaturePanel>
  );
};
