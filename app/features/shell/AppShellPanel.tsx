import { logout, syncCurrentUser } from "@/auth/authApi.ts";
import { userAtom } from "@/auth/authAtoms.ts";
import { loadSettingsAtom } from "@/features/settings/settingsAtoms.ts";
import { useSessionActivity } from "@/hooks/useSessionActivity.ts";
import { ColorSchemeMenu } from "@/shared/ColorSchemeMenu.tsx";
import { TrustIndicatorPanel } from "@/shared/TrustIndicatorPanel.tsx";
import { Brand } from "@/shared/Brand.tsx";
import { BrandFooterPanel } from "@/shared/BrandFooterPanel.tsx";
import { Icon } from "@/shared/Icon.tsx";
import {
  ActionIcon,
  Tooltip,
  Menu,
  Alert,
  AppShell,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useAtomValue, useSetAtom } from "jotai";
import type React from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const settingsLinks = [
  ["Account", "account"],
  ["Appearance", "appearance"],
  ["Autonomous", "autonomous"],
];

interface Props {
  children: React.ReactNode;
}
const links = [
  ["Home", "/", Icon.Home],
  ["Chats", "/chats", Icon.Chat],
  ["Matters", "/matters", Icon.Matters],
  ["Skills", "/skills", Icon.Skills],
  ["Knowledge", "/knowledge", Icon.Knowledge],
  ["Playbooks", "/playbooks", Icon.Playbooks],
  ["Tabular review", "/tabular", Icon.Table],
  ["Saved prompts", "/saved-prompts", Icon.Prompts],
  ["Autonomous", "/autonomous", Icon.Autonomous],
  ["Learn", "/learn", Icon.Learn],
] as const;
const adminLinks = [
  ["Provider keys", "provider-keys"],
  ["Research sources", "research-sources"],
  ["Models", "models"],
  ["Audit log", "audit-log"],
  ["Users & developer", "developer"],
  ["Intake bridges", "intake-bridges"],
  ["Word add-in", "word-addin"],
];
export const AppShellPanel: React.FC<Props> = ({ children }) => {
  const [accountError, setAccountError] = useState("");
  const activity = useSessionActivity();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const mobile = useMediaQuery("(max-width: 47.99em)");
  const compact = !desktopOpened && !mobile;
  const [path] = useLocation();
  const user = useAtomValue(userAtom);
  const load = useSetAtom(loadSettingsAtom);
  useEffect(() => {
    void Promise.all([load(), syncCurrentUser()]).catch((e) =>
      setAccountError(e instanceof Error ? e.message : "Unable to load account settings."),
    );
  }, [load]);
  useEffect(() => {
    close();
  }, [path, close]);
  const admin = user?.role === "admin" || user?.is_admin;
  return (
    <AppShell
      header={{ height: 68 }}
      navbar={{
        width: { base: 248, sm: desktopOpened ? 248 : 64 },
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding={0}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
              aria-expanded={opened}
              aria-controls="primary-navigation"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
              aria-label={desktopOpened ? "Collapse navigation to icons" : "Expand navigation"}
              aria-expanded={desktopOpened}
              aria-controls="primary-navigation"
            />
            <Brand compact />
          </Group>
          <Group gap="sm">
            <TrustIndicatorPanel />
            <ColorSchemeMenu />
            <Text size="sm" visibleFrom="sm">
              {user?.email}
            </Text>
            <Button
              size="xs"
              variant="subtle"
              leftSection={<Icon.Logout size={16} />}
              onClick={() => void logout().catch(() => {})}
            >
              Sign out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar id="primary-navigation">
        <ScrollArea h="100%">
          {compact ? (
            <Stack gap="xs" p="xs" align="center">
              {links.map(([label, href, Symbol]) => {
                const active =
                  href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
                return (
                  <Tooltip key={href} label={label} position="right" withArrow>
                    <ActionIcon
                      component={Link}
                      href={href}
                      size="lg"
                      variant={active ? "light" : "subtle"}
                      aria-label={label}
                      aria-current={active ? "page" : undefined}
                    >
                      <Symbol size={19} />
                    </ActionIcon>
                  </Tooltip>
                );
              })}
              <Divider w="100%" />
              <Menu position="right-start" withinPortal>
                <Menu.Target>
                  <ActionIcon
                    size="lg"
                    variant={path.startsWith("/settings") ? "light" : "subtle"}
                    aria-label="Settings"
                  >
                    <Icon.Settings size={19} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Settings</Menu.Label>
                  {settingsLinks.map(([label, slug]) => (
                    <Menu.Item key={slug} component={Link} href={"/settings/" + slug}>
                      {label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
              <Tooltip label="Trust & privacy" position="right" withArrow>
                <ActionIcon
                  component={Link}
                  href="/trust"
                  size="lg"
                  variant={path === "/trust" ? "light" : "subtle"}
                  aria-label="Trust & privacy"
                >
                  <Icon.Legal size={19} />
                </ActionIcon>
              </Tooltip>
              {admin && (
                <Menu position="right-start" withinPortal>
                  <Menu.Target>
                    <ActionIcon
                      size="lg"
                      variant={path.startsWith("/admin") ? "light" : "subtle"}
                      aria-label="Administration"
                    >
                      <Icon.Admin size={19} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Administration</Menu.Label>
                    {adminLinks.map(([label, slug]) => (
                      <Menu.Item key={slug} component={Link} href={"/admin/" + slug}>
                        {label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              )}
            </Stack>
          ) : (
            <Stack gap={0} p="sm">
              {links.map(([label, href, Symbol]) => (
                <NavLink
                  key={href}
                  component={Link}
                  href={href}
                  label={label}
                  leftSection={<Symbol size={19} />}
                  active={
                    href === "/" ? path === "/" : path === href || path.startsWith(href + "/")
                  }
                />
              ))}
              <Divider my="sm" />
              <NavLink
                label="Settings"
                leftSection={<Icon.Settings size={19} />}
                defaultOpened={path.startsWith("/settings")}
              >
                {settingsLinks.map(([label, slug]) => (
                  <NavLink
                    key={slug}
                    component={Link}
                    href={"/settings/" + slug}
                    label={label}
                    active={path === "/settings/" + slug}
                  />
                ))}
              </NavLink>
              <NavLink
                component={Link}
                href="/trust"
                label="Trust & privacy"
                leftSection={<Icon.Legal size={19} />}
                active={path === "/trust"}
              />
              {admin && (
                <>
                  <Divider my="sm" />
                  <NavLink
                    label="Administration"
                    leftSection={<Icon.Admin size={19} />}
                    defaultOpened={path.startsWith("/admin")}
                  >
                    {adminLinks.map(([label, slug]) => (
                      <NavLink
                        key={slug}
                        component={Link}
                        href={"/admin/" + slug}
                        label={label}
                        active={path === "/admin/" + slug}
                      />
                    ))}
                  </NavLink>
                </>
              )}
            </Stack>
          )}
        </ScrollArea>
      </AppShell.Navbar>
      <AppShell.Main>
        {accountError && (
          <Alert color="orange" m="md" title="Account settings unavailable">
            {accountError}
          </Alert>
        )}
        {activity.warning && (
          <Alert color="orange" m="md" title="Session expires in 5 minutes">
            <Stack>
              <Text>You have been idle for 25 minutes.</Text>
              <Button onClick={activity.noteActivity}>Continue working</Button>
            </Stack>
          </Alert>
        )}
        {children}
        <BrandFooterPanel />
      </AppShell.Main>
    </AppShell>
  );
};
