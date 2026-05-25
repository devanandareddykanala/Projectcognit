import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { kisanDB } from "../lib/db";

export function useOfflineQueue() {
  const enqueue = useCallback(async (method: string, args: unknown[]) => {
    await kisanDB.enqueue({ method, args, timestamp: Date.now(), retries: 0 });
    toast.info("Saved offline — will sync when connected");
  }, []);

  const replayQueue = useCallback(
    async (actor: Record<string, (...args: unknown[]) => Promise<unknown>>) => {
      const queue = await kisanDB.getQueue();
      for (const item of queue) {
        try {
          await actor[item.method](...item.args);
          if (item.id !== undefined) await kisanDB.removeFromQueue(item.id);
        } catch (e) {
          console.warn("Queue replay failed for", item.method, e);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const handleOnline = () => {
      toast.success("Back online — syncing your changes");
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return { enqueue, replayQueue };
}
