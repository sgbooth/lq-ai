import * as chatsApi from "@/shared/chat/chatApi.ts";
import { AffordanceMenu } from "@/shared/AffordanceMenu.tsx";
import { ConfirmButton } from "@/shared/ConfirmButton.tsx";
import { Icon } from "@/shared/Icon.tsx";
import { ResourcePanel } from "@/shared/ResourcePanel.tsx";
import { Alert, Button, Checkbox, ScrollArea, Stack, TextInput } from "@mantine/core";

import { useChatPanel } from "@/shared/chat/chatPanelContext.ts";
export const ChatHistoryPanel = () => {
  const {
    projectId,
    initialSkills,
    chat,
    busy,
    setSkills,
    setModel,
    setSticky,
    uploadScope,
    setUploading,
    setFiles,
    search,
    setSearch,
    searchResults,
    archived,
    setArchived,
    setCursor,
    navigate,
    list,
    actions,
    select,
  } = useChatPanel();
  return (
    <Stack>
      <Button
        leftSection={<Icon.Add />}
        disabled={busy}
        onClick={() => {
          actions.reset();
          setModel(null);
          uploadScope.current.abort();
          uploadScope.current = new AbortController();
          setUploading(false);
          setFiles([]);
          setSkills(initialSkills ?? []);
          setSticky(false);
          setCursor(null);
        }}
      >
        New chat
      </Button>
      <TextInput
        leftSection={<Icon.Search />}
        placeholder="Filter chats"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <Checkbox
        label="Include archived conversations"
        checked={archived}
        onChange={(e) => setArchived(e.currentTarget.checked)}
      />
      <ResourcePanel loading={searchResults.loading && !!search.trim()} error={searchResults.error}>
        {search.trim() &&
          searchResults.data?.items
            .filter((hit) => !projectId || list.data?.some((c) => c.id === hit.chat_id))
            .map((hit) => (
              <Button
                key={hit.chat_id}
                variant="light"
                onClick={() => {
                  if (projectId) void select(hit.chat_id);
                  else navigate(`/chats?id=${hit.chat_id}`);
                }}
              >
                {hit.title} · {hit.snippet}
              </Button>
            ))}
      </ResourcePanel>
      {list.error && <Alert color="red">{list.error}</Alert>}
      <ScrollArea h={480}>
        <Stack gap="xs">
          {list.data
            ?.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
            .map((c) => (
              <ConfirmButton
                key={c.id}
                label="Archive"
                disabled={busy}
                description="Archive this chat?"
                onConfirm={async () => {
                  await chatsApi.archiveChat(c.id);
                  list.reload();
                  if (c.id === chat?.id) actions.reset();
                }}
                renderTrigger={(open) => {
                  const options = [
                    { id: "archive", label: "Archive", icon: <Icon.Archive />, onClick: open },
                  ];
                  return (
                    <AffordanceMenu
                      label={`Actions for ${c.title}`}
                      disabled={busy}
                      options={options}
                    >
                      <Button
                        variant={c.id === chat?.id ? "light" : "subtle"}
                        fullWidth
                        onClick={() => {
                          if (projectId) void select(c.id);
                          else navigate(`/chats?id=${c.id}`);
                        }}
                      >
                        {c.title}
                      </Button>
                    </AffordanceMenu>
                  );
                }}
              />
            ))}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};
