import { buildAuthorizeUrl, buildOAuthReturnUrl } from "@/shared/chat/toolGate.ts";
import { groupModels, type ModelEntry } from "@/shared/modelsApi.ts";
import { tierLabel } from "@/shared/inferenceTiers.ts";
import { MessageCard } from "@/shared/MessageCard.tsx";
import { Alert, Button, Card, Group, ScrollArea, Select, Stack, Text } from "@mantine/core";

import { useChatPanel } from "@/shared/chat/chatPanelContext.ts";
export const ChatConversationPanel = () => {
  const {
    chat,
    messages,
    busy,
    error,
    gate,
    model,
    setModel,
    cursor,
    setCursor,
    oauth,
    setOauth,
    end,
    choices,
    actions,
    send,
    resume,
  } = useChatPanel();
  const grouped = choices.data ? groupModels(choices.data.models) : null;
  const option = (m: ModelEntry) => ({
    value: m.id,
    label:
      m.id +
      (m.lq_ai_resolves_to ? ` → ${m.lq_ai_resolves_to}` : "") +
      (m.lq_ai_fallback_count ? ` (+${m.lq_ai_fallback_count} fallbacks)` : "") +
      (m.routed_inference_tier ? ` · ${tierLabel(m.routed_inference_tier)}` : ""),
  });
  const modelOptions = grouped
    ? [
        ...(grouped.aliases.length
          ? [{ group: "Aliases (defaults)", items: grouped.aliases.map(option) }]
          : []),
        ...Array.from(grouped.nativeByProvider, ([group, entries]) => ({
          group,
          items: entries.map(option),
        })),
      ]
    : [];
  return (
    <Stack>
      <Group justify="space-between">
        <Text fw={600}>{chat?.title || "New conversation"}</Text>
        <Select
          aria-label="Model"
          placeholder="Select a model"
          value={model}
          onChange={setModel}
          data={modelOptions}
          searchable
          disabled={busy || choices.loading}
          nothingFoundMessage="No models available"
          error={choices.error || undefined}
        />
      </Group>
      {oauth.status === "connected" && (
        <Alert color="teal" title={"Connected" + (oauth.server ? " to " + oauth.server : "")}>
          <Group>
            <Button
              onClick={() => {
                setOauth({ status: "none", server: null, chatId: null });
                const last = [...messages].reverse().find((m) => m.role === "user");
                if (last) void send(last.content);
              }}
            >
              Continue
            </Button>
            <Button
              variant="subtle"
              onClick={() => setOauth({ status: "none", server: null, chatId: null })}
            >
              Dismiss
            </Button>
          </Group>
        </Alert>
      )}
      {oauth.status === "error" && (
        <Alert
          color="red"
          title="Tool connection failed"
          withCloseButton
          closeButtonLabel="Dismiss"
          onClose={() => setOauth({ status: "none", server: null, chatId: null })}
        >
          {oauth.server ? `Could not connect ${oauth.server}.` : "Could not connect the tool."} Try
          connecting again from the paused message.
        </Alert>
      )}
      {error && (
        <Alert color="red" role="alert">
          {error}
        </Alert>
      )}
      <ScrollArea h={480} type="auto">
        <Stack gap="xs">
          {cursor && (
            <Button
              variant="subtle"
              onClick={() => {
                if (chat) void actions.earlier(chat, cursor).then(setCursor);
              }}
            >
              Load earlier messages
            </Button>
          )}
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              streaming={busy && message === messages.at(-1)}
            />
          ))}
          <div ref={end} />
        </Stack>
      </ScrollArea>
      {gate?.kind === "confirm" && (
        <Card withBorder>
          <Stack>
            <Text fw={600}>Approve tool action: {gate.frame.tool}</Text>
            <Text>{gate.frame.args_summary}</Text>
            <Group>
              <Button disabled={busy} onClick={() => void resume("approve")}>
                Approve
              </Button>
              <Button disabled={busy} color="red" onClick={() => void resume("deny")}>
                Deny
              </Button>
            </Group>
          </Stack>
        </Card>
      )}
      {gate?.kind === "connect" && (
        <Alert title="Connect this tool">
          <Button
            component="a"
            href={buildAuthorizeUrl(
              gate.frame.authorize_url,
              buildOAuthReturnUrl(location.href, chat?.id),
            )}
          >
            Connect {gate.frame.server}
          </Button>
        </Alert>
      )}
    </Stack>
  );
};
