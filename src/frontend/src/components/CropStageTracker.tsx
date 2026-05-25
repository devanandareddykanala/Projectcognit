import { useMemo } from "react";
import { toast } from "sonner";
import type { CropSeason } from "../backend";
import { CropStage } from "../backend";
import { useActor } from "../hooks/useActor";
import { cn } from "../lib/utils";

const STAGES_ORDERED: CropStage[] = [
  CropStage.LandPrep,
  CropStage.Sowing,
  CropStage.Germination,
  CropStage.Vegetative,
  CropStage.Flowering,
  CropStage.GrainFilling,
  CropStage.Harvest,
  CropStage.PostHarvest,
];

const STAGE_LABELS: Record<CropStage, string> = {
  [CropStage.LandPrep]: "Land Prep",
  [CropStage.Sowing]: "Buwai",
  [CropStage.Germination]: "Ankur",
  [CropStage.Vegetative]: "Badhna",
  [CropStage.Flowering]: "Phool",
  [CropStage.GrainFilling]: "Dana",
  [CropStage.Harvest]: "Katai",
  [CropStage.PostHarvest]: "After",
};

const STAGE_SHORT: Record<CropStage, string> = {
  [CropStage.LandPrep]: "L.Prep",
  [CropStage.Sowing]: "Buwai",
  [CropStage.Germination]: "Ankur",
  [CropStage.Vegetative]: "Badh",
  [CropStage.Flowering]: "Phool",
  [CropStage.GrainFilling]: "Dana",
  [CropStage.Harvest]: "Katai",
  [CropStage.PostHarvest]: "Baad",
};

interface CropStageTrackerProps {
  cropSeason: CropSeason;
  /** If provided, tapping a future stage advances to it */
  onStageUpdate?: (newStage: CropStage) => void;
  compact?: boolean;
}

export default function CropStageTracker({
  cropSeason,
  onStageUpdate,
  compact = true,
}: CropStageTrackerProps) {
  const currentIdx = STAGES_ORDERED.indexOf(cropSeason.stage);

  const sowingMs = Number(cropSeason.sowingDate) / 1_000_000;
  const harvestMs = Number(cropSeason.expectedHarvestDate) / 1_000_000;
  const nowMs = Date.now();

  const daysSinceSowing = useMemo(() => {
    if (!sowingMs) return null;
    const diff = Math.floor((nowMs - sowingMs) / 86_400_000);
    return diff >= 0 ? diff : null;
  }, [sowingMs, nowMs]);

  const daysToHarvest = useMemo(() => {
    if (!harvestMs) return null;
    const diff = Math.floor((harvestMs - nowMs) / 86_400_000);
    return diff >= 0 ? diff : null;
  }, [harvestMs, nowMs]);

  return (
    <div
      className="w-full select-none"
      aria-label={`Fasal stage: ${STAGE_LABELS[cropSeason.stage]}`}
    >
      {/* Stage circles + connector bar */}
      <div className="flex items-center w-full gap-0">
        {STAGES_ORDERED.map((stage, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          const canAdvance = isFuture && !!onStageUpdate;

          return (
            <div key={stage} className="flex items-center flex-1 min-w-0">
              {/* Circle */}
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => canAdvance && onStageUpdate(stage)}
                aria-label={`${STAGE_LABELS[stage]}${canAdvance ? " — tap to advance" : ""}`}
                className={cn(
                  "relative shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
                  compact ? "w-5 h-5" : "w-6 h-6",
                  isDone && "bg-primary border-primary",
                  isCurrent && "bg-accent border-accent",
                  isFuture && "bg-background border-muted-foreground/40",
                  canAdvance && "cursor-pointer hover:border-primary",
                  !canAdvance && "cursor-default",
                )}
              >
                {isDone && (
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-label="Completed stage"
                  >
                    <title>Completed stage</title>
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isCurrent && (
                  <span
                    className="block w-2 h-2 rounded-full bg-accent-foreground motion-safe:animate-ping motion-safe:opacity-75"
                    aria-hidden="true"
                  />
                )}
              </button>
              {/* Connector — not after last */}
              {idx < STAGES_ORDERED.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5",
                    idx < currentIdx ? "bg-primary" : "bg-muted-foreground/20",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      {!compact && (
        <div className="flex w-full mt-1">
          {STAGES_ORDERED.map((stage, idx) => (
            <div key={stage} className="flex-1 text-center">
              <span
                className={cn(
                  "text-[9px] leading-tight block truncate",
                  idx === currentIdx
                    ? "text-accent-foreground font-bold"
                    : idx < currentIdx
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                )}
              >
                {STAGE_SHORT[stage]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Current stage label + day counts */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs font-medium text-accent-foreground">
          📍 {STAGE_LABELS[cropSeason.stage]}
        </span>
        <div className="flex gap-3 text-[11px] text-muted-foreground">
          {daysSinceSowing !== null && <span>{daysSinceSowing}d buwai se</span>}
          {daysToHarvest !== null && <span>{daysToHarvest}d katai mein</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * Standalone hook for advancing stage from detail pages.
 * Separate from the component so HarvestLogPage/detail pages can call it.
 */
export function useStageUpdater() {
  const { actor } = useActor();

  return async (
    cropSeasonId: bigint,
    newStage: CropStage,
  ): Promise<boolean> => {
    if (!actor) return false;
    try {
      const result = await actor.updateCropStage(cropSeasonId, newStage);
      if (result.__kind__ === "ok") {
        toast.success("Stage update ho gaya!");
        return true;
      }
      toast.error(`Update nahi hua: ${result.err}`);
      return false;
    } catch {
      toast.error("Stage update mein dikkat aayi.");
      return false;
    }
  };
}
