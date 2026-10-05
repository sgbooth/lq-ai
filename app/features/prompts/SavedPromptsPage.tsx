import * as api from "@/features/prompts/promptsApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { download } from "@/shared/download.ts";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import type { SavedPrompt } from "@/shared/types.ts";
import { Button, Card, Group, Modal, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { useState } from "react";
import { useLocation } from "wouter";
export const SavedPromptsPage = () => {
  const resource = useResource(() => api.listSavedPrompts());
  const action = useAction();
  const [editing, setEditing] = useState<SavedPrompt | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [, navigate] = useLocation();
  const edit = (row: SavedPrompt | "new") => {
    setEditing(row);
    setTitle(row === "new" ? "" : row.name);
    setContent(row === "new" ? "" : row.prompt_text);
    setTags(row === "new" ? "" : row.tags.join(", "));
  };
  return (
    <FeaturePanel
      title="Saved prompts"
      actions={<Button onClick={() => edit("new")}>New prompt</Button>}
    >
      <ResourcePanel {...resource}>
        <Stack>
          {resource.data?.map((row) => (
            <Card withBorder key={row.id}>
              <Stack>
                <Text fw={600}>{row.name}</Text>
                <Text lineClamp={3}>{row.prompt_text}</Text>
                <Group>
                  <Button
                    onClick={() => {
                      sessionStorage.setItem("lq-ai:composer-prefill", row.prompt_text);
                      navigate("/chats");
                    }}
                    size="xs"
                  >
                    Use in chat
                  </Button>
                  <Button variant="light" size="xs" onClick={() => edit(row)}>
                    Edit
                  </Button>
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() => {
                      sessionStorage.setItem(
                        `lq-ai:capture-stash:prompt-${row.id}`,
                        JSON.stringify({
                          display_name: row.name,
                          body: row.prompt_text,
                          tags: row.tags.join(", "),
                        }),
                      );
                      navigate(`/skills/new?capture=prompt-${row.id}`);
                    }}
                  >
                    Create skill
                  </Button>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() =>
                      download(
                        new Blob([row.prompt_text], { type: "text/plain" }),
                        row.name + ".txt",
                      )
                    }
                  >
                    Export
                  </Button>
                  <ConfirmButton
                    label="Delete"
                    description={`Delete ${row.name}?`}
                    onConfirm={async () => {
                      await api.deleteSavedPrompt(row.id);
                      resource.reload();
                    }}
                  />
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
        {resource.data?.length === 0 && <Text>No saved prompts yet.</Text>}
      </ResourcePanel>
      <Modal opened={!!editing} onClose={() => setEditing(null)} title="Saved prompt">
        <Stack
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              if (editing === "new")
                await api.createSavedPrompt({
                  name: title,
                  prompt_text: content,
                  tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                });
              else if (editing)
                await api.updateSavedPrompt(editing.id, {
                  name: title,
                  prompt_text: content,
                  tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                });
              setEditing(null);
              resource.reload();
            });
          }}
        >
          <TextInput
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
          <Textarea
            label="Prompt"
            required
            autosize
            minRows={6}
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
          />
          <TextInput
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.currentTarget.value)}
          />
          <ActionFeedback error={action.error} />
          <Button type="submit" loading={action.busy}>
            Save
          </Button>
        </Stack>
      </Modal>
    </FeaturePanel>
  );
};
