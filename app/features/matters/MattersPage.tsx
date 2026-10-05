import * as api from "@/features/matters/mattersApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { Icon } from "@/shared/Icon.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const tierOptions = ["1", "2", "3", "4", "5"];

export const MattersPage = () => {
  const [archived, setArchived] = useState(false);
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privileged, setPrivileged] = useState(false);
  const [tier, setTier] = useState("1");
  const [, navigate] = useLocation();
  const action = useAction();
  const resource = useResource(() => api.listProjects({ archived }), [archived]);
  return (
    <FeaturePanel
      title="Matters"
      actions={
        <Group>
          <Checkbox
            label="Show archived"
            checked={archived}
            onChange={(e) => setArchived(e.currentTarget.checked)}
          />
          <Button leftSection={<Icon.Add />} onClick={() => setOpened(true)}>
            New matter
          </Button>
        </Group>
      }
    >
      <ResourcePanel {...resource}>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {resource.data?.map((matter) => (
            <Card withBorder key={matter.id}>
              <Stack>
                <Group justify="space-between">
                  <Text component={Link} href={`/matters/${matter.id}`} fw={600}>
                    {matter.name}
                  </Text>
                  {matter.privileged && <Badge>Privileged</Badge>}
                </Group>
                <Text c="dimmed" size="sm">
                  {matter.description || "No description"}
                </Text>
                <Text size="xs">Updated {new Date(matter.updated_at).toLocaleString()}</Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
        {resource.data?.length === 0 && <Text c="dimmed">No matters yet.</Text>}
      </ResourcePanel>
      <Modal opened={opened} onClose={() => setOpened(false)} title="New matter">
        <Stack
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              const matter = await api.createProject({
                name,
                description,
                privileged,
                minimum_inference_tier: Number(tier) as 1,
              });
              navigate(`/matters/${matter.id}`);
            });
          }}
        >
          <TextInput
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
          <Checkbox
            label="Privileged matter"
            checked={privileged}
            onChange={(e) => setPrivileged(e.currentTarget.checked)}
          />
          <Select
            label="Minimum inference tier"
            data={tierOptions}
            value={tier}
            onChange={(v) => setTier(v || "1")}
          />
          <ActionFeedback error={action.error} />
          <Button type="submit" loading={action.busy}>
            Create matter
          </Button>
        </Stack>
      </Modal>
    </FeaturePanel>
  );
};
