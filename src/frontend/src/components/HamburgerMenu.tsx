import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BanknoteIcon,
  HomeIcon,
  LeafIcon,
  SettingsIcon,
  SproutIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV_ITEMS = [
  { to: "/", labelKey: "nav.home", Icon: HomeIcon },
  { to: "/farm-profile", labelKey: "nav.farm", Icon: SproutIcon },
  { to: "/fields", labelKey: "nav.fields", Icon: LeafIcon },
  { to: "/finance", labelKey: "nav.finance", Icon: BanknoteIcon },
  { to: "/family", labelKey: "nav.family", Icon: UsersIcon },
  { to: "/settings", labelKey: "nav.settings", Icon: SettingsIcon },
] as const;

interface HamburgerMenuProps {
  open: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ open, onClose }: HamburgerMenuProps) {
  const { t } = useTranslation();
  const { location } = useRouterState();
  const pathname = location.pathname;

  return (
    <AnimatePresence>
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.aside
            className="absolute top-0 left-0 h-full w-72 bg-card border-r border-border flex flex-col shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            data-ocid="hamburger_menu.panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <SproutIcon className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display text-lg font-semibold text-foreground">
                  {t("app.name")}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close menu"
                data-ocid="hamburger_menu.close_button"
              >
                <XIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {NAV_ITEMS.map(({ to, labelKey, Icon }, index) => {
                const isActive =
                  pathname === to || (to !== "/" && pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    data-ocid={`hamburger_menu.item.${index + 1}`}
                  >
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                    {t(labelKey)}
                  </Link>
                );
              })}
            </nav>

            {/* Language switcher */}
            <div className="px-4 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                Language
              </p>
              <LanguageSwitcher />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
