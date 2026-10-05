import { MessageEvidencePanel } from "@/shared/MessageEvidencePanel.tsx";
import type { Message } from "@/shared/types.ts";
import { Button, Popover, ScrollArea } from "@mantine/core";
import type React from "react";
import { useState } from "react";

interface Props {
  message: Message;
}

/** Click/keyboard-opened evidence for one assistant turn; panels load only while open. */
export const MessageEvidencePopover: React.FC<Props> = ({ message }) => {
  const [opened, setOpened] = useState(false);
  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      width="min(420px, calc(100vw - 32px))"
      shadow="md"
      withArrow
      withinPortal
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <Button
          size="compact-xs"
          variant="subtle"
          aria-haspopup="dialog"
          aria-expanded={opened}
          onClick={() => setOpened((value) => !value)}
        >
          Sources &amp; receipt
        </Button>
      </Popover.Target>
      <Popover.Dropdown p="sm" aria-label="Sources & receipt">
        <ScrollArea.Autosize mah="min(420px, 60vh)" type="auto">
          {opened && <MessageEvidencePanel message={message} />}
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
};
