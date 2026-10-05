import type React from "react";
import { Grid, Stack } from "@mantine/core";
import { ChatPanelContext } from "@/shared/chat/chatPanelContext.ts";
import {
  useChatPanelController,
  type ChatPanelOptions,
} from "@/shared/chat/useChatPanelController.ts";
import { ChatHistoryPanel } from "@/shared/chat/ChatHistoryPanel.tsx";
import { ChatConversationPanel } from "@/shared/chat/ChatConversationPanel.tsx";
import { ChatSkillsPanel } from "@/shared/chat/ChatSkillsPanel.tsx";
import { ChatComposerPanel } from "@/shared/chat/ChatComposerPanel.tsx";
export const ChatPanel: React.FC<ChatPanelOptions> = (options) => {
  const controller = useChatPanelController(options);
  return (
    <ChatPanelContext.Provider value={controller}>
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 3 }}>
          <ChatHistoryPanel />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 9 }}>
          <Stack>
            <ChatConversationPanel />
            <ChatSkillsPanel />
            <ChatComposerPanel />
          </Stack>
        </Grid.Col>
      </Grid>
    </ChatPanelContext.Provider>
  );
};
