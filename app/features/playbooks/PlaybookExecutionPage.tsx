import { getPlaybookExecution } from "@/features/playbooks/playbooksApi.ts";
import { useResource } from "@/hooks/useResource.ts";
import { PlaybookDisclaimerPanel } from "@/shared/PlaybookDisclaimerPanel.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { MarkdownPanel } from "@/shared/MarkdownPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { StatusBadge } from "@/shared/StatusBadge.tsx";
import { Alert, Card, Group, Stack, Text } from "@mantine/core";
import type React from "react";
import { useState } from "react";
interface Props {
  id: string;
}
export const PlaybookExecutionPage: React.FC<Props> = ({ id }) => {
  const [terminal, setTerminal] = useState(false);
  const resource = useResource(
    async () => {
      const result = await getPlaybookExecution(id);
      setTerminal(!["pending", "running"].includes(result.status));
      return result;
    },
    [id],
    terminal ? undefined : 3000,
  );
  return (
    <FeaturePanel title="Playbook review">
      <PlaybookDisclaimerPanel />
      <ResourcePanel {...resource}>
        {resource.data && (
          <Stack>
            <StatusBadge status={resource.data.status} />
            {resource.data.error && <Alert color="red">{resource.data.error}</Alert>}
            {resource.data.results && (
              <Text>
                {Object.entries(resource.data.results.summary)
                  .map(([k, v]) => `${k.replaceAll("_", " ")}: ${v}`)
                  .join(" · ")}
              </Text>
            )}
            {resource.data.results?.positions.map((p) => (
              <Card withBorder key={p.position_id}>
                <Stack>
                  <Group>
                    <Text fw={600}>{p.issue}</Text>
                    <StatusBadge status={p.verdict} />
                  </Group>
                  <Text size="sm">
                    Severity {p.severity_if_missing} · confidence {Math.round(p.confidence * 100)}%
                    {p.matched_fallback_rank !== null
                      ? " · fallback " + p.matched_fallback_rank
                      : ""}
                  </Text>
                  <MarkdownPanel content={p.justification} />
                  {p.matched_text && (
                    <>
                      <Text fw={600}>Matched contract text</Text>
                      <Text>{p.matched_text}</Text>
                    </>
                  )}
                  {p.redline && (
                    <>
                      <Text fw={600}>Suggested redline</Text>
                      <Text td="line-through" c="red">
                        {p.redline.old_text}
                      </Text>
                      <Text c="teal">{p.redline.new_text}</Text>
                      <Text size="sm">{p.redline.justification}</Text>
                    </>
                  )}
                  {p.cited_chunk_ids.length > 0 && (
                    <Text size="xs">Source chunks: {p.cited_chunk_ids.join(", ")}</Text>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </ResourcePanel>
    </FeaturePanel>
  );
};
