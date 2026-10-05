import { Icon } from "@/shared/Icon.tsx";
import { Anchor, Group, Text, ThemeIcon } from "@mantine/core";
import type React from "react";
interface Props {
  compact?: boolean;
}
export const Brand: React.FC<Props> = ({ compact = false }) => (
  <Anchor href="/" aria-label="LQ.AI home" underline="never" c="inherit">
    <Group gap="sm">
      <ThemeIcon size="xl" radius="md" variant="light" color="teal">
        <Icon.Legal size={24} />
      </ThemeIcon>
      <Text component="span" size="xl" fw={750}>
        LQ
        <Text component="span" inherit c="teal.5">
          .
        </Text>
        AI
      </Text>
      {!compact && (
        <Text component="span" size="xs" fw={500} visibleFrom="sm">
          YOUR LEGAL WORKSPACE
        </Text>
      )}
    </Group>
  </Anchor>
);
