import { WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <output
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
      style={{
        background: "oklch(0.92 0.09 68)",
        color: "oklch(0.30 0.06 68)",
      }}
      aria-live="polite"
      data-ocid="offline_banner.panel"
    >
      <WifiOffIcon className="w-4 h-4 flex-shrink-0" />
      <span>{t("common.offline")}</span>
    </output>
  );
}
