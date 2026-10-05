import { Container, Group, Stack, Text, Title } from "@mantine/core";
import type React from "react";
interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}
export const FeaturePanel: React.FC<Props> = ({ title, description, actions, children }) => (
  <Container size="xl" w="100%" py="xl">
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={1} size="h2">
            {title}
          </Title>
          {description && (
            <Text c="dimmed" size="sm">
              {description}
            </Text>
          )}
        </Stack>
        {actions}
      </Group>
      {children}
    </Stack>
  </Container>
);
