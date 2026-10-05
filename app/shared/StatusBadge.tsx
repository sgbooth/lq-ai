import { Badge } from "@mantine/core";
import type React from "react";
interface Props {
  status: string;
}
export const StatusBadge: React.FC<Props> = ({ status }) => (
  <Badge
    variant="light"
    color={
      /fail|error|reject|unverified|missing|deviates|flagged/.test(status)
        ? "red"
        : /running|pending|proposed|partial|low|medium|cancelled|halted/.test(status)
          ? "yellow"
          : "teal"
    }
  >
    {status.replaceAll("_", " ")}
  </Badge>
);
