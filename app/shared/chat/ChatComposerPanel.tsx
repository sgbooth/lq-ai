import { canAttachChatFile } from "@/shared/chat/attachedFiles.ts";
import { ChatEnhancementPanel } from "@/shared/chat/ChatEnhancementPanel.tsx";
import { ChatTrustPanel } from "@/shared/chat/ChatTrustPanel.tsx";
import { useState } from "react";
import { Icon } from "@/shared/Icon.tsx";
import { Badge, Button, Card, FileButton, Group, Stack, Textarea } from "@mantine/core";

import { useChatPanel } from "@/shared/chat/chatPanelContext.ts";
export const ChatComposerPanel = () => {
  const {
    busy,
    text,
    setText,
    setSkills,
    slash,
    suggestions,
    uploading,
    files,
    setFiles,
    actions,
    send,
    uploadFiles,
    sendDisabled,
  } = useChatPanel();
  const [highlight, setHighlight] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const items = suggestions.data?.results ?? [];
  const active = Math.min(highlight, Math.max(0, items.length - 1));
  const open = !!slash && !dismissed && items.length > 0 && !suggestions.loading;
  function pick(slug: string) {
    setSkills((previous) => [...new Set([...previous, slug])]);
    setText("");
    setHighlight(0);
  }
  return (
    <Stack>
      <Group>
        {files.map((f) => (
          <Badge key={f.id} onClick={() => setFiles(files.filter((x) => x.id !== f.id))}>
            {f.filename} ×
          </Badge>
        ))}
      </Group>
      {open && (
        <Card withBorder>
          <Stack gap="xs" id="slash-suggestions" role="listbox" aria-label="Slash commands">
            {items.map((item, index) => (
              <Button
                key={item.slug}
                id={`slash-option-${index}`}
                role="option"
                aria-selected={index === active}
                variant={index === active ? "light" : "subtle"}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => pick(item.slug)}
              >
                {item.slash_alias || item.slug} · {item.title}
              </Button>
            ))}
          </Stack>
        </Card>
      )}
      <Textarea
        label="Message"
        placeholder="Ask a question about your matter…"
        autosize
        minRows={3}
        value={text}
        aria-controls={open ? "slash-suggestions" : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `slash-option-${active}` : undefined}
        onChange={(e) => {
          setText(e.currentTarget.value);
          setHighlight(0);
          setDismissed(false);
        }}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (open && !e.ctrlKey && !e.metaKey) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight(
                (active + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length,
              );
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              pick(items[active].slug);
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setDismissed(true);
              return;
            }
          }
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void send();
          }
        }}
      />
      <Group justify="space-between">
        <FileButton multiple onChange={(incoming) => void uploadFiles(incoming)}>
          {(props) => (
            <Button
              {...props}
              variant="light"
              leftSection={<Icon.Attach />}
              loading={uploading}
              disabled={busy || uploading || !canAttachChatFile(files.length)}
            >
              Attach files
            </Button>
          )}
        </FileButton>
        <Group>
          <ChatEnhancementPanel />
          {busy ? (
            <Button color="red" leftSection={<Icon.Stop />} onClick={() => actions.stop()}>
              Stop
            </Button>
          ) : (
            <Button leftSection={<Icon.Send />} disabled={sendDisabled} onClick={() => void send()}>
              Send
            </Button>
          )}
        </Group>
      </Group>
      <ChatTrustPanel />
    </Stack>
  );
};
