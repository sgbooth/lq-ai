import { articles } from "@/features/learn/learnContent.ts";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { Anchor, Box, Button, Card, Group, Stack, Table, Text, Title } from "@mantine/core";
import type React from "react";
import { Link } from "wouter";

const learnLinks = ["", "/how", "/use", "/compare"];

interface Props {
  topic?: string;
}
interface ArticleBlock {
  kind: string;
  text: string;
  links?: readonly { label: string; href: string }[];
  src?: string;
  rows?: readonly (readonly {
    text: string;
    links: readonly { label: string; href: string }[];
  }[])[];
}
export const LearnPage: React.FC<Props> = ({ topic = "/" }) => {
  const blocks: readonly ArticleBlock[] = articles[topic as keyof typeof articles] || articles["/"];
  return (
    <FeaturePanel title="Learn">
      <Group>
        {learnLinks.map((t) => (
          <Button key={t} component={Link} href={"/learn" + t} variant="light">
            {t.slice(1) || "Overview"}
          </Button>
        ))}
      </Group>
      <Stack>
        {blocks.map((b, i) =>
          b.kind === "heading" ? (
            <Title key={i} order={2} size="h3">
              {b.text}
            </Title>
          ) : b.kind === "playground" ? (
            <Card key={i} withBorder>
              <Stack>
                <Title order={3} size="h4">
                  {b.text}
                </Title>
                <Box
                  component="iframe"
                  src={b.src}
                  title={b.text}
                  loading="lazy"
                  w="100%"
                  h={900}
                  bd={0}
                />
                <Anchor href={b.src} target="_blank" rel="noopener noreferrer">
                  Open full-screen
                </Anchor>
              </Stack>
            </Card>
          ) : b.kind === "table" ? (
            <Table.ScrollContainer key={i} minWidth={800}>
              <Table withTableBorder withColumnBorders>
                <Table.Tbody>
                  {b.rows?.map((r, n) => (
                    <Table.Tr key={n}>
                      {r.map((c, j) => (
                        <Table.Td key={j}>
                          <Text>{c.text}</Text>
                          <Group>
                            {c.links.map((l) => (
                              <Anchor
                                key={l.href}
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {l.label}
                              </Anchor>
                            ))}
                          </Group>
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          ) : (
            <Stack key={i} gap="xs" maw={900}>
              <Text>{b.text}</Text>
              {b.links && b.links.length > 0 && (
                <Group>
                  {b.links.map((l) => (
                    <Anchor
                      key={l.href}
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                    >
                      {l.label}
                    </Anchor>
                  ))}
                </Group>
              )}
            </Stack>
          ),
        )}
      </Stack>
    </FeaturePanel>
  );
};
