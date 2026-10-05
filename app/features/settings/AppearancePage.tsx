import { saveSettingsAtom, settingsAtom } from "@/features/settings/settingsAtoms.ts";
import { useAction } from "@/hooks/useAction.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { autoEnhanceAtom, captureInlineAtom } from "@/shared/preferencesAtoms.ts";
import type { Preferences } from "@/shared/types.ts";
import { Select, Stack, Switch, useMantineColorScheme } from "@mantine/core";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

const colorSchemeOptions = ["light", "dark", "auto"];

const options: { key: keyof Preferences; label: string; values: string[] }[] = [
  {
    key: "reasoning_visibility",
    label: "Reasoning visibility",
    values: ["always_show", "disclosure", "on_request"],
  },
  { key: "featured_tools", label: "Featured tools", values: ["prominent", "inline"] },
  {
    key: "workspace_layout",
    label: "Workspace layout",
    values: ["three_pane", "two_pane", "one_pane"],
  },
  { key: "trust_pills", label: "Trust indicators", values: ["labels", "dots"] },
  { key: "provenance_pills", label: "Provenance indicators", values: ["always", "collapsed"] },
];
export const AppearancePage = () => {
  const [autoEnhance, setAutoEnhance] = useAtom(autoEnhanceAtom);
  const [captureInline, setCaptureInline] = useAtom(captureInlineAtom);
  const settings = useAtomValue(settingsAtom);
  const save = useSetAtom(saveSettingsAtom);
  const action = useAction();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  return (
    <FeaturePanel title="Appearance & preferences">
      <Stack maw={560}>
        <Select
          label="Color scheme"
          data={colorSchemeOptions}
          value={colorScheme}
          onChange={(v) => setColorScheme(v as "light" | "dark" | "auto")}
        />
        {options.map((o) => (
          <Select
            key={o.key}
            label={o.label}
            value={String(settings[o.key])}
            data={o.values.map((value) => ({ value, label: value.replaceAll("_", " ") }))}
            disabled={action.busy}
            onChange={(v) => void action.run(() => save({ [o.key]: v }))}
          />
        ))}
        <Switch
          label="Automatically enhance prompts"
          description="Preview and confirm an enhancement before each send."
          checked={autoEnhance}
          onChange={(e) => setAutoEnhance(e.currentTarget.checked)}
        />
        <Switch
          label="Show skill capture button"
          checked={captureInline}
          onChange={(e) => setCaptureInline(e.currentTarget.checked)}
        />
        <ActionFeedback {...action} />
      </Stack>
    </FeaturePanel>
  );
};
