import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronRight,
  Leaf,
  MapPin,
  Plus,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CropSeason, Field } from "../backend.d.ts";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";

// ── helpers ─────────────────────────────────────────────────────────────────
function sqmToDisplay(sqm: bigint | number, unit: string): string {
  const n = typeof sqm === "bigint" ? Number(sqm) : sqm;
  switch (unit) {
    case "Guntha":
      return `${(n / 101.17).toFixed(2)} Guntha`;
    case "Cents":
      return `${(n / 40.47).toFixed(2)} Cents`;
    case "Bigha":
      return `${(n / 2529.29).toFixed(2)} Bigha`;
    case "Hectares":
      return `${(n / 10000).toFixed(2)} Ha`;
    default:
      return `${(n / 4046.86).toFixed(2)} Acres`;
  }
}

function getCurrentFinancialYear(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return month >= 4
    ? `${year}-${String(year + 1).slice(-2)}`
    : `${year - 1}-${String(year).slice(-2)}`;
}

function isSHCExpiringSoon(shcExpiry?: bigint): boolean {
  if (!shcExpiry) return false;
  const expiryMs = Number(shcExpiry) * 1000;
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  return expiryMs - Date.now() <= ninetyDays && expiryMs > Date.now();
}

function isSHCExpired(shcExpiry?: bigint): boolean {
  if (!shcExpiry) return false;
  return Number(shcExpiry) * 1000 < Date.now();
}

// soil badge colour map
const SOIL_COLORS: Record<string, string> = {
  Red: "bg-red-100 text-red-800 border-red-200",
  "Black (Regur)": "bg-neutral-800 text-neutral-100 border-neutral-700",
  Alluvial: "bg-amber-100 text-amber-800 border-amber-200",
  Laterite: "bg-orange-100 text-orange-800 border-orange-200",
  Sandy: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Loamy: "bg-lime-100 text-lime-800 border-lime-200",
  Clay: "bg-stone-100 text-stone-700 border-stone-200",
};

function SoilBadge({ soil }: { soil: string }) {
  const cls =
    SOIL_COLORS[soil] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${cls}`}
    >
      {soil}
    </span>
  );
}

// ── FieldCard ────────────────────────────────────────────────────────────────
interface FieldCardProps {
  field: Field;
  activeCrop: CropSeason | null;
  index: number;
  onClick: () => void;
}

function FieldCard({ field, activeCrop, index, onClick }: FieldCardProps) {
  const expiringSoon = isSHCExpiringSoon(field.shcExpiry);
  const expired = isSHCExpired(field.shcExpiry);

  return (
    <Card
      className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-border active:scale-[0.98]"
      onClick={onClick}
      data-ocid={`fields.item.${index}`}
    >
      {/* top accent bar */}
      <div className="h-1 bg-primary/80 w-full" />

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-foreground truncate leading-tight">
              {field.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sqmToDisplay(field.areaSqm, field.unit)}
              {" • "}
              <span className="capitalize">{field.tenure}</span>
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
        </div>

        {/* badges */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {field.soilType && <SoilBadge soil={field.soilType} />}
          {field.irrigationType && (
            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
              💧 {field.irrigationType}
            </span>
          )}
        </div>

        {/* current crop */}
        {activeCrop ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Sprout className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="font-medium text-foreground text-xs">
              {activeCrop.cropName}
            </span>
            {activeCrop.variety && (
              <span className="text-muted-foreground text-[10px]">
                ({activeCrop.variety})
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground italic">
              खाली — Koi Fasal Nahi
            </span>
          </div>
        )}

        {/* SHC alerts */}
        {expired && (
          <div
            className="mt-2 flex items-center gap-1 text-[10px] text-red-700 font-medium"
            data-ocid={`fields.shc_expired.${index}`}
          >
            <AlertTriangle className="w-3 h-3" />
            SHC मियाद खत्म
          </div>
        )}
        {!expired && expiringSoon && (
          <div
            className="mt-2 flex items-center gap-1 text-[10px] text-amber-700 font-medium"
            data-ocid={`fields.shc_alert.${index}`}
          >
            <AlertTriangle className="w-3 h-3" />
            SHC Renewal जल्द — 90 दिन
          </div>
        )}

        {/* survey number */}
        {field.surveyNumber && (
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            <MapPin className="w-2.5 h-2.5 inline mr-0.5" />
            Survey: {field.surveyNumber}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── FieldListPage ─────────────────────────────────────────────────────────────
export default function FieldListPage() {
  const { farmId, isAdmin, isMember } = useFarm();
  const canWrite = isAdmin || isMember;
  const { actor: backend } = useActor();
  const navigate = useNavigate();

  const [fields, setFields] = useState<Field[]>([]);
  const [seasonsByField, setSeasonsByField] = useState<
    Record<string, CropSeason[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const financialYear = getCurrentFinancialYear();

  useEffect(() => {
    if (!backend || !farmId) return;
    setIsLoading(true);
    backend
      .getFieldsForFarm(farmId)
      .then(async (res) => {
        if (res.__kind__ !== "ok") return;
        const fs = res.ok.filter((f) => f.isActive);
        setFields(fs);
        const sbf: Record<string, CropSeason[]> = {};
        await Promise.all(
          fs.map(async (f) => {
            const r = await backend.getCropSeasonsForField(f.id);
            sbf[String(f.id)] = r.__kind__ === "ok" ? r.ok : [];
          }),
        );
        setSeasonsByField(sbf);
      })
      .catch(() => toast.error("खेत लोड नहीं हो सके। दोबारा कोशिश करें।"))
      .finally(() => setIsLoading(false));
  }, [backend, farmId]);

  const getActiveCrop = (field: Field): CropSeason | null => {
    const seasons = seasonsByField[String(field.id)] ?? [];
    return seasons.find((s) => s.financialYear === financialYear) ?? null;
  };

  return (
    <div
      className="min-h-screen bg-background pb-24"
      data-ocid="field_list.page"
    >
      {/* ── Header ── */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground leading-tight">
                Mere Khet
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoading
                  ? "..."
                  : `${fields.length} khet • FY ${financialYear}`}
              </p>
            </div>
            {canWrite && (
              <Button
                size="sm"
                onClick={() => navigate({ to: "/fields/add" })}
                className="gap-1.5"
                data-ocid="field_list.add_button"
              >
                <Plus className="w-4 h-4" />
                Naya Khet
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 md:px-6">
        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="field_list.loading_state"
          >
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="rounded-xl border border-border overflow-hidden"
              >
                <Skeleton className="h-1 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : fields.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="field_list.empty_state"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Leaf className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              Abhi tak koi khet nahi
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Pehla khet jodein aur fasal ka record rakhna shuru karein
            </p>
            {canWrite && (
              <Button
                onClick={() => navigate({ to: "/fields/add" })}
                className="gap-2"
                data-ocid="field_list.empty_add_button"
              >
                <Plus className="w-4 h-4" />
                Pehla Khet Jodein
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field, i) => (
              <FieldCard
                key={String(field.id)}
                field={field}
                activeCrop={getActiveCrop(field)}
                index={i + 1}
                onClick={() => navigate({ to: `/fields/${String(field.id)}` })}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {canWrite && fields.length > 0 && (
        <button
          type="button"
          className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
          onClick={() => navigate({ to: "/fields/add" })}
          aria-label="Naya khet jodein"
          data-ocid="field_list.fab_button"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
