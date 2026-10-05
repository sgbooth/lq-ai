import type { Alias, AliasFallback } from "@/features/admin/adminApi.ts";
import * as api from "@/features/admin/adminApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { listModels } from "@/shared/modelsApi.ts";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Button, Card, Group, Modal, Select, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
export const ModelsPage = () => {
  const resource = useResource(async () => ({
    aliases: await api.listAliases(),
    config: await api.getAdminConfig(),
    models: await listModels(),
  }));
  const action = useAction();
  const [editing, setEditing] = useState<Alias | "new" | null>(null);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const [fallback, setFallback] = useState<AliasFallback[]>([]);
  function edit(row: Alias | "new") {
    setEditing(row);
    setName(row === "new" ? "" : row.name);
    setProvider(row === "new" ? null : row.provider);
    setModel(row === "new" ? "" : row.model);
    setFallback(row === "new" ? [] : row.fallback);
  }
  return (
    <FeaturePanel
      title="Model aliases"
      actions={<Button onClick={() => edit("new")}>New alias</Button>}
    >
      <ResourcePanel {...resource}>
        <Stack>
          {resource.data?.aliases.data.map((row) => (
            <Card withBorder key={row.name}>
              <Group justify="space-between">
                <Stack gap={4}>
                  <Text fw={600}>{row.name}</Text>
                  <Text>
                    {row.provider}/{row.model}
                  </Text>
                  <Text size="xs">
                    Fallbacks:{" "}
                    {row.fallback.map((f) => `${f.provider}/${f.model}`).join(", ") || "none"}
                  </Text>
                </Stack>
                <Group>
                  <Button onClick={() => edit(row)}>Edit</Button>
                  <ConfirmButton
                    label="Delete"
                    description={`Delete alias ${row.name}?`}
                    onConfirm={async () => {
                      await api.deleteAlias(row.name);
                      resource.reload();
                    }}
                  />
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      </ResourcePanel>
      <Modal opened={!!editing} onClose={() => setEditing(null)} title="Model alias" size="lg">
        <Stack
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              const body = { provider: provider!, model, fallback };
              if (editing === "new") await api.createAlias({ name, ...body });
              else if (editing) await api.updateAlias(editing.name, body);
              setEditing(null);
              resource.reload();
            });
          }}
        >
          <TextInput
            label="Alias"
            required
            disabled={editing !== "new"}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Select
            label="Provider"
            required
            data={
              resource.data?.config.providers
                .filter((p) => p.enabled !== false)
                .map((p) => p.name) || []
            }
            value={provider}
            onChange={setProvider}
          />
          <TextInput
            label="Model"
            required
            value={model}
            onChange={(e) => setModel(e.currentTarget.value)}
            list="available-models"
          />
          <datalist id="available-models">
            {resource.data?.models.data
              .filter((m) => m.owned_by === provider)
              .map((m) => (
                <option key={m.id} value={m.id.replace(provider + "/", "")} />
              ))}
          </datalist>
          <Text fw={600}>Ordered fallbacks</Text>
          {fallback.map((f, i) => (
            <Group key={i}>
              <TextInput
                label="Provider"
                value={f.provider}
                onChange={(e) =>
                  setFallback(
                    fallback.map((x, j) =>
                      j === i ? { ...x, provider: e.currentTarget.value } : x,
                    ),
                  )
                }
              />
              <TextInput
                label="Model"
                value={f.model}
                onChange={(e) =>
                  setFallback(
                    fallback.map((x, j) => (j === i ? { ...x, model: e.currentTarget.value } : x)),
                  )
                }
              />
              <Button color="red" onClick={() => setFallback(fallback.filter((_, j) => j !== i))}>
                Remove
              </Button>
            </Group>
          ))}
          <Button
            variant="light"
            onClick={() => setFallback([...fallback, { provider: "", model: "" }])}
          >
            Add fallback
          </Button>
          <ActionFeedback {...action} />
          <Button type="submit" loading={action.busy}>
            Save alias
          </Button>
        </Stack>
      </Modal>
    </FeaturePanel>
  );
};
