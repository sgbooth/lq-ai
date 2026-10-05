import { PlaybookCostPanel } from "@/features/playbooks/PlaybookCostPanel.tsx";
import { listProjects } from "@/features/matters/mattersApi.ts";
import * as api from "@/features/playbooks/playbooksApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { PlaybookDisclaimerPanel } from "@/shared/PlaybookDisclaimerPanel.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { pollFileStatus, uploadFile } from "@/shared/filesApi.ts";
import { PlaybookEditorPanel } from "@/shared/PlaybookEditorPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import type { FileMeta, Playbook } from "@/shared/types.ts";
import { Button, Card, FileButton, Group, Modal, Select, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { Link, useLocation } from "wouter";
export const PlaybooksPage = () => {
  const resource = useResource(() => api.listPlaybooks());
  const projects = useResource(() => listProjects());
  const action = useAction();
  const [editing, setEditing] = useState<Playbook | "new" | null>(null);
  const [running, setRunning] = useState<Playbook | null>(null);
  const [file, setFile] = useState<FileMeta | null>(null);
  const [project, setProject] = useState<string | null>(null);
  const [, navigate] = useLocation();
  return (
    <FeaturePanel
      title="Playbooks"
      actions={
        <Group>
          <Button component={Link} href="/playbooks/easy" variant="light">
            Generate from contracts
          </Button>
          <Button onClick={() => setEditing("new")}>New playbook</Button>
        </Group>
      }
    >
      <PlaybookDisclaimerPanel />
      <ActionFeedback {...action} />
      <ResourcePanel {...resource}>
        <Stack>
          {resource.data?.map((p) => (
            <Card key={p.id} withBorder>
              <Stack>
                <Text fw={600}>{p.name}</Text>
                <Text>{p.description}</Text>
                <Text size="sm">
                  {p.contract_type} · {p.positions.length} positions · v{p.version}
                </Text>
                <Group>
                  <Button
                    onClick={() => {
                      setRunning(p);
                      setFile(null);
                    }}
                  >
                    Review document
                  </Button>
                  <Button variant="light" onClick={() => setEditing(p)}>
                    View / edit
                  </Button>
                  <ConfirmButton
                    label="Delete"
                    description={`Delete ${p.name}?`}
                    onConfirm={async () => {
                      await api.deletePlaybook(p.id);
                      resource.reload();
                    }}
                  />
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      </ResourcePanel>
      <Modal opened={!!editing} onClose={() => setEditing(null)} size="xl" title="Playbook">
        {editing && (
          <PlaybookEditorPanel
            key={editing === "new" ? "new" : editing.id}
            initial={editing === "new" ? { name: "", contract_type: "", positions: [] } : editing}
            busy={action.busy}
            onSave={(draft) =>
              action.run(async () => {
                if (editing === "new") await api.createPlaybook(draft);
                else await api.updatePlaybook(editing.id, draft);
                setEditing(null);
                resource.reload();
              })
            }
          />
        )}
        <ActionFeedback {...action} />
      </Modal>
      <Modal opened={!!running} onClose={() => setRunning(null)} title="Review document">
        <Stack>
          <PlaybookDisclaimerPanel />
          {running && <PlaybookCostPanel positionCount={running.positions.length} />}
          <FileButton
            onChange={(f) => {
              if (f)
                void action.run(async () => {
                  const uploaded = await uploadFile(f);
                  const result = await pollFileStatus(uploaded.id, {
                    until: (x) => !!x.document_id || x.ingestion_status === "failed",
                  });
                  if (!result.file?.document_id)
                    throw new Error("Document processing did not complete.");
                  setFile(result.file);
                });
            }}
          >
            {(props) => (
              <Button {...props} loading={action.busy}>
                Upload document
              </Button>
            )}
          </FileButton>
          <Text>{file?.filename}</Text>
          <Select
            label="Matter"
            clearable
            value={project}
            onChange={setProject}
            data={projects.data?.map((p) => ({ value: p.id, label: p.name })) || []}
          />
          <ActionFeedback {...action} />
          <Button
            disabled={!file?.document_id || !running}
            loading={action.busy}
            onClick={() =>
              void action.run(async () => {
                const execution = await api.executePlaybook(running!.id, {
                  target_document_id: file!.document_id!,
                  project_id: project,
                });
                navigate(`/playbook-executions/${execution.id}`);
              })
            }
          >
            Run review
          </Button>
        </Stack>
      </Modal>
    </FeaturePanel>
  );
};
