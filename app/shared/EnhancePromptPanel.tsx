import { store } from "@/Atoms.ts";
import { userAtom } from "@/auth/authAtoms.ts";
import { recordOnboardingSignal } from "@/shared/onboardingSignals.ts";
import { useAction } from "@/hooks/useAction.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { enhance, recordOutcome } from "@/shared/chat/enhancePromptApi.ts";
import type { EnhancePromptRequest, EnhancePromptResponse } from "@/shared/types.ts";
import { Alert, Button, Group, Modal, Stack, Text, Textarea } from "@mantine/core";
import type React from "react";
import { useEffect, useState } from "react";
interface Props {
  request: EnhancePromptRequest;
  disabled?: boolean;
  onApply: (text: string, original: string) => void;
  trigger?: number;
  onKeep?: () => void;
  onDismiss?: () => void;
}
export const EnhancePromptPanel: React.FC<Props> = ({
  request,
  disabled,
  onApply,
  trigger,
  onKeep,
  onDismiss,
}) => {
  const [original, setOriginal] = useState("");
  const [preview, setPreview] = useState<EnhancePromptResponse | null>(null);
  const [expanded, setExpanded] = useState("");
  const action = useAction();
  const open = () =>
    action
      .run(async () => {
        setOriginal(request.raw_input);
        const owner = store.get(userAtom)?.id;
        const result = await enhance(request);
        recordOnboardingSignal("enhance", owner);
        setPreview(result);
        setExpanded(result.expanded_prompt);
      })
      .then((ok) => {
        if (!ok) onDismiss?.();
      });
  useEffect(() => {
    if (trigger) void open();
  }, [trigger]);
  const decide = (used: boolean, dismiss = false) =>
    action.run(async () => {
      if (!preview) return;
      await recordOutcome(preview.interaction_id, {
        used,
        edited_before_use: used && expanded !== preview.expanded_prompt,
      });
      if (used) onApply(expanded, original);
      else if (dismiss) onDismiss?.();
      else onKeep?.();
      setPreview(null);
    });
  return (
    <>
      <Button
        variant="subtle"
        disabled={disabled || !request.raw_input.trim()}
        loading={action.busy}
        onClick={() => void open()}
      >
        Enhance prompt
      </Button>
      <ActionFeedback error={action.error} />
      <Modal
        opened={!!preview}
        onClose={() => {
          if (!action.busy) void decide(false, true);
        }}
        title="Review enhanced prompt"
        size="xl"
      >
        <Stack>
          {preview && !preview.expansion_applied && (
            <Alert>{preview.skip_reason || "No expansion was needed."}</Alert>
          )}
          <Text fw={600}>Original</Text>
          <Text>{original}</Text>
          <Textarea
            label="Enhanced prompt (editable)"
            autosize
            minRows={6}
            value={expanded}
            onChange={(e) => setExpanded(e.currentTarget.value)}
          />
          {preview?.reasoning.map((reason, i) => (
            <Text size="sm" key={i}>
              {reason}
            </Text>
          ))}
          <Text size="xs" c="dimmed">
            {preview?.routed_provider} / {preview?.routed_model} · Tier{" "}
            {preview?.routed_inference_tier ?? "—"}
          </Text>
          <ActionFeedback {...action} />
          <Group>
            <Button loading={action.busy} onClick={() => void decide(true)}>
              Use enhanced
            </Button>
            <Button variant="default" disabled={action.busy} onClick={() => void decide(false)}>
              Keep original
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
