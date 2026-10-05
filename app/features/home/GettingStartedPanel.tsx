import { userAtom } from "@/auth/authAtoms.ts";
import { listProjects } from "@/features/matters/mattersApi.ts";
import { listUserSkills } from "@/features/skills/userSkillsApi.ts";
import { useResource } from "@/hooks/useResource.ts";
import { readOnboardingSignal } from "@/shared/onboardingSignals.ts";
import { Anchor, Badge, Card, Group, Progress, Stack, Text, Title } from "@mantine/core";
import { useAtomValue } from "jotai";
import { Link } from "wouter";
const checklistItems = [
  { key: "password", label: "Log in & rotate password", href: "/change-password" },
  { key: "matter", label: "Create your first matter", href: "/matters" },
  { key: "skill", label: "Run a skill on a document", href: "/chats" },
  { key: "enhance", label: "Try Enhance Prompt", href: "/chats" },
  { key: "knowledge", label: "Attach a knowledge base to a matter", href: "/matters" },
  { key: "saved", label: "Save a prompt as a skill", href: "/skills/new" },
];
export const GettingStartedPanel = () => {
  const user = useAtomValue(userAtom);
  const projects = useResource(() => listProjects(), [user?.id]);
  const skills = useResource(() => listUserSkills("user"), [user?.id]);
  const done: Record<string, boolean> = {
    password: user?.must_change_password === false,
    matter: !!projects.data?.length,
    skill: !!user && readOnboardingSignal(user.id, "skill-document"),
    enhance: !!user && readOnboardingSignal(user.id, "enhance"),
    knowledge: !!projects.data?.some((p) => p.attached_knowledge_base_ids?.length),
    saved: !!skills.data?.length,
  };
  const count = checklistItems.filter((item) => done[item.key]).length;
  return (
    <Card withBorder>
      <Stack>
        <Group justify="space-between">
          <Title order={2} size="h3">
            Getting started
          </Title>
          <Text size="sm">
            {count} of {checklistItems.length} complete
          </Text>
        </Group>
        <Progress
          value={(count / checklistItems.length) * 100}
          aria-label="Getting started progress"
        />
        {(projects.error || skills.error) && (
          <Text size="sm" c="orange">
            Some completion signals could not be loaded. {projects.error || skills.error}
          </Text>
        )}
        {checklistItems.map((item) => (
          <Group key={item.key} justify="space-between">
            <Text>{item.label}</Text>
            {done[item.key] ? (
              <Badge color="teal" variant="light">
                Complete
              </Badge>
            ) : (
              <Anchor component={Link} href={item.href}>
                {((item.key === "matter" || item.key === "knowledge") && projects.loading) ||
                (item.key === "saved" && skills.loading)
                  ? "Checking…"
                  : "Start"}
              </Anchor>
            )}
          </Group>
        ))}
      </Stack>
    </Card>
  );
};
