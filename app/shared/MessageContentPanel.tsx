import { useResource } from "@/hooks/useResource.ts";
import { getMessageCitations } from "@/shared/chat/citationsApi.ts";
import { MarkdownPanel } from "@/shared/MarkdownPanel.tsx";
import type { Message } from "@/shared/types.ts";
import { Text } from "@mantine/core";
import type React from "react";
interface Props {
  message: Message;
  streaming?: boolean;
}
export const MessageContentPanel: React.FC<Props> = ({ message, streaming = false }) => {
  const hasMarkers = /(?:"[^"]+?"|“[^”]+?”)\s*\(Source:\s*\[\d+\]\)/s.test(message.content);
  const fetchCitations =
    message.role === "assistant" && !streaming && hasMarkers && !message.citations;
  const citations = useResource(
    () => (fetchCitations ? getMessageCitations(message.chat_id, message.id) : Promise.resolve([])),
    [message.id, fetchCitations],
  );
  return (
    <>
      <MarkdownPanel
        content={message.content}
        citations={
          message.role === "assistant" && !streaming && hasMarkers
            ? (message.citations ?? (citations.loading ? undefined : (citations.data ?? [])))
            : undefined
        }
      />
      {fetchCitations && citations.loading && (
        <Text size="xs" c="dimmed">
          Checking citation verification…
        </Text>
      )}
      {citations.error && (
        <Text size="xs" c="red">
          Citation verification unavailable. Citations are shown as unverified.
        </Text>
      )}
    </>
  );
};
