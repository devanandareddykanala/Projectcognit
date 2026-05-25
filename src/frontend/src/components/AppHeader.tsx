import { useRouterState } from "@tanstack/react-router";
import { Bell, Loader2, Menu, X } from "lucide-react";
import type { FarmAlert } from "../hooks/useNotifications";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/farm-profile": "Farm Profile",
  "/farmer-profile": "Farmer Profile",
  "/fields": "Fields",
  "/crops": "Crops",
  "/agronomy": "Agronomy",
  "/operations": "Operations",
  "/equipment": "Equipment",
  "/inputs": "Inputs",
  "/marketing": "Marketing",
  "/finances": "Finances",
  "/finance": "Finance",
  "/family": "Family",
  "/reports": "Reports",
  "/settings": "Settings",
};

interface AppHeaderProps {
  displayFarmName: string;
  cropYear: number;
  cropYears: number[];
  onCropYearChange: (year: number) => void;
  onMenuOpen: () => void;
  /** Notification data from useNotifications hook */
  notifications: FarmAlert[];
  errorCount: number;
  warningCount: number;
  onDismissNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  /** Auth */
  identity:
    | { getPrincipal: () => { toString: () => string } }
    | null
    | undefined;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function AppHeader({
  displayFarmName,
  cropYear,
  cropYears,
  onCropYearChange,
  onMenuOpen,
  notifications,
  errorCount,
  warningCount,
  onDismissNotification,
  onClearAllNotifications,
  identity,
  isLoggingIn,
  onLogin,
  onLogout,
}: AppHeaderProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const currentPage = PAGE_LABELS[pathname] ?? null;

  const renderBadge = () => {
    if (errorCount > 0) {
      return (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {errorCount}
        </span>
      );
    }
    if (warningCount > 0) {
      return (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {warningCount}
        </span>
      );
    }
    if (notifications.length > 0) {
      return (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-blue-400 rounded-full" />
      );
    }
    return null;
  };

  const errorAlerts = notifications.filter((a) => a.type === "error");
  const warningAlerts = notifications.filter((a) => a.type === "warning");
  const infoAlerts = notifications.filter((a) => a.type === "info");

  let globalIdx = 0;
  const renderAlert = (alert: FarmAlert) => {
    const idx = globalIdx++;
    return (
      <div
        key={alert.id}
        className="flex items-start gap-3 px-4 py-3"
        data-ocid={`header.notifications.item.${idx + 1}`}
      >
        <div
          className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
            alert.type === "error"
              ? "bg-red-500"
              : alert.type === "warning"
                ? "bg-amber-500"
                : "bg-blue-500"
          }`}
        />
        <p className="text-xs text-foreground/80 leading-relaxed flex-1">
          {alert.message}
        </p>
        <button
          type="button"
          className="ml-auto flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onDismissNotification(alert.id)}
          data-ocid={`header.notifications.dismiss.${idx + 1}`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — opens HamburgerMenu drawer */}
        <button
          type="button"
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={onMenuOpen}
          aria-label="Open menu"
          data-ocid="header.menu.button"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Kisan Seva brand + breadcrumb */}
        <div className="flex items-center text-sm">
          <span className="font-bold text-primary font-display hidden xs:block text-base">
            Kisan Seva
          </span>
          <span className="text-border mx-1.5 hidden xs:block">/</span>
          <span className="font-semibold text-foreground hidden sm:block">
            {displayFarmName}
          </span>
          {currentPage && (
            <>
              <span className="text-border mx-1.5 hidden sm:block">/</span>
              <span className="text-muted-foreground font-normal hidden sm:block">
                {currentPage}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Language switcher — desktop only */}
        <div className="hidden md:block">
          <LanguageSwitcher />
        </div>

        {/* Notifications Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              data-ocid="header.notifications.button"
            >
              <Bell className="w-4 h-4" />
              {renderBadge()}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-0"
            data-ocid="header.notifications.popover"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Alerts</h3>
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={onClearAllNotifications}
                  data-ocid="header.notifications.clear_button"
                >
                  Clear all
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div
                className="px-4 py-6 text-center"
                data-ocid="header.notifications.empty_state"
              >
                <Bell className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground/70">
                  No alerts right now.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {errorAlerts.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-600/80 bg-red-50/60">
                      Issues
                    </div>
                    {errorAlerts.map(renderAlert)}
                  </>
                )}
                {warningAlerts.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600/80 bg-amber-50/60">
                      Heads Up
                    </div>
                    {warningAlerts.map(renderAlert)}
                  </>
                )}
                {infoAlerts.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                      Updates
                    </div>
                    {infoAlerts.map(renderAlert)}
                  </>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Auth button */}
        {identity ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block font-mono">
              {identity.getPrincipal().toString().slice(0, 5)}...
              {identity.getPrincipal().toString().slice(-3)}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={onLogout}
              data-ocid="header.auth.button"
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={onLogin}
            disabled={isLoggingIn}
            data-ocid="header.auth.button"
          >
            {isLoggingIn ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : null}
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </Button>
        )}

        {/* Crop Year selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground hidden sm:block">
            Crop Year
          </span>
          <Select
            value={String(cropYear)}
            onValueChange={(v) => onCropYearChange(Number(v))}
          >
            <SelectTrigger
              className="w-28 h-8 text-sm"
              data-ocid="header.crop_year.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Years</SelectItem>
              {cropYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
