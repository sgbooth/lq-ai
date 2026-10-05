import { listUserSkillVersions } from "@/features/skills/userSkillsApi.ts";
import { useResource } from "@/hooks/useResource.ts";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { MarkdownPanel } from "@/shared/MarkdownPanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { getSkill } from "@/shared/skillsApi.ts";
import { SkillTryPanel } from "@/shared/SkillTryPanel.tsx";
import { Badge, Button, Card, Group, Stack, Tabs, Text } from "@mantine/core";
import type React from "react";
import { Link, useLocation, useSearch } from "wouter";

const skillTabs = ["use", "source", "try", "versions"];

interface Props {
  id: string;
}
export const SkillPage: React.FC<Props> = ({ id }) => {
  const resource = useResource(() => getSkill(id), [id]);
  const query = new URLSearchParams(useSearch());
  const [, navigate] = useLocation();
  const tab = query.get("tab") || "use";
  const versions = useResource(
    () => (resource.data?.id ? listUserSkillVersions(resource.data.id) : Promise.resolve(null)),
    [resource.data?.id],
  );
  const sourceFiles = [
    ...(resource.data?.reference_files || []),
    ...(resource.data?.example_files || []),
    ...(resource.data?.script_files || []),
  ];
  return (
    <FeaturePanel
      title={resource.data?.title || id}
      actions={
        <Button component={Link} href={`/skills/new?fork=${encodeURIComponent(id)}`}>
          Fork skill
        </Button>
      }
    >
      <ResourcePanel {...resource}>
        {resource.data && (
          <Stack>
            <Group>
              <Badge>{resource.data.scope}</Badge>
              <Badge variant="outline">{resource.data.version}</Badge>
              <Text>Minimum tier {resource.data.minimum_inference_tier || 1}</Text>
            </Group>
            {resource.data.unavailable_tool_usage?.length ? (
              <Text c="orange">
                Unavailable tools: {resource.data.unavailable_tool_usage.join(", ")}
              </Text>
            ) : null}
            <Tabs
              value={tab}
              onChange={(v) => navigate(`/skills/${encodeURIComponent(id)}?tab=${v}`)}
            >
              <Tabs.List>
                {skillTabs.map((t) => (
                  <Tabs.Tab key={t} value={t}>
                    {t === "try" ? "Try it" : t}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
              <Tabs.Panel value="use" pt="md">
                <MarkdownPanel content={resource.data.content_md} />
              </Tabs.Panel>
              <Tabs.Panel value="source" pt="md">
                <Stack>
                  <Text component="pre">
                    {resource.data.content_yaml + "\n" + resource.data.content_md}
                  </Text>
                  {sourceFiles.map((f) => (
                    <Card key={f.path} withBorder>
                      <Text fw={600}>{f.path}</Text>
                      <Text component="pre">{f.content}</Text>
                    </Card>
                  ))}
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="try" pt="md">
                {tab === "try" && <SkillTryPanel skillName={resource.data.name} />}
              </Tabs.Panel>
              <Tabs.Panel value="versions" pt="md">
                <ResourcePanel {...versions}>
                  <Stack>
                    {versions.data?.items.map((v, i) => (
                      <Card withBorder key={v.timestamp + i}>
                        <Stack gap="xs">
                          <Group>
                            <Badge>{v.action}</Badge>
                            <Text fw={600}>Version {v.version || "—"}</Text>
                          </Group>
                          <Text size="sm">
                            {new Date(v.timestamp).toLocaleString()} ·{" "}
                            {v.actor_email || v.actor_user_id || "System"}
                          </Text>
                          {v.details &&
                            Object.entries(v.details).map(([key, value]) => (
                              <Text key={key} size="sm">
                                <Text span fw={600}>
                                  {key.replaceAll("_", " ")}:{" "}
                                </Text>
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value ?? "—")}
                              </Text>
                            ))}
                        </Stack>
                      </Card>
                    ))}
                    {!resource.data.id && (
                      <Text>Built-in versions are maintained in the skills repository.</Text>
                    )}
                  </Stack>
                </ResourcePanel>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        )}
      </ResourcePanel>
    </FeaturePanel>
  );
};
