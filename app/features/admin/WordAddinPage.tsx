import { downloadManifestFile, fetchWordAddinManifest } from "@/features/admin/wordAddinApi.ts";
import { useAction } from "@/hooks/useAction.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { Button, Stack, TextInput } from "@mantine/core";
import { useState } from "react";
export const WordAddinPage = () => {
  const [origin, setOrigin] = useState("");
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const action = useAction();
  return (
    <FeaturePanel
      title="Word add-in"
      description="Download a manifest to sideload through Microsoft 365 Integrated apps."
    >
      <Stack
        component="form"
        maw={600}
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(
            async () =>
              downloadManifestFile(
                await fetchWordAddinManifest({
                  deploymentOrigin: origin || undefined,
                  displayName: name || undefined,
                  providerName: provider || undefined,
                }),
              ),
            "Manifest downloaded.",
          );
        }}
      >
        <TextInput
          label="Deployment origin"
          placeholder="https://your-deployment.example"
          value={origin}
          onChange={(e) => setOrigin(e.currentTarget.value)}
        />
        <TextInput
          label="Display name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <TextInput
          label="Provider name"
          value={provider}
          onChange={(e) => setProvider(e.currentTarget.value)}
        />
        <ActionFeedback {...action} />
        <Button type="submit" loading={action.busy}>
          Download manifest
        </Button>
      </Stack>
    </FeaturePanel>
  );
};
