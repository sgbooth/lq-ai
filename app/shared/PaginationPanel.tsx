import { Button, Group, Text } from "@mantine/core";
import type React from "react";
interface Props {
  offset: number;
  total: number;
  onChange: (offset: number) => void;
  pageSize?: number;
}
export const PaginationPanel: React.FC<Props> = ({ offset, total, onChange, pageSize = 50 }) => (
  <Group>
    <Button
      variant="default"
      disabled={offset === 0}
      onClick={() => onChange(Math.max(0, offset - pageSize))}
    >
      Previous
    </Button>
    <Text size="sm" c="dimmed">
      {total === 0 ? 0 : offset + 1}–{Math.min(offset + pageSize, total)} of {total}
    </Text>
    <Button
      variant="default"
      disabled={offset + pageSize >= total}
      onClick={() => onChange(offset + pageSize)}
    >
      Next
    </Button>
  </Group>
);
