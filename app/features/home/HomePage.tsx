import { TrustIndicatorPanel } from "@/shared/TrustIndicatorPanel.tsx";
import { GettingStartedPanel } from "@/features/home/GettingStartedPanel.tsx";
import { userAtom } from "@/auth/authAtoms.ts";
import { useResource } from "@/hooks/useResource.ts";
import { listAllChats } from "@/shared/chat/chatApi.ts";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useAtomValue } from "jotai";
import { Link } from "wouter";

const homeActions = [
  {
    name: "Start a conversation",
    to: "/chats",
    copy: "Research, review and draft with your configured models.",
  },
  {
    name: "Organize a matter",
    to: "/matters",
    copy: "Keep context, files, skills and conversations together.",
  },
  {
    name: "Explore skills",
    to: "/skills",
    copy: "Use and customize repeatable legal workflows.",
  },
];

export const HomePage = () => {
  const user = useAtomValue(userAtom);
  const resource = useResource(async () => ({
    chats: await listAllChats(),
  }));
  return (
    <FeaturePanel
      title={`Welcome, ${user?.display_name || user?.email || "colleague"}`}
      description="Your legal workspace"
    >
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        {homeActions.map((item) => (
          <Card withBorder key={item.to} color="orange">
            <Stack>
              <Title order={3}>{item.name}</Title>
              <Text c="dimmed">{item.copy}</Text>
              <Button component={Link} href={item.to} variant="light">
                Open
              </Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
      <Group>
        <TrustIndicatorPanel />
        <Button component={Link} href="/trust" variant="subtle">
          Trust & transparency
        </Button>
      </Group>
      <GettingStartedPanel />
      <ResourcePanel {...resource}>
        <Title order={2} size="h3">
          Recent conversations
        </Title>
        <Stack>
          {resource.data?.chats.slice(0, 8).map((chat) => (
            <Card withBorder key={chat.id}>
              <Text component={Link} href={`/chats?id=${chat.id}`}>
                {chat.title}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(chat.updated_at).toLocaleString()}
              </Text>
            </Card>
          ))}
        </Stack>
      </ResourcePanel>
    </FeaturePanel>
  );
};
