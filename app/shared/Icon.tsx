import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconCheck,
  IconDots,
  IconArchive,
  IconAlertCircle,
  IconArrowRight,
  IconBookmark,
  IconBooks,
  IconCopy,
  IconDownload,
  IconFolders,
  IconHome,
  IconListCheck,
  IconLock,
  IconLogout,
  IconMail,
  IconMenu2,
  IconMessage,
  IconPaperclip,
  IconPlayerStop,
  IconPlus,
  IconRobot,
  IconScale,
  IconSchool,
  IconSearch,
  IconSend,
  IconSettings,
  IconShield,
  IconTable,
  IconTools,
  IconTrash,
  type IconProps,
} from "@tabler/icons-react";
import type React from "react";
type Props = Omit<IconProps, "ref">;
export const Continue: React.FC<Props> = (props) => (
  <IconArrowRight size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Password: React.FC<Props> = (props) => (
  <IconLock size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Email: React.FC<Props> = (props) => (
  <IconMail size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Logout: React.FC<Props> = (props) => (
  <IconLogout size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Error: React.FC<Props> = (props) => (
  <IconAlertCircle size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Legal: React.FC<Props> = (props) => (
  <IconScale size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Home: React.FC<Props> = (props) => (
  <IconHome size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Chat: React.FC<Props> = (props) => (
  <IconMessage size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Matters: React.FC<Props> = (props) => (
  <IconFolders size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Skills: React.FC<Props> = (props) => (
  <IconTools size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Knowledge: React.FC<Props> = (props) => (
  <IconBooks size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Playbooks: React.FC<Props> = (props) => (
  <IconListCheck size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Table: React.FC<Props> = (props) => (
  <IconTable size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Prompts: React.FC<Props> = (props) => (
  <IconBookmark size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Learn: React.FC<Props> = (props) => (
  <IconSchool size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Autonomous: React.FC<Props> = (props) => (
  <IconRobot size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Admin: React.FC<Props> = (props) => (
  <IconShield size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Settings: React.FC<Props> = (props) => (
  <IconSettings size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Add: React.FC<Props> = (props) => (
  <IconPlus size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Delete: React.FC<Props> = (props) => (
  <IconTrash size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Attach: React.FC<Props> = (props) => (
  <IconPaperclip size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Send: React.FC<Props> = (props) => (
  <IconSend size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Stop: React.FC<Props> = (props) => (
  <IconPlayerStop size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Copy: React.FC<Props> = (props) => (
  <IconCopy size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Download: React.FC<Props> = (props) => (
  <IconDownload size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Search: React.FC<Props> = (props) => (
  <IconSearch size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Menu: React.FC<Props> = (props) => (
  <IconMenu2 size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const More: React.FC<Props> = (props) => (
  <IconDots size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Archive: React.FC<Props> = (props) => (
  <IconArchive size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Light: React.FC<Props> = (props) => (
  <IconSun size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Dark: React.FC<Props> = (props) => (
  <IconMoon size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const System: React.FC<Props> = (props) => (
  <IconDeviceDesktop size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Check: React.FC<Props> = (props) => (
  <IconCheck size={18} stroke={1.7} {...props} aria-hidden="true" />
);
export const Icon = {
  Light,
  Dark,
  System,
  Check,
  More,
  Archive,
  Home,
  Chat,
  Matters,
  Skills,
  Knowledge,
  Playbooks,
  Table,
  Prompts,
  Learn,
  Autonomous,
  Admin,
  Settings,
  Add,
  Delete,
  Attach,
  Send,
  Stop,
  Copy,
  Download,
  Search,
  Menu,
  Continue,
  Password,
  Email,
  Logout,
  Error,
  Legal,
};
