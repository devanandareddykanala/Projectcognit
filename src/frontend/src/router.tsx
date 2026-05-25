import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import AddCropSeasonPage from "./pages/AddCropSeasonPage";
import AddFieldPage from "./pages/AddFieldPage";
import Agronomy from "./pages/Agronomy";
import CropPlanningPage from "./pages/CropPlanningPage";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import FamilyPage from "./pages/FamilyPage";
import FarmProfilePage from "./pages/FarmProfilePage";
import FarmerProfilePage from "./pages/FarmerProfilePage";
import FieldDetailPage from "./pages/FieldDetailPage";
import FieldListPage from "./pages/FieldListPage";
import Fields from "./pages/Fields";
import Finances from "./pages/Finances";
import HarvestLogPage from "./pages/HarvestLogPage";
import Inputs from "./pages/Inputs";
import JoinFarmPage from "./pages/JoinFarmPage";
import LandingPage from "./pages/LandingPage";
import Marketing from "./pages/Marketing";
import Onboarding from "./pages/Onboarding";
import Operations from "./pages/Operations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SharedReport from "./pages/SharedReport";

/**
 * 3-role system for Kisan Seva:
 *   Admin    → full access
 *   Member   → no family management
 *   ViewOnly → read-only: no fields edit, crops edit, family, finance edit
 *
 * Role is stored in-memory (FarmContext). For route guards we read a
 * session-level signal set by Layout after backend role fetch.
 */
const BLOCKED_ROUTES: Record<string, string[]> = {
  ViewOnly: ["/family", "/crops", "/fields"],
  Member: ["/family"],
  Admin: [],
};

// Session-level role signal written by Layout.tsx after backend fetch
// Using sessionStorage (not localStorage) for role guard in route beforeLoad
function getSessionRole(): string {
  return sessionStorage.getItem("ks-session-role") ?? "";
}

function guardRoute(path: string) {
  return {
    beforeLoad: () => {
      const role = getSessionRole();
      if (!role) {
        throw redirect({ to: "/" });
      }
      const blocked = BLOCKED_ROUTES[role] ?? [];
      if (blocked.includes(path)) {
        throw redirect({ to: "/dashboard" });
      }
    },
  };
}

const rootRoute = createRootRoute({
  component: Outlet,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
  beforeLoad: () => {
    const role = getSessionRole();
    if (role) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: Onboarding,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Layout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/dashboard",
  component: Dashboard,
});

const fieldsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/fields",
  component: FieldListPage,
  ...guardRoute("/fields"),
});

const addFieldRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/fields/add",
  component: AddFieldPage,
  ...guardRoute("/fields"),
});

const fieldDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/fields/$fieldId",
  component: FieldDetailPage,
});

const agronomyRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/agronomy",
  component: Agronomy,
  ...guardRoute("/agronomy"),
});

const operationsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/operations",
  component: Operations,
  ...guardRoute("/operations"),
});

const equipmentRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/equipment",
  component: Equipment,
  ...guardRoute("/equipment"),
});

const inputsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/inputs",
  component: Inputs,
  ...guardRoute("/inputs"),
});

const marketingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/marketing",
  component: Marketing,
  ...guardRoute("/marketing"),
});

const financesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/finances",
  component: Finances,
  ...guardRoute("/finances"),
});

const reportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reports",
  component: Reports,
  ...guardRoute("/reports"),
});

const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  component: Settings,
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/share/$token",
  component: SharedReport,
});

// ── Kisan Seva routes (Phase 1A) ─────────────────────────────────────────────
// Farm profile — /farm-profile
const farmProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/farm-profile",
  component: FarmProfilePage,
});

// Farmer profile — /farmer-profile
const farmerProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/farmer-profile",
  component: FarmerProfilePage,
});

// Crops planning — /crops
const cropsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crops",
  component: CropPlanningPage,
  ...guardRoute("/crops"),
});

// Add crop season — /crops/add
const addCropSeasonRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crops/add",
  component: AddCropSeasonPage,
  ...guardRoute("/crops"),
});

// Harvest log — /crops/$cropSeasonId/harvest
const harvestLogRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/crops/$cropSeasonId/harvest",
  component: HarvestLogPage,
  ...guardRoute("/crops"),
});

// Finance — /finance (Kisan Seva name)
const financeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/finance",
  component: Finances,
  ...guardRoute("/finance"),
});

// Family management — /family
const familyRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/family",
  component: FamilyPage, // placeholder: MemberListPage will replace this
  ...guardRoute("/family"),
});

// Join farm via invite code — /join/:code
const joinFarmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/join/$code",
  component: JoinFarmPage, // placeholder: JoinFarmPage will replace this
});

// Demo shortcut — /demo redirects to dashboard with demo flag
const demoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo",
  beforeLoad: () => {
    // Signal demo intent via sessionStorage; FarmContext + Layout will handle the rest
    sessionStorage.setItem("ks-load-demo", "1");
    throw redirect({ to: "/dashboard" });
  },
  component: Dashboard,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  onboardingRoute,
  joinFarmRoute,
  demoRoute,
  shareRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    fieldsRoute,
    addFieldRoute,
    fieldDetailRoute,
    agronomyRoute,
    operationsRoute,
    equipmentRoute,
    inputsRoute,
    marketingRoute,
    financesRoute,
    financeRoute,
    reportsRoute,
    settingsRoute,
    farmProfileRoute,
    farmerProfileRoute,
    cropsRoute,
    addCropSeasonRoute,
    harvestLogRoute,
    familyRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
