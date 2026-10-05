import { Anchor, Group, Text } from "@mantine/core";
export const BrandFooterPanel = () => (
  <Group justify="center" p="md" gap="xs">
    <Text size="xs" c="dimmed">
      LQ.AI · React frontend · based on the OpenWebUI fork
    </Text>
    <Anchor
      size="xs"
      href="https://github.com/open-webui/open-webui/tree/v0.9.2"
      target="_blank"
      rel="noopener noreferrer"
    >
      OpenWebUI v0.9.2 attribution
    </Anchor>
  </Group>
);
