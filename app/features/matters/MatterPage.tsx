import { listKnowledgeBases } from "@/features/knowledge/knowledgeApi.ts";
import * as knowledgeLinks from "@/features/matters/matterKnowledgeApi.ts";
import * as api from "@/features/matters/mattersApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ChatPanel } from "@/shared/chat/ChatPanel.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { getFile, uploadFile } from "@/shared/filesApi.ts";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { listSkills } from "@/shared/skillsApi.ts";
import {
  Button,
  Checkbox,
  FileButton,
  Group,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import type React from "react";
import { useState } from "react";
import { useLocation } from "wouter";

const tierOptions = ["1", "2", "3", "4", "5"];

interface Props {
  id: string;
}
export const MatterPage: React.FC<Props> = ({ id }) => {
  const [, navigate] = useLocation();
  const resource = useResource(() => api.getProject(id), [id]);
  const choices = useResource(async () => ({
    skills: await listSkills(),
    kbs: await listKnowledgeBases(),
  }));
  const action = useAction();
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState(false);
  const [privileged, setPrivileged] = useState(false);
  const [tier, setTier] = useState("1");
  const [kb, setKb] = useState<string | null>(null);
  const [skill, setSkill] = useState<string | null>(null);
  const files = useResource(
    () => Promise.all((resource.data?.attached_file_ids || []).map((id) => getFile(id))),
    [resource.data?.attached_file_ids?.join(",")],
  );
  return (
    <FeaturePanel title={resource.data?.name || "Matter"}>
      <ResourcePanel {...resource}>
        {resource.data && (
          <Tabs defaultValue="chat">
            <Tabs.List>
              <Tabs.Tab value="chat">Chat</Tabs.Tab>
              <Tabs.Tab value="details">Details</Tabs.Tab>
              <Tabs.Tab value="attachments">Files, skills & knowledge</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="chat" pt="lg">
              <ChatPanel projectId={id} />
            </Tabs.Panel>
            <Tabs.Panel value="details" pt="lg">
              <Stack>
                {!editing ? (
                  <>
                    <Text>{resource.data.description}</Text>
                    <Text>{resource.data.context_md}</Text>
                    <Text>
                      Privileged: {resource.data.privileged ? "Yes" : "No"} · Minimum tier{" "}
                      {resource.data.minimum_inference_tier || 1}
                    </Text>
                    <Button
                      onClick={() => {
                        setName(resource.data!.name);
                        setDescription(resource.data!.description || "");
                        setContext(resource.data!.context_md || "");
                        setPrivileged(resource.data!.privileged);
                        setTier(String(resource.data!.minimum_inference_tier || 1));
                        setEditing(true);
                      }}
                    >
                      Edit matter
                    </Button>
                  </>
                ) : (
                  <Stack
                    component="form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void action.run(async () => {
                        await api.patchProject(id, {
                          name,
                          description,
                          context_md: context,
                          privileged,
                          minimum_inference_tier: Number(tier) as 1,
                        });
                        setEditing(false);
                        resource.reload();
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
                    <Textarea
                      label="Matter context"
                      minRows={6}
                      autosize
                      value={context}
                      onChange={(e) => setContext(e.currentTarget.value)}
                    />
                    <Checkbox
                      label="Privileged"
                      checked={privileged}
                      onChange={(e) => setPrivileged(e.currentTarget.checked)}
                    />
                    <Select
                      label="Minimum inference tier"
                      data={tierOptions}
                      value={tier}
                      onChange={(v) => setTier(v || "1")}
                    />
                    <Button type="submit" loading={action.busy}>
                      Save
                    </Button>
                  </Stack>
                )}
                <ConfirmButton
                  label="Archive matter"
                  description="Archive this matter? Its history will be retained."
                  onConfirm={async () => {
                    await api.archiveProject(id);
                    navigate("/matters");
                  }}
                />
                <ActionFeedback {...action} />
              </Stack>
            </Tabs.Panel>
            <Tabs.Panel value="attachments" pt="lg">
              <Stack>
                <Text fw={600}>Files</Text>
                {files.data?.map((file) => (
                  <Group key={file.id}>
                    <Text>{file.filename}</Text>
                    <ConfirmButton
                      label="Detach"
                      description="Detach this file?"
                      onConfirm={async () => {
                        await api.detachFile(id, file.id);
                        resource.reload();
                      }}
                    />
                  </Group>
                ))}
                <FileButton
                  multiple
                  onChange={(incoming) =>
                    void action.run(async () => {
                      for (const file of incoming) {
                        const uploaded = await uploadFile(file, { project_id: id });
                        await api.attachFile(id, uploaded.id);
                      }
                      resource.reload();
                    })
                  }
                >
                  {(props) => (
                    <Button {...props} loading={action.busy}>
                      Upload file
                    </Button>
                  )}
                </FileButton>
                <Text fw={600}>Skills</Text>
                {resource.data.attached_skill_names?.map((name) => (
                  <Group key={name}>
                    <Text>{name}</Text>
                    <ConfirmButton
                      label="Detach"
                      description="Detach this skill?"
                      onConfirm={async () => {
                        await api.detachSkill(id, name);
                        resource.reload();
                      }}
                    />
                  </Group>
                ))}
                <Group>
                  <Select
                    label="Skill"
                    searchable
                    data={
                      choices.data?.skills.map((s) => ({
                        value: s.name,
                        label: s.title || s.name,
                      })) || []
                    }
                    value={skill}
                    onChange={setSkill}
                  />
                  <Button
                    disabled={!skill}
                    onClick={() =>
                      void action.run(async () => {
                        await api.attachSkill(id, skill!);
                        resource.reload();
                      })
                    }
                  >
                    Attach skill
                  </Button>
                </Group>
                <Text fw={600}>Knowledge bases</Text>
                {resource.data.attached_knowledge_base_ids?.map((k) => (
                  <Group key={k}>
                    <Text>{choices.data?.kbs.find((x) => x.id === k)?.name || k}</Text>
                    <ConfirmButton
                      label="Detach"
                      description="Detach this knowledge base?"
                      onConfirm={async () => {
                        await knowledgeLinks.detachKnowledgeBase(id, k);
                        resource.reload();
                      }}
                    />
                  </Group>
                ))}
                <Group>
                  <Select
                    label="Knowledge base"
                    data={choices.data?.kbs.map((k) => ({ value: k.id, label: k.name })) || []}
                    value={kb}
                    onChange={setKb}
                  />
                  <Button
                    disabled={!kb}
                    onClick={() =>
                      void action.run(async () => {
                        await knowledgeLinks.attachKnowledgeBase(id, kb!);
                        resource.reload();
                      })
                    }
                  >
                    Attach knowledge base
                  </Button>
                </Group>
                <ActionFeedback {...action} />
              </Stack>
            </Tabs.Panel>
          </Tabs>
        )}
      </ResourcePanel>
    </FeaturePanel>
  );
};
