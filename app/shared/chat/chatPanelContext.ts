import type { useChatPanelController } from "@/shared/chat/useChatPanelController.ts";
import { createContext, useContext } from "react";
export const ChatPanelContext = createContext<ReturnType<typeof useChatPanelController> | null>(
  null,
);
export function useChatPanel() {
  const controller = useContext(ChatPanelContext);
  if (!controller) throw new Error("Chat panels require ChatPanelContext.");
  return controller;
}
