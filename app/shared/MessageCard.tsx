import { store } from "@/Atoms.ts";
import { userAtom } from "@/auth/authAtoms.ts";
import { useAction } from "@/hooks/useAction.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { updateChat } from "@/shared/chat/chatActions.ts";
import { chatStateAtom, enhancementOriginalsAtom } from "@/shared/chat/chatAtoms.ts";
import { overrideTierFloor } from "@/shared/chat/inferenceOverrideApi.ts";
import { MessageContentPanel } from "@/shared/MessageContentPanel.tsx";
import { inferenceTiers, tierLabel } from "@/shared/inferenceTiers.ts";
import { MessageEvidencePopover } from "@/shared/MessageEvidencePopover.tsx";
import { captureInlineAtom } from "@/shared/preferencesAtoms.ts";
import type { Message } from "@/shared/types.ts";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  useComputedColorScheme,
} from "@mantine/core";
import { useAtomValue } from "jotai";
import type React from "react";
import { useState } from "react";
interface Props {
  message: Message;
  streaming?: boolean;
}
export const MessageCard: React.FC<Props> = ({ message, streaming = false }) => {
  const [diff, setDiff] = useState(false);
  const originals = useAtomValue(enhancementOriginalsAtom);
  const [override, setOverride] = useState(false);
  const [reason, setReason] = useState("");
  const action = useAction();
  const user = useAtomValue(userAtom);
  const captureInline = useAtomValue(captureInlineAtom);
  const isUser = message.role === "user";
  const colorScheme = useComputedColorScheme("light");
  const messageColor = isUser ? "blue" : "gray";
  const background =
    colorScheme === "dark"
      ? `var(--mantine-color-${messageColor}-light)`
      : `var(--mantine-color-${messageColor}-0)`;
  return (
    <Box w={isUser ? { base: "95%", sm: "85%" } : "100%"} ml={isUser ? "auto" : 0}>
      <Card p="xs" radius="md" withBorder bg={background}>
        <Stack gap={4}>
          <Group justify="space-between">
            <Text size="sm" fw={600} c={messageColor}>
              {message.role === "user"
                ? "You"
                : message.role === "assistant"
                  ? "Assistant"
                  : message.role}
            </Text>
            <Group gap="xs">
              {message.is_enhanced && (
                <Button size="xs" variant="light" onClick={() => setDiff(true)}>
                  Enhanced prompt
                </Button>
              )}
              {message.routed_inference_tier && (
                <Badge variant="light">{tierLabel(message.routed_inference_tier)}</Badge>
              )}
              {message.kind === "refusal" && <Badge color="red">Refused</Badge>}
              {message.role === "assistant" && <MessageEvidencePopover message={message} />}
            </Group>
          </Group>
          <MessageContentPanel message={message} streaming={streaming} />
          {message.routed_inference_tier && (
            <Text size="xs" c="dimmed">
              {inferenceTiers[message.routed_inference_tier]?.description}
            </Text>
          )}
          {message.kind === "refusal" && (
            <Text size="sm" c="red">
              {message.refusal_reason || "The requested route was refused by policy."} · requested
              tier {message.requested_tier || "—"} · enforced tier {message.enforced_tier || "—"}
            </Text>
          )}
          {message.error_code && <Text c="red">{message.error_code}</Text>}
          {Boolean(message.applied_skills?.length) && (
            <Group gap="xs">
              {message.applied_skills?.map((skill) => (
                <Badge variant="outline" key={skill}>
                  {skill}
                </Badge>
              ))}
            </Group>
          )}
          <Group gap="xs">
            <Button
              size="xs"
              variant="subtle"
              onClick={() =>
                void action.run(() => navigator.clipboard.writeText(message.content), "Copied.")
              }
            >
              Copy
            </Button>
            {message.role === "assistant" && captureInline && (
              <Button
                size="xs"
                variant="subtle"
                component="a"
                href={`/skills/new?capture=${message.id}`}
                onClick={() =>
                  sessionStorage.setItem(
                    `lq-ai:capture-stash:${message.id}`,
                    JSON.stringify({ body: message.content, display_name: "Captured skill" }),
                  )
                }
              >
                Capture as skill
              </Button>
            )}
            {message.kind === "refusal" && (user?.is_admin || user?.role === "admin") && (
              <Button color="orange" size="xs" variant="light" onClick={() => setOverride(true)}>
                Override tier floor
              </Button>
            )}
          </Group>
          <ActionFeedback {...action} />
        </Stack>
        <Modal opened={diff} onClose={() => setDiff(false)} title="Prompt comparison" size="lg">
          <Stack>
            <Text fw={600}>Original</Text>
            <Text>
              {originals[message.content] ||
                "The original prompt was not retained for this session."}
            </Text>
            <Text fw={600}>Enhanced</Text>
            <Text>{message.content}</Text>
          </Stack>
        </Modal>

        <Modal
          opened={override}
          onClose={() => !action.busy && setOverride(false)}
          title="Override inference tier floor"
        >
          <Stack>
            <Text>
              This reruns the refused message with the tier floor lifted and records your reason in
              the audit log.
            </Text>
            <Textarea
              label="Reason"
              minLength={10}
              maxLength={500}
              required
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
            />
            <ActionFeedback {...action} />
            <Button
              color="orange"
              loading={action.busy}
              disabled={reason.trim().length < 10}
              onClick={() =>
                void action.run(async () => {
                  const result = await overrideTierFloor(message.id, reason.trim());
                  const state = store.get(chatStateAtom);
                  if (state.chat?.id === message.chat_id)
                    updateChat({ messages: [...state.messages, result.ai_message] });
                  setOverride(false);
                })
              }
            >
              Authorize rerun
            </Button>
          </Stack>
        </Modal>
      </Card>
    </Box>
  );
};
