import { deleteUserSkill, listUserSkills } from "@/features/skills/userSkillsApi.ts";
import { useResource } from "@/hooks/useResource.ts";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { listSkills } from "@/shared/skillsApi.ts";
import {
  Badge,
  Button,
  Card,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useState } from "react";
import { Link } from "wouter";

const skillTypeOptions = ["builtin", "user", "team"];

export const SkillsPage = () => {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<string | null>(null);
  const resource = useResource(async () => ({
    skills: await listSkills(),
    mine: await listUserSkills("all"),
  }));
  return (
    <FeaturePanel
      title="Skills"
      actions={
        <Group>
          <Button component={Link} href="/skills/workspaces" variant="light">
            Saved work
          </Button>
          <Button component={Link} href="/skills/new">
            Create skill
          </Button>
        </Group>
      }
    >
      <Group>
        <TextInput
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Select label="Scope" clearable data={skillTypeOptions} value={scope} onChange={setScope} />
      </Group>
      <ResourcePanel {...resource}>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {resource.data?.skills
            .filter(
              (s) =>
                (!scope || s.scope === scope) &&
                (s.title + " " + s.name + " " + s.description)
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            )
            .map((s) => (
              <Card withBorder key={s.name}>
                <Stack>
                  <Text component={Link} href={`/skills/${encodeURIComponent(s.name)}`} fw={600}>
                    {s.title || s.name}
                  </Text>
                  <Group>
                    <Badge>{s.scope}</Badge>
                    <Badge variant="outline">{s.version}</Badge>
                    {s.output_format === "table" && <Badge>Table</Badge>}
                  </Group>
                  <Text size="sm" c="dimmed">
                    {s.description}
                  </Text>
                  <Group>
                    <Button
                      component={Link}
                      href={`/skills/new?fork=${encodeURIComponent(s.name)}`}
                      size="xs"
                      variant="light"
                    >
                      Fork
                    </Button>
                    {resource.data?.mine
                      .filter((u) => u.slug === s.name)
                      .map((u) => (
                        <Group key={u.id}>
                          <Button
                            component={Link}
                            href={`/skills/${u.id}/edit`}
                            size="xs"
                            variant="light"
                          >
                            Edit
                          </Button>
                          <ConfirmButton
                            label="Archive"
                            description={`Archive ${u.display_name}?`}
                            onConfirm={async () => {
                              await deleteUserSkill(u.id);
                              resource.reload();
                            }}
                          />
                        </Group>
                      ))}
                  </Group>
                </Stack>
              </Card>
            ))}
        </SimpleGrid>
      </ResourcePanel>
    </FeaturePanel>
  );
};
