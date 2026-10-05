import { userAtom } from "@/auth/authAtoms.ts";
import { getUsage } from "@/features/admin/adminApi.ts";
import { useResource } from "@/hooks/useResource.ts";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { listModels } from "@/shared/modelsApi.ts";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Anchor, Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useAtomValue } from "jotai";
const services = [
  ["Postgres", "Accounts, chats, messages and file metadata"],
  ["RustFS / S3", "Uploaded files and exports"],
  ["Gateway", "Model routing and provider configuration"],
  ["Redis", "Cache and job queue"],
];
const artifacts = [
  ["Source code", "https://github.com/LegalQuants/lq-ai", ""],
  ["Releases", "https://github.com/LegalQuants/lq-ai/releases", ""],
  [
    "Security artifacts",
    "https://github.com/LegalQuants/lq-ai/tree/main/docs/security",
    "Machine-readable SBOM publication is pending.",
  ],
  [
    "Security & compliance",
    "https://github.com/LegalQuants/lq-ai/blob/main/docs/PRD.md#5-security--compliance",
    "Interim reference; a dedicated threat model is pending.",
  ],
];
export const TrustPage = () => {
  const user = useAtomValue(userAtom);
  const admin = user?.is_admin || user?.role === "admin";
  const providers = useResource(() => listModels(), []);
  const usage = useResource(async () => {
    if (!admin) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const week = new Date(today.getTime() - 7 * 86400000);
    const [a, b] = await Promise.all([
      getUsage({ group_by: "provider", date_from: today.toISOString() }),
      getUsage({ group_by: "provider", date_from: week.toISOString() }),
    ]);
    const sum = (r: typeof a) =>
      r.rows
        .filter(
          (x) => !["ollama", "localhost", "ollama-localhost"].includes(x.group_key.toLowerCase()),
        )
        .reduce((n, x) => n + x.request_count, 0);
    return { today: sum(a), week: sum(b) };
  }, [admin]);
  const providerNames = [...new Set(providers.data?.data.map((m) => m.owned_by).filter(Boolean))];
  return (
    <FeaturePanel
      title="Trust & privacy"
      description="Deployment information and artifacts you can verify."
    >
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder>
          <Stack>
            <Title order={3}>Where your data lives</Title>
            {services.map(([label, desc]) => (
              <Stack key={label} gap={2}>
                <Text fw={600}>{label}</Text>
                <Text size="sm" c="dimmed">
                  {desc}
                </Text>
              </Stack>
            ))}
            <Text size="sm">
              These services run in the operator’s environment. Verify actual locations and
              retention with your operator.
            </Text>
          </Stack>
        </Card>
        <Card withBorder>
          <Stack>
            <Title order={3}>Configured providers</Title>
            <ResourcePanel {...providers}>
              {providerNames.map((p) => (
                <Badge key={p}>{p}</Badge>
              ))}
              {providers.data?.data.length === 0 && <Text>No models discovered.</Text>}
            </ResourcePanel>
            <Text size="sm">
              Provider availability comes from the gateway. Encryption and residency depend on
              deployment configuration.
            </Text>
          </Stack>
        </Card>
        <Card withBorder>
          <Stack>
            <Title order={3}>External-turn usage</Title>
            {admin ? (
              <ResourcePanel {...usage}>
                <Group>
                  <Text>Today: {usage.data?.today}</Text>
                  <Text>Last 7 days: {usage.data?.week}</Text>
                </Group>
                <Text size="sm">Excludes Ollama and localhost providers.</Text>
              </ResourcePanel>
            ) : (
              <Text>Usage counts are visible to administrators.</Text>
            )}
          </Stack>
        </Card>
        <Card withBorder>
          <Stack>
            <Title order={3}>Trust artifacts</Title>
            {artifacts.map(([label, href, note]) => (
              <Stack key={href} gap={2}>
                <Anchor href={href} target="_blank" rel="noopener noreferrer">
                  {label}
                </Anchor>
                {note && (
                  <Text size="sm" c="dimmed">
                    {note}
                  </Text>
                )}
              </Stack>
            ))}
          </Stack>
        </Card>
      </SimpleGrid>
    </FeaturePanel>
  );
};
