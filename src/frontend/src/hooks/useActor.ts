import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

/**
 * Pre-configured useActor hook bound to the FarmOS backend.
 * Pages call this with no arguments: const { actor } = useActor();
 */
export function useActor() {
  return _useActor(createActor);
}
