import { Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2, Wheat } from "lucide-react";
import { useEffect, useState } from "react";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useNotifications } from "../hooks/useNotifications";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { DemoFarmBanner } from "./DemoFarmBanner";
import { HamburgerMenu } from "./HamburgerMenu";
import { OfflineBanner } from "./OfflineBanner";
import { SidebarContent } from "./Sidebar";
import { Button } from "./ui/button";

// OKLCH sidebar design tokens — light theme
const sidebarBg = "oklch(0.97 0.005 150)";

export default function Layout() {
  const {
    farm,
    farmId,
    cropYear,
    setCropYear,
    error,
    needsOnboarding,
    userRole,
    isDemo,
  } = useFarm();
  const { actor: backend } = useActor();
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Redirect to onboarding if needed — no localStorage
  useEffect(() => {
    if (identity && needsOnboarding) {
      navigate({ to: "/onboarding" });
    }
  }, [identity, needsOnboarding, navigate]);

  // Role sync — read from backend and keep in memory only (via FarmContext)
  const [userRoleState, setUserRoleState] = useState<string>(userRole);

  const handleRoleSelect = (role: string) => {
    // Normalize to 3-role system: Admin | Member | ViewOnly
    setUserRoleState(role);
  };

  useEffect(() => {
    if (!backend || !farmId || !identity) return;
    (
      backend as unknown as {
        getFarmRoles: (
          id: bigint,
        ) => Promise<
          { user: { toString: () => string }; role: Record<string, unknown> }[]
        >;
      }
    )
      .getFarmRoles(farmId)
      .then((roles) => {
        const myPrincipal = identity.getPrincipal().toString();
        const myEntry = roles.find((r) => r.user.toString() === myPrincipal);
        if (myEntry) {
          const roleKey = Object.keys(myEntry.role)[0];
          // Map legacy roles to 3-role system
          const normalized =
            roleKey === "owner" || roleKey === "manager"
              ? "Admin"
              : roleKey === "viewer"
                ? "ViewOnly"
                : "Member";
          setUserRoleState(normalized);
          sessionStorage.setItem("ks-session-role", normalized);
        }
      })
      .catch(() => {
        // non-critical — default to Admin
      });
  }, [backend, farmId, identity]);

  // Cleanup sessionStorage on logout
  useEffect(() => {
    if (!identity) {
      sessionStorage.removeItem("ks-session-role");
    }
  }, [identity]);

  // Notifications — data fetching is handled inside the hook
  const {
    notifications,
    dismissNotification,
    clearAllNotifications,
    errorCount,
    warningCount,
  } = useNotifications({
    backend,
    farmId: farmId ?? null,
    cropYear,
  });

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-6">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive text-xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Connection Error
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const cropYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const displayFarmName = farm?.name ?? "Kisan Seva";
  const effectiveRole = userRoleState || userRole;

  return (
    <div className="flex h-screen bg-background" data-ocid="app.section">
      {/* Desktop Sidebar — hidden on mobile, only when authenticated and onboarded */}
      {identity && !needsOnboarding && (
        <aside
          className="hidden md:flex w-60 flex-shrink-0 flex-col border-r border-border"
          style={{ background: sidebarBg }}
          data-ocid="sidebar.panel"
        >
          <SidebarContent
            displayFarmName={displayFarmName}
            userRole={effectiveRole}
            onNavigate={() => setSidebarOpen(false)}
            onRoleSelect={handleRoleSelect}
          />
        </aside>
      )}

      {/* Mobile Hamburger Drawer */}
      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Legacy mobile overlay kept for non-hamburger use */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 border-0 cursor-default"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          />
          <aside
            className="relative z-10 w-60 flex flex-col h-full shadow-xl"
            style={{ background: sidebarBg }}
          >
            <SidebarContent
              displayFarmName={displayFarmName}
              userRole={effectiveRole}
              onNavigate={() => setSidebarOpen(false)}
              onRoleSelect={handleRoleSelect}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Offline banner — fixed at top, shows only when offline */}
        <OfflineBanner />

        <AppHeader
          displayFarmName={displayFarmName}
          cropYear={cropYear}
          cropYears={cropYears}
          onCropYearChange={setCropYear}
          onMenuOpen={() => setMenuOpen(true)}
          notifications={notifications}
          errorCount={errorCount}
          warningCount={warningCount}
          onDismissNotification={dismissNotification}
          onClearAllNotifications={clearAllNotifications}
          identity={identity}
          isLoggingIn={isLoggingIn}
          onLogin={login}
          onLogout={clear}
        />

        {/* Demo Farm Banner — golden, non-dismissible when isDemo */}
        {isDemo && <DemoFarmBanner />}

        {/* Page content — pb-16 on mobile to clear BottomNav */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {!identity ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="text-center max-w-sm px-6 space-y-5">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto"
                  style={{ background: "oklch(0.75 0.14 68)" }}
                >
                  <Wheat
                    className="w-7 h-7"
                    style={{ color: "oklch(0.12 0.03 148)" }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground font-display mb-2">
                    Sign in to Kisan Seva
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Use Internet Identity to securely access your farm data.
                  </p>
                </div>
                <Button
                  onClick={() => login()}
                  disabled={isLoggingIn}
                  className="w-full"
                  data-ocid="auth.signin.primary_button"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isLoggingIn
                    ? "Signing in..."
                    : "Sign In with Internet Identity"}
                </Button>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* Bottom navigation — mobile only, only when authenticated and onboarded */}
        {identity && !needsOnboarding && <BottomNav />}
      </div>
    </div>
  );
}
