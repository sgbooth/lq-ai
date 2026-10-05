import { useChatPanel } from "@/shared/chat/chatPanelContext.ts";
import { tierLabel } from "@/shared/inferenceTiers.ts";
import { Text } from "@mantine/core";
export const ChatTrustPanel = () => {
  const { messages, busy } = useChatPanel();
  const last = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.routed_provider && !(busy && m === messages.at(-1)));
  return (
    <Text component="footer" size="xs" c="dimmed" aria-label="Chat status">
      {last
        ? `Last response: ${last.routed_provider} / ${last.routed_model ?? "model not recorded"} · ${tierLabel(last.routed_inference_tier)}`
        : "Provider and data-handling tier will appear after the first response."}
    </Text>
  );
};
