import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BanknoteIcon,
  HomeIcon,
  LeafIcon,
  MoreHorizontalIcon,
  UsersIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const NAV_ITEMS = [
  { to: "/", labelKey: "nav.home", Icon: HomeIcon, ocid: "bottom_nav.home" },
  {
    to: "/farm-profile",
    labelKey: "nav.farm",
    Icon: LeafIcon,
    ocid: "bottom_nav.farm",
  },
  {
    to: "/finance",
    labelKey: "nav.finance",
    Icon: BanknoteIcon,
    ocid: "bottom_nav.finance",
  },
  {
    to: "/family",
    labelKey: "nav.family",
    Icon: UsersIcon,
    ocid: "bottom_nav.family",
  },
  {
    to: "/settings",
    labelKey: "nav.more",
    Icon: MoreHorizontalIcon,
    ocid: "bottom_nav.more",
  },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const { location } = useRouterState();
  const pathname = location.pathname;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      data-ocid="bottom_nav.panel"
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, labelKey, Icon, ocid }) => {
          const isActive =
            pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150 min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-ocid={ocid}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive && "drop-shadow-sm",
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="truncate max-w-full px-0.5">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
