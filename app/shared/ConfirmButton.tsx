import { useAction } from "@/hooks/useAction.ts";
import { ActionFeedback } from "@/shared/ActionFeedback.tsx";
import { Button, Group, Modal, Text } from "@mantine/core";
import type React from "react";
import { useState } from "react";
interface Props {
  label: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  color?: string;
  disabled?: boolean;
  renderTrigger?: (open: () => void) => React.ReactNode;
}
export const ConfirmButton: React.FC<Props> = ({
  label,
  description,
  onConfirm,
  color = "red",
  disabled,
  renderTrigger,
}) => {
  const [opened, setOpened] = useState(false);
  const action = useAction();
  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpened(true))
      ) : (
        <Button
          variant="light"
          color={color}
          size="xs"
          disabled={disabled}
          onClick={() => setOpened(true)}
        >
          {label}
        </Button>
      )}
      <Modal opened={opened} onClose={() => !action.busy && setOpened(false)} title={label}>
        <Text>{description}</Text>
        <ActionFeedback error={action.error} />
        <Group justify="flex-end" mt="lg">
          <Button variant="default" disabled={action.busy} onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button
            color={color}
            loading={action.busy}
            onClick={() => {
              void action.run(onConfirm).then((ok) => {
                if (ok) setOpened(false);
              });
            }}
          >
            {label}
          </Button>
        </Group>
      </Modal>
    </>
  );
};
