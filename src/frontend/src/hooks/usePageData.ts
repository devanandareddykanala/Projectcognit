import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Centralizes the Promise.all + loading + error pattern repeated across all page files.
 *
 * Usage:
 *   const { data, isLoading, refetch } = usePageData(
 *     () => Promise.all([backend.getFields(farmId), backend.getEquipment(farmId)])
 *       .then(([fields, equipment]) => ({ fields, equipment })),
 *     [backend, farmId, cropYear]
 *   );
 *
 * The fetcher is called on mount and whenever any dep changes.
 * On error: logs to console and shows a toast. User always sees the problem.
 */
export function usePageData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  errorMessage = "Could not load data. Please try again.",
): {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const tickRef = useRef(0);

  // fetcherRef + errorRef let us reference the latest values without adding
  // them to the dep array — the caller controls when re-fetches happen via deps.
  const fetcherRef = useRef(fetcher);
  const errorRef = useRef(errorMessage);
  fetcherRef.current = fetcher;
  errorRef.current = errorMessage;

  const run = useCallback(async () => {
    const myTick = ++tickRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (mountedRef.current && myTick === tickRef.current) {
        setData(result);
      }
    } catch (err) {
      console.error(err);
      if (mountedRef.current && myTick === tickRef.current) {
        setError(errorRef.current);
        toast.error(errorRef.current);
      }
    } finally {
      if (mountedRef.current && myTick === tickRef.current) {
        setIsLoading(false);
      }
    }
    // intentional: deps is caller-controlled; fetcherRef is always fresh
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    run();
    return () => {
      mountedRef.current = false;
    };
  }, [run]);

  const refetch = useCallback(() => {
    run();
  }, [run]);

  return { data, isLoading, error, refetch };
}
