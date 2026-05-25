import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Farm } from "../backend.d.ts";
import { useActor } from "../hooks/useActor";

// Crop year stored in IndexedDB via lib/db.ts — but for a simple numeric
// preference we keep it in-memory with a session-only fallback since IndexedDB
// is async. The important rule: NO localStorage anywhere in this file.
const CROP_YEAR_SESSION_KEY = "kisan-seva-crop-year"; // sessionStorage only

type FarmUpdates = Partial<{
  name: string;
  state: string;
  district: string;
  mandal: string;
  village: string;
  surveyNumber: string;
  totalAreaSqm: number;
  ownershipType: string;
  purposes: string[];
}>;

interface FarmContextType {
  farm: Farm | null;
  farmId: bigint | null;
  cropYear: number;
  setCropYear: (y: number) => void;
  loading: boolean;
  refetch: () => void;
  error: string | null;
  updateFarm: (updates: FarmUpdates) => Promise<boolean>;
  needsOnboarding: boolean;
  createFarmFromOnboarding: (
    name: string,
    state: string,
    district: string,
    mandal: string,
    village: string,
    totalAreaSqm: number,
  ) => Promise<Farm | null>;
  /** Current user role in memory only: 'Admin' | 'Member' | 'ViewOnly' */
  userRole: string;
  /** Convenience flags for 3-role system */
  isAdmin: boolean;
  isMember: boolean;
  isViewOnly: boolean;
  /** True when demo farm is active */
  isDemo: boolean;
  loadDemoFarm: () => Promise<void>;
  clearDemoFarm: () => void;
}

const FarmContext = createContext<FarmContextType>({
  farm: null,
  farmId: null,
  cropYear: new Date().getFullYear(),
  setCropYear: () => {},
  loading: true,
  refetch: () => {},
  error: null,
  updateFarm: async () => false,
  needsOnboarding: false,
  createFarmFromOnboarding: async () => null,
  userRole: "",
  isAdmin: false,
  isMember: false,
  isViewOnly: false,
  isDemo: false,
  loadDemoFarm: async () => {},
  clearDemoFarm: () => {},
});

