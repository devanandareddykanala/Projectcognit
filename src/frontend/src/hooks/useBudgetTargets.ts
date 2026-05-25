import { useCallback, useEffect, useMemo, useState } from "react";

export const BUDGET_CATEGORIES = [
  "Variable",
  "Fixed",
  "Overhead",
  "Labour",
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

// Minimal shape of a BudgetTarget record returned from the backend.
// The backend entity is being added in this sprint — types will be regenerated
// after the next `pnpm bindgen`. Until then we cast via `unknown`.
interface BudgetTargetRecord {
  id: bigint;
  farmId: bigint;
  cropYear: bigint;
  category: string;
  targetAmount: number; // stored as Float in Motoko, arrives as number
}

// Backend interface extension (not yet in generated backend.d.ts)
interface BackendWithBudget {
  createBudgetTarget(
    farmId: bigint,
    cropYear: bigint,
    category: string,
    targetAmount: number,
  ): Promise<bigint | null>;
  getBudgetTargetsForFarm(
    farmId: bigint,
    cropYear: bigint,
  ): Promise<BudgetTargetRecord[]>;
  deleteBudgetTarget(id: bigint): Promise<boolean>;
}

function hasBackendBudget(b: unknown): b is BackendWithBudget {
  return (
    typeof b === "object" &&
    b !== null &&
    "getBudgetTargetsForFarm" in b &&
    typeof (b as Record<string, unknown>).getBudgetTargetsForFarm === "function"
  );
}

/**
 * useBudgetTargets — backend-persisted budget targets.
 *
 * Fetches targets from the backend on mount. Writes go to the backend via
 * createBudgetTarget (upsert semantics). Falls back gracefully if the backend
 * hasn't been deployed with the new BudgetTarget entity yet.
 */
export function useBudgetTargets(
  backend: unknown,
  farmId: bigint | null,
  cropYear: number,
) {
  const [targetsById, setTargetsById] = useState<
    Record<string, { id: bigint; amount: number }>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch on mount / when backend, farmId, or cropYear change
  // biome-ignore lint/correctness/useExhaustiveDependencies: farmId is bigint, stable ref is via String
  useEffect(() => {
    if (!farmId || cropYear === 0 || !hasBackendBudget(backend)) return;
    setIsLoading(true);
    backend
      .getBudgetTargetsForFarm(farmId, BigInt(cropYear))
      .then((rows) => {
        const byCategory: Record<string, { id: bigint; amount: number }> = {};
        for (const row of rows) {
          byCategory[row.category] = { id: row.id, amount: row.targetAmount };
        }
        setTargetsById(byCategory);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [backend, String(farmId), cropYear]);

  // Flat targets map: { category -> amount in cents }
  const targets = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const cat of BUDGET_CATEGORIES) {
      out[cat] = targetsById[cat]?.amount ?? 0;
    }
    return out;
  }, [targetsById]);

  const hasAnyTarget = useMemo(
    () => Object.values(targets).some((v) => v > 0),
    [targets],
  );

  /**
   * Upsert a budget target for a category.
   * `cents` is the value in cents (consistent with expense amounts).
   */
  const setTarget = useCallback(
    async (category: string, cents: number) => {
      if (!farmId || !hasBackendBudget(backend)) return;
      // Optimistic update
      setTargetsById((prev) => ({
        ...prev,
        [category]: { id: prev[category]?.id ?? BigInt(0), amount: cents },
      }));
      try {
        await backend.createBudgetTarget(
          farmId,
          BigInt(cropYear),
          category,
          cents,
        );
        // Re-fetch to get the canonical id from the backend
        const rows = await backend.getBudgetTargetsForFarm(
          farmId,
          BigInt(cropYear),
        );
        const byCategory: Record<string, { id: bigint; amount: number }> = {};
        for (const row of rows) {
          byCategory[row.category] = { id: row.id, amount: row.targetAmount };
        }
        setTargetsById(byCategory);
      } catch (err) {
        console.error("Failed to save budget target:", err);
        // Revert optimistic update on error
        setTargetsById((prev) => {
          const next = { ...prev };
          if (next[category]?.id === BigInt(0)) delete next[category];
          return next;
        });
      }
    },
    [backend, farmId, cropYear],
  );

  return {
    targets,
    setTarget,
    hasAnyTarget,
    isLoading,
    categories: BUDGET_CATEGORIES,
  };
}
