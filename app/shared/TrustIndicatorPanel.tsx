import { Badge, Tooltip } from "@mantine/core";
import { useAtomValue } from "jotai";
import { settingsAtom } from "@/shared/preferencesAtoms.ts";
export const TrustIndicatorPanel = () => {
  const { trust_pills } = useAtomValue(settingsAtom);
  const dots = trust_pills === "dots";
  return (
    <Tooltip label="Self-hosted workspace" disabled={!dots}>
      <Badge variant="light" color="teal" circle={dots} aria-label="Self-hosted workspace">
        {dots ? "●" : "Self-hosted workspace"}
      </Badge>
    </Tooltip>
  );
};
