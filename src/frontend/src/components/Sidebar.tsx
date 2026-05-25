import { Link, useRouterState } from "@tanstack/react-router";
import {
  BanknoteIcon,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  LeafIcon,
  Lock,
  MapPin,
  Pencil,
  Settings,
  SproutIcon,
  UserCircle,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Kisan Seva navigation — 6 core modules
const navItems = [
  { to: "/farm-profile", icon: SproutIcon, label: "Farm" },
  { to: "/fields", icon: MapPin, label: "Fields" },
  { to: "/crops", icon: LeafIcon, label: "Crops" },
  { to: "/finance", icon: BanknoteIcon, label: "Finance" },
  { to: "/family", icon: UsersIcon, label: "Family" },
] as const;

// OKLCH sidebar design tokens — light theme
const sidebarBorder = "oklch(0.88 0.018 150)";
const sidebarAccent = "oklch(0.91 0.02 150)";
const sidebarFg = "oklch(0.2 0.02 145)";
const sidebarInactive = "oklch(0.45 0.03 145)";
const sidebarAmber = "oklch(0.62 0.13 68)";

// 3-role system: Admin, Member, ViewOnly
// ViewOnly cannot access write routes
const DIMMED_ROUTES: Record<string, string[]> = {
  ViewOnly: ["/fields", "/crops", "/family", "/finance"],
  Member: ["/family"],
  Admin: [],
};

interface SidebarProps {
  displayFarmName: string;
  userRole: string;
  onNavigate: () => void;
  onRoleSelect: (role: string) => void;
}

export function SidebarContent({
  displayFarmName,
  userRole,
  onNavigate,
  onRoleSelect,
}: SidebarProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const dimmedRoutes = DIMMED_ROUTES[userRole] ?? [];
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const handleRoleSelect = (role: string) => {
    onRoleSelect(role);
    setRolePickerOpen(false);
  };

  return (
    <>
      {/* Logo / brand */}
      <div
        className="h-14 flex items-center px-4 border-b"
        style={{ borderColor: sidebarBorder }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: sidebarAmber }}
          >
            <SproutIcon
              className="w-4 h-4"
              style={{ color: "oklch(0.98 0.005 80)" }}
            />
          </div>
          <div>
            <div
              className="font-bold text-sm tracking-tight font-display"
              style={{ color: sidebarFg }}
            >
              Kisan Seva
            </div>
            <div
              className="text-xs truncate max-w-[140px]"
              style={{ color: sidebarInactive }}
            >
              {displayFarmName}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        <TooltipProvider delayDuration={300}>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isDimmed = dimmedRoutes.includes(to);
            const isActive = pathname === to || pathname.startsWith(`${to}/`);
            const linkEl = (
              <Link
                key={to}
                to={to}
                data-ocid={`nav.${label.toLowerCase()}.link`}
                onClick={() => !isDimmed && onNavigate()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  paddingTop: "0.5rem",
                  paddingBottom: "0.5rem",
                  paddingLeft: "0.625rem",
                  paddingRight: "0.75rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  position: "relative",
                  color: isActive ? sidebarAmber : sidebarInactive,
                  background: isActive ? sidebarAccent : "transparent",
                  opacity: isDimmed ? 0.4 : 1,
                  pointerEvents: isDimmed ? "none" : "auto",
                  transition: "color 0.15s ease, background-color 0.15s ease",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: "2px",
                    borderRadius: "1px",
                    background: sidebarAmber,
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.15s ease",
                  }}
                />
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {isDimmed && <Lock className="w-3 h-3 ml-auto flex-shrink-0" />}
              </Link>
            );

            if (isDimmed) {
              return (
                <Tooltip key={to}>
                  <TooltipTrigger asChild>
                    <span className="block">{linkEl}</span>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Read-only for your role</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkEl;
          })}
        </TooltipProvider>
      </nav>

      {/* Footer: Dashboard + Settings + Role Picker */}
      <div
        className="p-3 border-t space-y-1"
        style={{ borderColor: sidebarBorder }}
      >
        {/* Dashboard shortcut */}
        {(() => {
          const isDashActive = pathname === "/dashboard";
          return (
            <Link
              to="/dashboard"
              data-ocid="nav.dashboard.link"
              onClick={() => onNavigate()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                paddingLeft: "0.625rem",
                paddingRight: "0.75rem",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                position: "relative",
                color: isDashActive ? sidebarAmber : sidebarInactive,
                background: isDashActive ? sidebarAccent : "transparent",
                transition: "color 0.15s ease, background-color 0.15s ease",
              }}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          );
        })()}

        {/* Settings */}
        {(() => {
          const isSettingsActive = pathname === "/settings";
          return (
            <Link
              to="/settings"
              data-ocid="nav.settings.link"
              onClick={() => onNavigate()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                paddingLeft: "0.625rem",
                paddingRight: "0.75rem",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                position: "relative",
                color: isSettingsActive ? sidebarAmber : sidebarInactive,
                background: isSettingsActive ? sidebarAccent : "transparent",
                transition: "color 0.15s ease, background-color 0.15s ease",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  top: "20%",
                  bottom: "20%",
                  width: "2px",
                  borderRadius: "1px",
                  background: sidebarAmber,
                  opacity: isSettingsActive ? 1 : 0,
                  transition: "opacity 0.15s ease",
                }}
              />
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          );
        })()}

        {/* Role Picker */}
        <div className="px-1" data-ocid="sidebar.role.panel">
          {userRole ? (
            <button
              type="button"
              className="w-full flex items-center justify-between px-2 py-1.5 rounded text-left hover:opacity-80 transition-opacity"
              style={{ color: sidebarInactive }}
              onClick={() => setRolePickerOpen((o) => !o)}
              data-ocid="sidebar.role.edit_button"
            >
              <div className="flex items-center gap-2 text-xs">
                <UserCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="capitalize">
                  {userRole === "ViewOnly" ? "View Only" : userRole}
                </span>
              </div>
              <Pencil className="w-3 h-3 flex-shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:opacity-80 transition-opacity"
              style={{ color: sidebarInactive }}
              onClick={() => setRolePickerOpen((o) => !o)}
              data-ocid="sidebar.role.open_modal_button"
            >
              <UserCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs">Set your role</span>
              {rolePickerOpen ? (
                <ChevronUp className="w-3 h-3 ml-auto" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-auto" />
              )}
            </button>
          )}

          <div
            className={
              rolePickerOpen
                ? "mt-1 rounded-lg border p-2 space-y-0.5 opacity-100 pointer-events-auto transition-opacity duration-200 ease"
                : "mt-1 rounded-lg border p-2 space-y-0.5 opacity-0 pointer-events-none h-0 overflow-hidden transition-opacity duration-200 ease"
            }
            style={{ background: sidebarAccent, borderColor: sidebarBorder }}
            data-ocid="sidebar.role.options.panel"
          >
            {(["Admin", "Member", "ViewOnly"] as const).map((role) => (
              <button
                key={role}
                type="button"
                className="w-full text-left px-2 py-1.5 rounded text-xs transition-opacity hover:opacity-90 flex items-center justify-between"
                style={{
                  color: userRole === role ? sidebarAmber : sidebarInactive,
                  background:
                    userRole === role ? "rgba(212,165,83,0.12)" : "transparent",
                }}
                onClick={() => handleRoleSelect(role)}
                data-ocid={`sidebar.role.${role.toLowerCase()}.toggle`}
              >
                {role === "ViewOnly" ? "View Only" : role}
                {userRole === role && <span className="text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export { DIMMED_ROUTES };
