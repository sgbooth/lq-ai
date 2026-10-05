import { autonomousEnabledAtom, saveSettingsAtom } from "@/features/settings/settingsAtoms.ts";
import { useAction } from "@/hooks/useAction.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { Alert, Stack, Switch, Text } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
export const AutonomousSettingsPage = () => {
  const enabled = useAtomValue(autonomousEnabledAtom);
  const save = useSetAtom(saveSettingsAtom);
  const action = useAction();
  return (
    <FeaturePanel title="Autonomous workflows">
      <Stack maw={650}>
        <Text>
          Opt in to scheduled and event-triggered runs. Review cost limits and receipts before
          enabling unattended work.
        </Text>
        <Switch
          label="Enable autonomous workflows"
          checked={enabled}
          disabled={action.busy}
          onChange={(e) =>
            void action.run(() => save({ autonomous_enabled: e.currentTarget.checked }))
          }
        />
        <Alert color="yellow">
          Turning this off prevents new runs. Halt running sessions separately from the sessions
          page.
        </Alert>
        <ActionFeedback {...action} />
      </Stack>
    </FeaturePanel>
  );
};
