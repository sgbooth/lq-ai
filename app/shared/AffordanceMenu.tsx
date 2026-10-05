import { Icon } from "@/shared/Icon.tsx";
import { ActionIcon, Box, Group, Menu } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type React from "react";
import { useState } from "react";

export interface AffordanceOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
}

interface Props {
  label: string;
  options: AffordanceOption[];
  children: React.ReactNode;
  disabled?: boolean;
}

export const AffordanceMenu: React.FC<Props> = ({ label, options, children, disabled }) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [opened, setOpened] = useState(false);
  const touch = useMediaQuery("(hover: none)");
  const visible = hovered || focused || opened || touch;
  return (
    <Group
      gap={4}
      wrap="nowrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <Box flex={1} miw={0}>
        {children}
      </Box>
      <Box w={28} h={28}>
        {visible && (
          <Menu position="bottom-end" withinPortal opened={opened} onChange={setOpened}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label={label} disabled={disabled}>
                <Icon.More />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {options.map((option) => (
                <Menu.Item
                  key={option.id}
                  leftSection={option.icon}
                  disabled={disabled || option.disabled}
                  color={option.color}
                  onClick={option.onClick}
                >
                  {option.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}
      </Box>
    </Group>
  );
};
