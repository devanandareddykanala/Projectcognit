import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { QualityGrade } from "../backend";
import type { CropSeason } from "../backend";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";
import { usePageData } from "../hooks/usePageData";
import { cn } from "../lib/utils";

const GRADE_OPTIONS: {
  value: QualityGrade;
  label: string;
  sublabel: string;
  color: string;
}[] = [
  {
    value: QualityGrade.FAQ,
    label: "FAQ",
    sublabel: "Fair Average Quality — standard mandi quality",
    color: "border-primary/60 bg-primary/10",
  },
  {
    value: QualityGrade.GradeA,
    label: "Grade A",
    sublabel: "Achi quality — upar ka grade",
    color: "border-positive/60 bg-positive/10",
  },
  {
    value: QualityGrade.GradeB,
    label: "Grade B",
    sublabel: "Theek quality — normal price",
    color: "border-muted-foreground/40 bg-muted",
  },
  {
    value: QualityGrade.Processing,
    label: "Processing",
    sublabel: "Processing ke liye — lower price expected",
    color: "border-accent/50 bg-accent/10",
  },
  {
    value: QualityGrade.Rejected,
    label: "Rejected",
    sublabel: "Rejected — insurance claim ke liye document karein",
    color: "border-destructive/50 bg-destructive/10",
  },
];

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function toTimestamp(dateStr: string): bigint {
  return BigInt(new Date(dateStr).getTime() * 1_000_000);
}

