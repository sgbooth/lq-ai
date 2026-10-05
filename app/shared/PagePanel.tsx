import { Brand } from "@/shared/Brand.tsx";
import { Stack } from "@mantine/core";
import type React from "react";
interface Props {
  children: React.ReactNode;
}
export const PagePanel: React.FC<Props> = ({ children }) => (
  <Stack component="main" mih="100dvh" justify="center" align="center" gap="xl" p="lg">
    <Brand compact />
    <Stack w="100%" maw={390} gap="lg">
      {children}
    </Stack>
  </Stack>
);
