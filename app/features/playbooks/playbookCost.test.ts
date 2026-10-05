import { expect, it } from "vitest";
import { estimatePlaybookCost, formatCostUSD } from "@/features/playbooks/playbookCost.ts";
it("combines classification with one redline per three positions", () => {
  // Three classifications: 6000 input, 1800 output. One redline: 2000 input, 800 output.
  expect(estimatePlaybookCost(3)).toBeCloseTo((8000 * 3 + 2600 * 15) / 1_000_000);
  expect(estimatePlaybookCost(0)).toBe(0);
  expect(formatCostUSD(0.005)).toBe("< $0.01");
});