export default function HarvestLogPage() {
  const navigate = useNavigate();
  const { farmId } = useFarm();
  const { actor } = useActor();
  // cropSeasonId comes from route params
  const params = useParams({ strict: false }) as { cropSeasonId?: string };
  const cropSeasonId = params.cropSeasonId ?? "";

  const [yieldQt, setYieldQt] = useState("");
  const [grade, setGrade] = useState<QualityGrade>(QualityGrade.FAQ);
  const [moisture, setMoisture] = useState("");
  const [harvestDate, setHarvestDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [sellingRate, setSellingRate] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: cropSeason, isLoading } = usePageData(async () => {
    if (!actor || !farmId || !cropSeasonId) return null as CropSeason | null;
    const result = await actor.getCropSeasonsForField(BigInt(cropSeasonId));
    // We fetch all for field then find by id — or use farm-level fetch
    if (result.__kind__ === "ok") {
      const found = result.ok.find((cs) => String(cs.id) === cropSeasonId);
      return found ?? null;
    }
    // Fallback: fetch all farm seasons
    const farmResult = await actor.getCropSeasonsForFarm(
      farmId,
      new Date().getFullYear() > 3
        ? `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`
        : `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
    );
    if (farmResult.__kind__ === "ok") {
      return farmResult.ok.find((cs) => String(cs.id) === cropSeasonId) ?? null;
    }
    return null;
  }, [actor, farmId, cropSeasonId]);

  const hasMSP = !!cropSeason?.mspPerQuintal;
  const mspValue = hasMSP ? Number(cropSeason!.mspPerQuintal) : 0;
  const sellingRateNum = Number(sellingRate) || 0;
  const mspdiff = sellingRateNum - mspValue;
  const mspColor =
    sellingRateNum === 0
      ? ""
      : mspdiff > 0
        ? "text-positive"
        : mspdiff === 0
          ? "text-accent-foreground"
          : "text-destructive";

  const handleSave = async () => {
    if (!actor || !cropSeasonId || !yieldQt) return;
    setSaving(true);
    try {
      const result = await actor.logHarvest(
        BigInt(cropSeasonId),
        toTimestamp(harvestDate),
        Number(yieldQt),
        grade,
        moisture ? Number(moisture) : null,
        notes.trim() || null,
      );
      if (result.__kind__ === "ok") {
        toast.success("Harvest record safaltapoorvak save hua!");
        navigate({ to: "/crops" });
      } else {
        toast.error(`Error: ${result.err}`);
      }
    } catch {
      toast.error("Harvest save karne mein dikkat aayi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" data-ocid="harvest-log.page">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 shadow-sm flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/crops" })}
          className="p-1 -ml-1"
          data-ocid="harvest-log.back_button"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-display text-xl text-primary font-bold">
            Harvest Darj Karein
          </h1>
          {cropSeason && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {cropSeason.cropName}
              {cropSeason.variety ? ` — ${cropSeason.variety}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto pb-24">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Yield */}
            <div className="space-y-1.5">
              <Label>Actual yield in quintals *</Label>
              <Input
                type="number"
                placeholder="e.g. 22.5"
                value={yieldQt}
                onChange={(e) => setYieldQt(e.target.value)}
                data-ocid="harvest-log.yield_input"
              />
            </div>

            {/* Quality grade */}
            <div className="space-y-2">
              <Label>Quality grade *</Label>
              <div
                className="grid grid-cols-1 gap-2"
                role="radiogroup"
                aria-label="Quality grade"
              >
                {GRADE_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    // biome-ignore lint/a11y/useSemanticElements: custom radio button inside radiogroup for styled UX
                    type="button"
                    role="radio"
                    aria-checked={grade === g.value}
                    onClick={() => setGrade(g.value)}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") && setGrade(g.value)
                    }
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-colors",
                      grade === g.value
                        ? g.color
                        : "border-border bg-card hover:border-primary/40",
                    )}
                    data-ocid={`harvest-log.grade.${g.value.toLowerCase()}`}
                  >
                    <div
                      className={cn(
                        "mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                        grade === g.value
                          ? "border-primary bg-primary"
                          : "border-muted-foreground",
                      )}
                    >
                      {grade === g.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{g.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">
                        {g.sublabel}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Moisture */}
            <div className="space-y-1.5">
              <Label>Moisture % (optional)</Label>
              <Input
                type="number"
                placeholder="e.g. 14"
                value={moisture}
                onChange={(e) => setMoisture(e.target.value)}
                data-ocid="harvest-log.moisture_input"
              />
              <p className="text-xs text-muted-foreground">
                10–14% paddy ke liye ideal
              </p>
            </div>

            {/* Harvest date */}
            <div className="space-y-1.5">
              <Label>Harvest ki taareekh *</Label>
              <Input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                data-ocid="harvest-log.harvest_date_input"
              />
            </div>

            {/* MSP comparison */}
            {hasMSP && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Aapki Rate vs MSP
                </p>
                <div className="flex items-center gap-2">
                  <Label className="shrink-0">Aapki selling rate (₹/qt)</Label>
                </div>
                <Input
                  type="number"
                  placeholder="₹ per quintal"
                  value={sellingRate}
                  onChange={(e) => setSellingRate(e.target.value)}
                  data-ocid="harvest-log.selling_rate_input"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">MSP 2025-26:</span>
                  <span className="font-semibold">
                    ₹{mspValue.toLocaleString("en-IN")}/qt
                  </span>
                </div>
                {sellingRateNum > 0 && (
                  <div
                    className={cn(
                      "flex items-center justify-between text-sm font-semibold",
                      mspColor,
                    )}
                  >
                    <span>
                      {mspdiff >= 0 ? "MSP se oopar ✓" : "MSP se neeche ⚠"}
                    </span>
                    <span>
                      {mspdiff >= 0 ? "+" : ""}₹
                      {Math.abs(mspdiff).toLocaleString("en-IN")}/qt
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Koi bhi notes ya comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                data-ocid="harvest-log.notes_textarea"
              />
            </div>

            {/* Save */}
            <Button
              className="w-full"
              disabled={!yieldQt || saving}
              onClick={handleSave}
              data-ocid="harvest-log.submit_button"
            >
              {saving ? "Saving..." : "Harvest Record Save Karein"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