export function FarmProvider({ children }: { children: ReactNode }) {
  const { actor: backend, isFetching: actorFetching } = useActor();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const yearWasAdvanced = useRef(false);
  const [cropYear, _setCropYear] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    // Use sessionStorage only (not localStorage) for crop year preference
    const stored = sessionStorage.getItem(CROP_YEAR_SESSION_KEY);
    if (stored) {
      const storedYear = Number.parseInt(stored, 10);
      if (storedYear < currentYear - 1) {
        sessionStorage.setItem(CROP_YEAR_SESSION_KEY, String(currentYear));
        yearWasAdvanced.current = true;
        return currentYear;
      }
      return storedYear;
    }
    return currentYear;
  });
  const [error, setError] = useState<string | null>(null);
  const refetchRef = useRef<() => void>(() => {});

  // Role state — in-memory only, fetched from backend. Never persisted to storage.
  const [userRole, setUserRoleState] = useState<string>("");

  // Demo farm state — in-memory only
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (yearWasAdvanced.current) {
      import("sonner").then(({ toast }) => {
        toast.info(`Crop year updated to ${new Date().getFullYear()}`);
      });
    }
  }, []);
  const [tick, setTick] = useState(0);
  const actorWaitStart = useRef<number>(Date.now());

  const setCropYear = (y: number) => {
    sessionStorage.setItem(CROP_YEAR_SESSION_KEY, String(y));
    _setCropYear(y);
  };

  useEffect(() => {
    if (!actorFetching && !backend) {
      const waited = Date.now() - actorWaitStart.current;
      if (waited > 15000) {
        setError("Unable to connect to Kisan Seva. Please refresh the page.");
        setLoading(false);
      } else {
        const remaining = 15000 - waited;
        const timer = setTimeout(() => {
          if (!backend) {
            setError(
              "Unable to connect to Kisan Seva. Please refresh the page.",
            );
            setLoading(false);
          }
        }, remaining);
        return () => clearTimeout(timer);
      }
    }
  }, [actorFetching, backend]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: tick is intentional trigger
  useEffect(() => {
    if (!backend) return;
    setLoading(true);
    setError(null);
    backend
      .getUserFarms()
      .then(async (farms) => {
        if (farms.length > 0) {
          setFarm(farms[0]);
          setNeedsOnboarding(false);
        } else {
          // New user — send them to onboarding
          setNeedsOnboarding(true);
          setFarm(null);
        }
      })
      .catch((err) => {
        console.error("FarmContext load error:", err);
        setFarm(null);
        setError("Unable to connect to Kisan Seva. Please refresh the page.");
      })
      .finally(() => setLoading(false));
  }, [backend, tick]);

  refetchRef.current = () => setTick((t) => t + 1);

  /** Load demo farm from backend — sets isDemo flag in memory */
  const loadDemoFarm = async () => {
    if (!backend) return;
    try {
      const result = await backend.getDemoFarm();
      if (result.__kind__ === "ok") {
        setFarm(result.ok);
        setIsDemo(true);
        setNeedsOnboarding(false);
      } else {
        console.error("loadDemoFarm error:", result.err);
        import("sonner").then(({ toast }) => {
          toast.error("Demo farm unavailable. Please try again.");
        });
      }
    } catch (err) {
      console.error("loadDemoFarm error:", err);
      import("sonner").then(({ toast }) => {
        toast.error("Demo farm unavailable. Please try again.");
      });
    }
  };

  /** Clear demo state — returns to onboarding */
  const clearDemoFarm = () => {
    setFarm(null);
    setIsDemo(false);
    setNeedsOnboarding(true);
  };

  /** Called by Layout after role is fetched from backend */
  const _setUserRole = (role: string) => {
    setUserRoleState(role);
  };

  const updateFarm = async (updates: FarmUpdates): Promise<boolean> => {
    if (!backend || !farm) return false;
    try {
      const input: import("../backend.d.ts").UpdateFarmInput = {};
      if (updates.name !== undefined) input.name = updates.name;
      if (updates.surveyNumber !== undefined)
        input.surveyNumber = updates.surveyNumber;
      if (updates.totalAreaSqm !== undefined)
        input.totalAreaSqm = BigInt(Math.round(updates.totalAreaSqm));
      if (updates.ownershipType !== undefined)
        input.ownershipType = updates.ownershipType;
      if (updates.purposes !== undefined) input.purposes = updates.purposes;
      if (updates.district !== undefined) input.district = updates.district;
      if (updates.mandal !== undefined) input.mandal = updates.mandal;
      if (updates.village !== undefined) input.village = updates.village;
      const result = await backend.updateFarm(farm.id, input);
      if (result.__kind__ === "ok") {
        refetchRef.current();
        return true;
      }
      return false;
    } catch (err) {
      console.error("updateFarm error:", err);
      return false;
    }
  };

  const createFarmFromOnboarding = async (
    name: string,
    state: string,
    district: string,
    mandal: string,
    village: string,
    totalAreaSqm: number,
  ): Promise<Farm | null> => {
    if (!backend) return null;
    try {
      const result = await backend.createFarm(
        name,
        state,
        district,
        mandal,
        village,
        null,
        BigInt(Math.round(totalAreaSqm)),
        "acres",
        "Owned",
        ["Crop"],
      );
      if (result.__kind__ === "ok") {
        refetchRef.current();
        return result.ok;
      }
      return null;
    } catch (err) {
      console.error("createFarmFromOnboarding error:", err);
      return null;
    }
  };

  return (
    <FarmContext.Provider
      value={{
        farm,
        farmId: farm?.id ?? null,
        cropYear,
        setCropYear,
        loading,
        refetch: () => refetchRef.current(),
        error,
        updateFarm,
        needsOnboarding,
        createFarmFromOnboarding,
        userRole,
        isAdmin: userRole === "Admin" || userRole === "",
        isMember: userRole === "Member",
        isViewOnly: userRole === "ViewOnly",
        isDemo,
        loadDemoFarm,
        clearDemoFarm,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export const useFarm = () => useContext(FarmContext);

// Re-export setUserRole via a module-level ref so Layout can call it
// without prop-drilling. This avoids any storage-based role sync.
export let _setFarmContextUserRole: ((role: string) => void) | null = null;
