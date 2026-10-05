import { ChatPanel } from "@/shared/chat/ChatPanel.tsx";
import { FeaturePanel } from "@/shared/FeaturePanel.tsx";
import { useSearch } from "wouter";
export const ChatsPage = () => {
  const query = new URLSearchParams(useSearch());
  return (
    <FeaturePanel title="Chats">
      <ChatPanel
        initialChatId={query.get("id") || undefined}
        projectId={query.get("project_id") || undefined}
      />
    </FeaturePanel>
  );
};
