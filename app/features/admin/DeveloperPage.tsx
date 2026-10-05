import { DeveloperReferencePanel } from "@/features/admin/DeveloperReferencePanel.tsx";
import { getUsage, listUsers, patchUserRole } from "@/features/admin/adminApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { PaginationPanel } from "@/shared/PaginationPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Card, Select, Stack, Table, Text, TextInput } from "@mantine/core";
import { useState } from "react";

const roleOptions = ["admin", "member", "viewer"];

export const DeveloperPage = () => {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const resource = useResource(() => listUsers({ email_q: search, offset }), [search, offset]);
  const usage = useResource(() => getUsage());
  const action = useAction();
  return (
    <FeaturePanel title="Developer & administration">
      <DeveloperReferencePanel />
      <TextInput
        label="Find user"
        value={search}
        onChange={(e) => {
          setSearch(e.currentTarget.value);
          setOffset(0);
        }}
      />
      <ActionFeedback {...action} />
      <ResourcePanel {...resource}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>MFA</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {resource.data?.users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>{user.email}</Table.Td>
                <Table.Td>
                  <Select
                    aria-label={`Role for ${user.email}`}
                    value={user.role}
                    data={roleOptions}
                    disabled={action.busy}
                    onChange={(v) =>
                      void action.run(async () => {
                        await patchUserRole(user.id, v as "admin" | "member" | "viewer");
                        resource.reload();
                      })
                    }
                  />
                </Table.Td>
                <Table.Td>{user.mfa_enabled ? "Yes" : "No"}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <PaginationPanel
          offset={offset}
          total={resource.data?.total_count ?? 0}
          onChange={setOffset}
        />
      </ResourcePanel>
      <Card withBorder>
        <Text fw={600}>Usage</Text>
        <ResourcePanel {...usage}>
          <Stack>
            <Text>
              {usage.data?.total_request_count} requests · {usage.data?.total_tokens_in} input
              tokens · {usage.data?.total_tokens_out} output tokens · $
              {usage.data?.total_cost_estimate.toFixed(4)}
            </Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Group</Table.Th>
                  <Table.Th>Requests</Table.Th>
                  <Table.Th>Input / output tokens</Table.Th>
                  <Table.Th>Cost</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {usage.data?.rows.map((row) => (
                  <Table.Tr key={row.group_key}>
                    <Table.Td>{row.group_key}</Table.Td>
                    <Table.Td>{row.request_count}</Table.Td>
                    <Table.Td>
                      {row.tokens_in_sum} / {row.tokens_out_sum}
                    </Table.Td>
                    <Table.Td>${row.cost_estimate_sum.toFixed(4)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </ResourcePanel>
      </Card>
    </FeaturePanel>
  );
};
