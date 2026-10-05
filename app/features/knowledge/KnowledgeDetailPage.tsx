import * as api from "@/features/knowledge/knowledgeApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { pollFileStatus, uploadFile } from "@/shared/filesApi.ts";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { StatusBadge } from "@/shared/StatusBadge.tsx";
import { Button, FileButton, Group, Table, Text } from "@mantine/core";
import type React from "react";
import { useLocation } from "wouter";
interface Props {
  id: string;
}
export const KnowledgeDetailPage: React.FC<Props> = ({ id }) => {
  const [, navigate] = useLocation();
  const resource = useResource(
    async () => ({
      kb: await api.getKnowledgeBase(id),
      files: await api.listKnowledgeBaseFiles(id),
    }),
    [id],
    5000,
  );
  const action = useAction();
  return (
    <FeaturePanel
      title={resource.data?.kb.name || "Knowledge base"}
      actions={
        <Group>
          {resource.data && (
            <>
              <ConfirmButton
                color="orange"
                label={resource.data.kb.archived_at ? "Unarchive" : "Archive"}
                description="Change this knowledge base’s availability in attachment pickers. Matter links remain available."
                onConfirm={async () => {
                  await api.setKnowledgeBaseArchived(id, !resource.data!.kb.archived_at);
                  resource.reload();
                }}
              />
              <ConfirmButton
                label="Delete knowledge base"
                description="Soft-delete this knowledge base. Its files are retained."
                onConfirm={async () => {
                  await api.deleteKnowledgeBase(id);
                  navigate("/knowledge");
                }}
              />
            </>
          )}
          <FileButton
            multiple
            onChange={(files) => {
              void action.run(async () => {
                for (const file of files) {
                  const uploaded = await uploadFile(file);
                  const result = await pollFileStatus(uploaded.id);
                  if (result.file?.ingestion_status !== "ready")
                    throw new Error(`${file.name} did not finish ingesting.`);
                  await api.attachFileToKB(id, uploaded.id);
                }
                resource.reload();
              }, "Files attached.");
            }}
          >
            {(props) => (
              <Button {...props} loading={action.busy}>
                Upload documents
              </Button>
            )}
          </FileButton>
        </Group>
      }
    >
      <ActionFeedback {...action} />
      <ResourcePanel {...resource}>
        <Text c="dimmed">{resource.data?.kb.description}</Text>
        <Table.ScrollContainer minWidth={600}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>File</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {resource.data?.files.map((file) => (
                <Table.Tr key={file.id}>
                  <Table.Td>{file.filename}</Table.Td>
                  <Table.Td>
                    <StatusBadge
                      status={
                        file.ingest_status && file.ingest_status !== "ok"
                          ? file.ingest_status
                          : file.ingestion_status
                      }
                    />
                    {file.ingest_failure_reason && (
                      <Text c="red" size="xs">
                        {file.ingest_failure_reason}
                      </Text>
                    )}
                    {file.ingestion_error && (
                      <Text c="red" size="xs">
                        {file.ingestion_error}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>{Math.round(file.size_bytes / 1024)} KB</Table.Td>
                  <Table.Td>
                    <ConfirmButton
                      label="Detach"
                      description={`Detach ${file.filename} from this knowledge base?`}
                      onConfirm={async () => {
                        await api.detachFileFromKB(id, file.id);
                        resource.reload();
                      }}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </ResourcePanel>
    </FeaturePanel>
  );
};
