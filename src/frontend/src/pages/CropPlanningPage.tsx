import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { Leaf, Plus, Sprout } from "lucide-react";
import { useMemo, useState } from "react";
import type { CropSeason } from "../backend.d.ts";
import CropStageTracker from "../components/CropStageTracker";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";
import { usePageData } from "../hooks/usePageData";
import { kisanDB } from "../lib/db";

const SEASONS = ["All", "Kharif", "Rabi", "Zaid", "Boro", "Perennial"] as const;
type SeasonFilter = (typeof SEASONS)[number];

function getCurrentFY(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const year = now.getFullYear();
  return month >= 4
    ? `${year}-${String(year + 1).slice(-2)}`
    : `${year - 1}-${String(year).slice(-2)}`;
}

function buildFYOptions(): string[] {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const currentStartYear = month >= 4 ? year : year - 1;
  return Array.from({ length: 4 }, (_, i) => {
    const y = currentStartYear - i;
    return `${y}-${String(y + 1).slice(-2)}`;
  });
}

function formatFYLabel(fy: string): string {
  const [start, end] = fy.split("-");
  return `${start}-${end} (Apr–Mar)`;
}

const CACHE_KEY_PREFIX = "crop_seasons_farm";

export default function CropPlanningPage() {
  const navigate = useNavigate();
  const { farmId } = useFarm();
  const { actor } = useActor();

  const [selectedFY, setSelectedFY] = useState<string>(getCurrentFY);
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("All");
  const fyOptions = useMemo(() => buildFYOptions(), []);

  const { data: cropSeasons, isLoading } = usePageData(async () => {
    if (!actor || !farmId) return [];
    // Try IndexedDB cache first (Build 1 schema — kisanCache store)
    const cacheKey = `${CACHE_KEY_PREFIX}_${String(farmId)}_${selectedFY}`;
    try {
      const cached = await kisanDB.getCache(cacheKey);
      if (cached && Date.now() - cached.cachedAt < 5 * 60 * 1000) {
        return cached.data as CropSeason[];
      }
    } catch {
      /* ignore cache miss */
    }
    const result = await actor.getCropSeasonsForFarm(farmId, selectedFY);
    if (result.__kind__ === "ok") {
      // Persist to IndexedDB (Build 1 schema)
      try {
        await kisanDB.setCache(cacheKey, result.ok);
      } catch {
        /* non-critical */
      }
      return result.ok;
    }
    return [];
  }, [actor, farmId, selectedFY]);

  const filtered = useMemo(() => {
    if (!cropSeasons) return [];
    if (seasonFilter === "All") return cropSeasons;
    return cropSeasons.filter((c) => c.season === seasonFilter);
  }, [cropSeasons, seasonFilter]);

  return (
    <div
      className="relative min-h-screen bg-background pb-24"
      data-ocid="crop-planning.page"
    >
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 shadow-sm">
        <h1 className="font-display text-2xl text-primary font-bold">
          Fasal Yojana
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fasal planning aur stage tracker
        </p>
      </div>

      {/* FY + Season filters */}
      <div className="px-4 pt-4 space-y-3 bg-card border-b border-border pb-3">
        <Select value={selectedFY} onValueChange={setSelectedFY}>
          <SelectTrigger className="w-full" data-ocid="crop-planning.fy_select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fyOptions.map((fy) => (
              <SelectItem key={fy} value={fy}>
                {formatFYLabel(fy)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs
          value={seasonFilter}
          onValueChange={(v) => setSeasonFilter(v as SeasonFilter)}
        >
          <TabsList className="w-full grid grid-cols-6 h-auto p-1">
            {SEASONS.map((s) => (
              <TabsTrigger
                key={s}
                value={s}
                className="text-[10px] px-1 py-1.5"
                data-ocid={`crop-planning.season.${s.toLowerCase()}`}
              >
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => navigate({ to: "/crops/add" })} />
        ) : (
          filtered.map((cs) => (
            <CropCard
              key={String(cs.id)}
              cropSeason={cs}
              onClick={() => navigate({ to: `/crops/${String(cs.id)}` })}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => navigate({ to: "/crops/add" })}
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-3 shadow-lg hover:opacity-90 transition-opacity"
        data-ocid="crop-planning.add_button"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-semibold">Naya Season Jodein</span>
      </button>
    </div>
  );
}

function CropCard({
  cropSeason,
  onClick,
}: { cropSeason: CropSeason; onClick: () => void }) {
  const hasMSP = !!cropSeason.mspPerQuintal;
  const mspValue = hasMSP ? Number(cropSeason.mspPerQuintal) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl border border-border p-4 space-y-3 hover:border-primary/40 transition-colors shadow-sm"
      data-ocid={`crop-planning.item.${String(cropSeason.id)}`}
    >
      {/* Name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-base leading-tight truncate">
            {cropSeason.cropName}
            {cropSeason.variety ? (
              <span className="text-muted-foreground font-normal text-sm">
                {" "}
                — {cropSeason.variety}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Khet #{String(cropSeason.fieldId)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {hasMSP && (
            <Badge className="bg-accent text-accent-foreground border-0 text-xs px-2 py-0.5">
              MSP: ₹{mspValue.toLocaleString("en-IN")}/qt
            </Badge>
          )}
          {cropSeason.isInterCrop && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 border-primary/40 text-primary"
            >
              Inter-crop
            </Badge>
          )}
        </div>
      </div>

      {/* Stage tracker — view-only in card */}
      <CropStageTracker cropSeason={cropSeason} />

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>🌱 {formatDate(cropSeason.sowingDate)}</span>
        <span>🌾 {formatDate(cropSeason.expectedHarvestDate)}</span>
      </div>
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6"
      data-ocid="crop-planning.empty_state"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Leaf className="w-8 h-8 text-primary" />
      </div>
      <p className="font-display text-xl text-foreground font-bold mb-1">
        Koi Fasal Nahi
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Abhi tak koi fasal nahi — Kharif season shuru karein
      </p>
      <Button onClick={onAdd} data-ocid="crop-planning.empty_state.add_button">
        <Sprout className="w-4 h-4 mr-2" />
        Pehli Fasal Jodein
      </Button>
    </div>
  );
}

function formatDate(ts: bigint): string {
  const d = new Date(Number(ts) / 1_000_000);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
