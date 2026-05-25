import { useEffect, useRef, useState } from "react";
import type { NotificationEntity, backendInterface } from "../backend.d.ts";

export type { NotificationEntity };

export interface FarmAlert {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  title?: string;
  notifId?: bigint;
}

interface UseNotificationsOptions {
  backend: backendInterface | null;
  farmId: bigint | null;
  cropYear: number;
}

interface UseNotificationsReturn {
  notifications: FarmAlert[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  errorCount: number;
  warningCount: number;
  visibleCount: number;
}

const SESSION_KEY = "kisan-seva-dismissed-alerts";

function loadDismissed(): Set<string> {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? new Set(JSON.parse(s)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...ids]));
  } catch {}
}

function mapNotifType(notifType: string): FarmAlert["type"] {
  if (
    notifType.toLowerCase().includes("error") ||
    notifType.toLowerCase().includes("critical")
  )
    return "error";
  if (
    notifType.toLowerCase().includes("warning") ||
    notifType.toLowerCase().includes("alert")
  )
    return "warning";
  return "info";
}

export function useNotifications({
  backend,
  farmId,
  cropYear: _cropYear,
}: UseNotificationsOptions): UseNotificationsReturn {
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);
  const [rawNotifs, setRawNotifs] = useState<NotificationEntity[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Re-hydrate dismissed set if sessionStorage was cleared externally
  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  // Poll getNotifications every 30 seconds
  useEffect(() => {
    if (!backend || !farmId) return;

    const fetchNotifs = async () => {
      try {
        const result = await backend.getNotifications(farmId);
        if (result.__kind__ === "ok") {
          setRawNotifs(result.ok.filter((n) => !n.isDismissed));
        }
      } catch {
        // non-critical
      }
    };

    fetchNotifs();
    intervalRef.current = setInterval(fetchNotifs, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [backend, farmId]);

  const allAlerts: FarmAlert[] = rawNotifs.map((n) => ({
    id: String(n.id),
    type: mapNotifType(n.notifType),
    message: n.body,
    title: n.title,
    notifId: n.id,
  }));

  const notifications = allAlerts.filter((a) => !dismissed.has(a.id));

  const dismissNotification = (id: string) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  const clearAllNotifications = () => {
    const next = new Set(allAlerts.map((a) => a.id));
    setDismissed(next);
    saveDismissed(next);
  };

  const errorCount = notifications.filter((a) => a.type === "error").length;
  const warningCount = notifications.filter((a) => a.type === "warning").length;

  return {
    notifications,
    dismissNotification,
    clearAllNotifications,
    errorCount,
    warningCount,
    visibleCount: notifications.length,
  };
}
