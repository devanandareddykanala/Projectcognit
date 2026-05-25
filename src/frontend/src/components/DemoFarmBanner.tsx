import { SproutIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DemoFarmBanner() {
  const { t } = useTranslation();
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold border-b w-full"
      style={{
        background: "oklch(0.90 0.10 68)",
        borderColor: "oklch(0.80 0.13 68)",
        color: "oklch(0.30 0.08 68)",
      }}
      data-ocid="demo_farm_banner.panel"
    >
      <SproutIcon
        className="w-4 h-4 flex-shrink-0"
        style={{ color: "oklch(0.50 0.13 68)" }}
      />
      <span>{t("demo.banner")}</span>
    </div>
  );
}
