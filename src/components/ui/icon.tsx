import {
  Activity,
  ClipboardList,
  Languages,
  LayoutGrid,
  Mail,
  MailOpen,
  Monitor,
  Moon,
  MoonStar,
  PackageSearch,
  Settings,
  Store,
  Sun,
  UserCircle2,
} from "lucide-react";

/**
 * Icon registry keyed by name.
 *
 * Server components cannot pass component references across the RSC boundary,
 * so client components that accept icons take a name from this registry
 * instead of a component.
 */
const ICONS = {
  activity: Activity,
  clipboard: ClipboardList,
  languages: Languages,
  layoutGrid: LayoutGrid,
  mail: Mail,
  mailOpen: MailOpen,
  monitor: Monitor,
  moon: Moon,
  moonStar: MoonStar,
  packageSearch: PackageSearch,
  settings: Settings,
  store: Store,
  sun: Sun,
  user: UserCircle2,
} as const;

export type IconName = keyof typeof ICONS;

export function AppIcon({ name, className }: { name: IconName; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className ?? "h-4 w-4"} />;
}