import * as api from "@/features/knowledge/knowledgeApi.ts";
import { listProjects } from "@/features/matters/mattersApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import {
  Button,
  Card,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useState } from "react";
import { Link, useLocation } from "wouter";
export const KnowledgePage = () => {
  const [archived, setArchived] = useState(false);
  const resource = useResource(() => api.listKnowledgeBases({ archived }), [archived]);
  const projects = useResource(() => listProjects());
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState<string | null>(null);
  const [alpha, setAlpha] = useState<number | string>(0.5);
  const [, navigate] = useLocation();
  const action = useAction();
  return (
    <FeaturePanel
      title="Knowledge"
      actions={
        <Group>
          <Checkbox
            label="Archived knowledge bases"
            checked={archived}
            onChange={(e) => setArchived(e.currentTarget.checked)}
          />
          <Button onClick={() => setOpened(true)}>New knowledge base</Button>
        </Group>
      }
    >
      <ResourcePanel {...resource}>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {resource.data?.map((kb) => (
            <Card withBorder key={kb.id}>
              <Stack>
                <Text component={Link} href={`/knowledge/${kb.id}`} fw={600}>
                  {kb.name}
                </Text>
                <Text c="dimmed">{kb.description}</Text>
                <Text size="sm">
                  {kb.file_count} files · {kb.chunk_count} chunks
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
        {resource.data?.length === 0 && <Text>No knowledge bases yet.</Text>}
      </ResourcePanel>
      <Modal opened={opened} onClose={() => setOpened(false)} title="New knowledge base">
        <Stack
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              const kb = await api.createKnowledgeBase({
                name,
                description,
                project_id: project,
                hybrid_alpha: Number(alpha),
              });
              navigate(`/knowledge/${kb.id}`);
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
          <Select
            label="Matter"
            clearable
            data={(projects.data || []).map((p) => ({ value: p.id, label: p.name }))}
            value={project}
            onChange={setProject}
          />
          <NumberInput
            label="Hybrid retrieval weight"
            description="0 favors keyword search; 1 favors vector search."
            min={0}
            max={1}
            step={0.1}
            value={alpha}
            onChange={setAlpha}
          />
          <ActionFeedback error={action.error} />
          <Button type="submit" loading={action.busy}>
            Create
          </Button>
        </Stack>
      </Modal>
    </FeaturePanel>
  );
};
