import { nextRun } from "@/features/autonomous/cron.ts";
import { expect, it } from "vitest";
it("previews UTC schedules independently of the operator timezone", () => {
  expect(nextRun("0 9 * * 1", new Date("2026-10-02T16:00:00Z"))?.toISOString()).toBe(
    "2026-10-05T09:00:00.000Z",
  );
  expect(nextRun("*/5 * * * *", new Date())).toBeNull();
});
