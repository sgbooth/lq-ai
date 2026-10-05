import { EnhancePromptPanel } from "@/shared/EnhancePromptPanel.tsx";
import { useChatPanel } from "@/shared/chat/chatPanelContext.ts";
export const ChatEnhancementPanel = () => {
  const {
    pendingSend,
    enhanceTrigger,
    rawSend,
    text,
    busy,
    chat,
    model,
    skills,
    files,
    pendingEnhancement,
    setText,
  } = useChatPanel();
  const request = {
    raw_input: text,
    chat_id: chat?.id,
    model: model ?? undefined,
    attached_skills: skills.map((name) => ({ name })),
    attached_files: files.map((f) => ({ file_id: f.id, filename: f.filename })),
  };
  return (
    <EnhancePromptPanel
      onDismiss={() => {
        pendingSend.current = false;
      }}
      trigger={enhanceTrigger}
      onKeep={() => {
        if (pendingSend.current) {
          pendingSend.current = false;
          void rawSend(text);
        }
      }}
      disabled={busy}
      request={request}
      onApply={(value, original) => {
        pendingEnhancement.current = { original, enhanced: value };
        setText(value);
        if (pendingSend.current) {
          pendingSend.current = false;
          void rawSend(value);
        }
      }}
    />
  );
};
