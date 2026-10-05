import { Icon } from "@/shared/Icon.tsx";
import { ActionIcon, Menu, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";

const colorSchemes = [
  { value: "light", label: "Light", symbol: Icon.Light },
  { value: "dark", label: "Dark", symbol: Icon.Dark },
  { value: "auto", label: "System", symbol: Icon.System },
] as const;

export const ColorSchemeMenu = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("light");
  const Symbol = computed === "dark" ? Icon.Dark : Icon.Light;
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label="Change color scheme">
          <Symbol />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Appearance</Menu.Label>
        {colorSchemes.map(({ value, label, symbol: OptionIcon }) => (
          <Menu.Item
            key={value}
            leftSection={<OptionIcon />}
            rightSection={colorScheme === value ? <Icon.Check size={14} /> : undefined}
            aria-current={colorScheme === value ? "true" : undefined}
            onClick={() => setColorScheme(value)}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
