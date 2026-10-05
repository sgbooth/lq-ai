import * as api from "@/features/playbooks/playbooksApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { PlaybookDisclaimerPanel } from "@/shared/PlaybookDisclaimerPanel.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { pollFileStatus, uploadFile } from "@/shared/filesApi.ts";
import { PlaybookEditorPanel } from "@/shared/PlaybookEditorPanel.tsx";
import type { FileMeta, PlaybookCreate } from "@/shared/types.ts";
import { Alert, Button, Checkbox, FileButton, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
export const EasyPlaybookPage = () => {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("");
  const [persist, setPersist] = useState(false);
  const [generation, setGeneration] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlaybookCreate | null>(null);
  const [, navigate] = useLocation();
  const action = useAction();
  const result = useResource(
    () => (generation ? api.getEasyPlaybookGeneration(generation) : Promise.resolve(null)),
    [generation],
    generation && !draft ? 3000 : undefined,
  );
  useEffect(() => {
    if (result.data?.draft_playbook) setDraft(result.data.draft_playbook);
  }, [result.data]);
  return (
    <FeaturePanel
      title="Generate a playbook"
      description="Extract a draft from representative contracts, then review and save it."
    >
      <Stack maw={900}>
        <PlaybookDisclaimerPanel />
        <TextInput
          label="Playbook name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <TextInput
          label="Contract type"
          required
          value={kind}
          onChange={(e) => setKind(e.currentTarget.value)}
        />
        <FileButton
          multiple
          onChange={(incoming) =>
            void action.run(async () => {
              for (const file of incoming) {
                const uploaded = await uploadFile(file);
                const result = await pollFileStatus(uploaded.id, {
                  until: (f) => !!f.document_id || f.ingestion_status === "failed",
                });
                if (!result.file?.document_id) throw new Error(`${file.name} is not ready.`);
                setFiles((previous) => [...previous, result.file!]);
              }
            })
          }
        >
          {(props) => (
            <Button {...props} loading={action.busy}>
              Upload contracts
            </Button>
          )}
        </FileButton>
        {files.map((f) => (
          <Text key={f.id}>{f.filename}</Text>
        ))}
        <Checkbox
          label="Retain documents after generation"
          checked={persist}
          onChange={(e) => setPersist(e.currentTarget.checked)}
        />
        <ActionFeedback {...action} />
        {result.error && <Alert color="red">{result.error}</Alert>}
        {result.data && <Text>Status: {result.data.status}</Text>}
        {result.data?.error_message && <Alert color="red">{result.data.error_message}</Alert>}
        <Button
          disabled={!files.length || !kind || (!!generation && result.data?.status !== "error")}
          loading={action.busy}
          onClick={() =>
            void action.run(async () => {
              setGeneration(
                (
                  await api.startEasyPlaybookGeneration({
                    document_ids: files.map((f) => f.document_id!),
                    contract_type: kind,
                    name,
                    persist_documents_after_generation: persist,
                  })
                ).id,
              );
            })
          }
        >
          Generate draft
        </Button>
        {draft && (
          <PlaybookEditorPanel
            initial={draft}
            busy={action.busy}
            onSave={(value) =>
              action.run(async () => {
                await api.createPlaybook(value);
                navigate("/playbooks");
              })
            }
          />
        )}
      </Stack>
    </FeaturePanel>
  );
};
