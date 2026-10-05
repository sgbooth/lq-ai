import {
  estimatePlaybookCost,
  formatCostUSD,
  playbookCostAssumptions,
} from "@/features/playbooks/playbookCost.ts";
import { Card, Stack, Text } from "@mantine/core";
import type React from "react";
interface Props {
  positionCount: number;
}
export const PlaybookCostPanel: React.FC<Props> = ({ positionCount }) => (
  <Card withBorder>
    <Stack gap="xs">
      <Text fw={600}>
        Estimated review cost: {formatCostUSD(estimatePlaybookCost(positionCount))}
      </Text>
      <Text size="sm">
        {positionCount} positions · reference model: {playbookCostAssumptions.model}
      </Text>
      <Text size="xs" c="dimmed">
        Assumes $3 input / $15 output per million tokens, 2,000 input and 600 output tokens per
        position, and a redline pass for one third of positions (2,000 input / 800 output).
        Execution uses your deployment’s smart alias. Actual model, token usage and charges may
        differ; this is an informational estimate.
      </Text>
    </Stack>
  </Card>
);
