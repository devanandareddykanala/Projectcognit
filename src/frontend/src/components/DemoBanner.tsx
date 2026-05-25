import { Sprout, X } from "lucide-react";
import { Button } from "./ui/button";

interface DemoBannerProps {
  onDismiss: () => void;
  onSetupFarm: () => void;
}

export function DemoBanner({ onDismiss, onSetupFarm }: DemoBannerProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm border-b"
      style={{
        background: "oklch(0.97 0.06 68)",
        borderColor: "oklch(0.85 0.10 68)",
        color: "oklch(0.35 0.08 68)",
      }}
      data-ocid="demo_banner.panel"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Sprout
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "oklch(0.55 0.12 68)" }}
        />
        <span className="truncate">
          <strong>You&apos;re viewing demo data</strong> — Hendricks Family
          Farms. This is not your real farm data.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          className="h-7 text-xs px-3"
          style={{
            background: "oklch(0.55 0.12 68)",
            color: "white",
          }}
          onClick={onSetupFarm}
          data-ocid="demo_banner.setup_button"
        >
          Set up my farm
        </Button>
        <button
          type="button"
          className="p-1 rounded hover:bg-black/5 transition-colors"
          onClick={onDismiss}
          aria-label="Dismiss demo banner"
          data-ocid="demo_banner.close_button"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
