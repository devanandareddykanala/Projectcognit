import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Droplets,
  Edit2,
  FileText,
  Leaf,
  Loader2,
  MapPin,
  Sprout,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CropSeason, Field, LandRecord } from "../backend.d.ts";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";

// ── helpers ──────────────────────────────────────────────────────────────────
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

function formatDate(ts?: bigint): string {
  if (!ts) return "—";
  const d = new Date(Number(ts) * 1000);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isSHCExpiringSoon(shcExpiry?: bigint): boolean {
  if (!shcExpiry) return false;
  const exp = Number(shcExpiry) * 1000;
  return exp - Date.now() <= 90 * 24 * 60 * 60 * 1000 && exp > Date.now();
}

function isSHCExpired(shcExpiry?: bigint): boolean {
  if (!shcExpiry) return false;
  return Number(shcExpiry) * 1000 < Date.now();
}

const SOIL_COLORS: Record<string, string> = {
  Red: "bg-red-100 text-red-800",
  "Black (Regur)": "bg-neutral-800 text-neutral-100",
  Alluvial: "bg-amber-100 text-amber-800",
  Laterite: "bg-orange-100 text-orange-800",
  Sandy: "bg-yellow-100 text-yellow-800",
  Loamy: "bg-lime-100 text-lime-800",
  Clay: "bg-stone-100 text-stone-700",
};

// ── InfoRow ──────────────────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  icon,
}: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-[100px]">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground text-right flex-1">
        {value || "—"}
      </span>
    </div>
  );
}

// ── CropCard ─────────────────────────────────────────────────────────────────
function CropCard({
  season,
  isActive,
}: { season: CropSeason; isActive: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 space-y-1.5 ${
        isActive
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-muted/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sprout
            className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
          />
          <span className="font-semibold text-sm text-foreground">
            {season.cropName}
          </span>
          {season.variety && (
            <span className="text-[10px] text-muted-foreground">
              ({season.variety})
            </span>
          )}
        </div>
        {isActive && (
          <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30">
            Active
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>Season: {season.season}</span>
        <span>FY: {season.financialYear}</span>
        <span>Sowing: {formatDate(season.sowingDate)}</span>
        <span>Harvest: {formatDate(season.expectedHarvestDate)}</span>
        {season.actualYieldQt !== undefined && (
          <span className="col-span-2 text-foreground font-medium">
            Yield: {season.actualYieldQt} Qt • {season.stage}
          </span>
        )}
      </div>
    </div>
  );
}

// ── FieldDetailPage ──────────────────────────────────────────────────────────
export default function FieldDetailPage() {
  const { fieldId } = useParams({ strict: false }) as { fieldId: string };
  const navigate = useNavigate();
  const { isAdmin, farmId } = useFarm();
  const { actor: backend } = useActor();

  const [field, setField] = useState<Field | null>(null);
  const [landRecord, setLandRecord] = useState<LandRecord | null>(null);
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fieldIdBig = BigInt(fieldId);

  useEffect(() => {
    if (!backend || !farmId) return;
    setLoading(true);

    Promise.all([
      backend.getFieldsForFarm(farmId),
      backend.getLandRecord(fieldIdBig),
      backend.getCropSeasonsForField(fieldIdBig),
    ])
      .then(([fieldsRes, lrRes, seasonsRes]) => {
        if (fieldsRes.__kind__ === "ok") {
          const f = fieldsRes.ok.find((f) => String(f.id) === fieldId);
          setField(f ?? null);
        }
        if (lrRes.__kind__ === "ok" && lrRes.ok) setLandRecord(lrRes.ok);
        if (seasonsRes.__kind__ === "ok") setSeasons(seasonsRes.ok);
      })
      .catch(() => toast.error("Khet jankari load nahi ho ski."))
      .finally(() => setLoading(false));
  }, [backend, farmId, fieldId, fieldIdBig]);

  const handleDelete = async () => {
    if (!backend) return;
    setDeleting(true);
    try {
      const res = await backend.deleteField(fieldIdBig);
      if (res.__kind__ === "ok") {
        toast.success("Khet delete ho gaya.");
        navigate({ to: "/fields" });
      } else {
        toast.error("Delete nahi ho saka.");
      }
    } catch {
      toast.error("Delete nahi ho saka.");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const currentFY = (() => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    return m >= 4
      ? `${y}-${String(y + 1).slice(-2)}`
      : `${y - 1}-${String(y).slice(-2)}`;
  })();

  const activeSeasons = seasons.filter((s) => s.financialYear === currentFY);
  const pastSeasons = seasons.filter((s) => s.financialYear !== currentFY);

  const shcSoon = isSHCExpiringSoon(field?.shcExpiry);
  const shcExpired = isSHCExpired(field?.shcExpiry);

  if (loading) {
    return (
      <div className="p-4 space-y-4" data-ocid="field_detail.loading_state">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="p-6 text-center" data-ocid="field_detail.error_state">
        <p className="text-muted-foreground">Khet nahi mila. Wapas jaiye.</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/fields" })}>
          Wapas Khet List
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background pb-10"
      data-ocid="field_detail.page"
    >
      {/* ── sticky header ── */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="p-0 w-8 h-8 flex-shrink-0"
                onClick={() => navigate({ to: "/fields" })}
                data-ocid="field_detail.back_button"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="font-display text-xl font-semibold text-foreground truncate">
                  {field.name}
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  {sqmToDisplay(field.areaSqm, field.unit)} • {field.tenure}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: `/fields/${fieldId}/edit` })}
                data-ocid="field_detail.edit_button"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setDeleteOpen(true)}
                  data-ocid="field_detail.delete_button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SHC alert banner ── */}
      {(shcExpired || shcSoon) && (
        <div
          className={`px-4 py-2.5 flex items-center gap-2 text-sm font-medium ${
            shcExpired
              ? "bg-red-50 text-red-700 border-b border-red-200"
              : "bg-amber-50 text-amber-700 border-b border-amber-200"
          }`}
          data-ocid="field_detail.shc_alert"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {shcExpired
            ? `SHC miyad khatm ho gayi — ${formatDate(field.shcExpiry)}`
            : `SHC renewal jald — ${formatDate(field.shcExpiry)} tak`}
        </div>
      )}

      {/* ── soil+irrigation quick badges ── */}
      <div className="px-4 pt-4 pb-2 flex flex-wrap gap-2">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${SOIL_COLORS[field.soilType] ?? "bg-muted text-muted-foreground"}`}
        >
          {field.soilType} Mitti
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
          <Droplets className="w-3 h-3 inline mr-0.5" />
          {field.irrigationType}
        </span>
      </div>

      {/* ── tabs ── */}
      <div className="px-4 md:px-6">
        <Tabs defaultValue="info">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="info" data-ocid="field_detail.info.tab">
              Jankari
            </TabsTrigger>
            <TabsTrigger value="records" data-ocid="field_detail.records.tab">
              Abhilekh
            </TabsTrigger>
            <TabsTrigger value="crops" data-ocid="field_detail.crops.tab">
              Fasal
            </TabsTrigger>
            <TabsTrigger value="shc" data-ocid="field_detail.shc.tab">
              SHC
            </TabsTrigger>
          </TabsList>

          {/* ── Info tab ── */}
          <TabsContent value="info" className="space-y-1">
            <div className="rounded-xl border border-border bg-card p-4">
              <InfoRow
                label="Kshetrafal"
                value={sqmToDisplay(field.areaSqm, field.unit)}
                icon={<Leaf className="w-3.5 h-3.5" />}
              />
              <InfoRow label="Mitti" value={field.soilType} />
              <InfoRow
                label="Sinchai"
                value={field.irrigationType}
                icon={<Droplets className="w-3.5 h-3.5" />}
              />
              <InfoRow label="Prakar" value={field.tenure} />
              {field.surveyNumber && (
                <InfoRow
                  label="Survey No."
                  value={field.surveyNumber}
                  icon={<MapPin className="w-3.5 h-3.5" />}
                />
              )}
              {field.ulpin && <InfoRow label="ULPIN" value={field.ulpin} />}
              <InfoRow label="Joda Gaya" value={formatDate(field.createdAt)} />
            </div>
          </TabsContent>

          {/* ── Land Records tab ── */}
          <TabsContent value="records">
            {landRecord ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Bhumi Abhilekh — {landRecord.state}
                  </span>
                </div>
                {landRecord.adangalNumber && (
                  <InfoRow
                    label="Adangal No."
                    value={landRecord.adangalNumber}
                  />
                )}
                {landRecord.pattadarPassbook && (
                  <InfoRow
                    label="Pattadar Passbook"
                    value={landRecord.pattadarPassbook}
                  />
                )}
                {landRecord.pahaniNumber && (
                  <InfoRow label="Pahani No." value={landRecord.pahaniNumber} />
                )}
                {landRecord.bhudhaarNumber && (
                  <InfoRow
                    label="Bhudhaar No."
                    value={landRecord.bhudhaarNumber}
                  />
                )}
                {landRecord.satbaraNumber && (
                  <InfoRow
                    label="Satbara (7/12)"
                    value={landRecord.satbaraNumber}
                  />
                )}
                {landRecord.rtcNumber && (
                  <InfoRow label="RTC / Pahani" value={landRecord.rtcNumber} />
                )}
                {landRecord.genericRecordNumber && (
                  <InfoRow
                    label="Land Record No."
                    value={landRecord.genericRecordNumber}
                  />
                )}
              </div>
            ) : (
              <div
                className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center"
                data-ocid="field_detail.records.empty_state"
              >
                <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Koi bhumi abhilekh nahi joda gaya
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate({ to: `/fields/${fieldId}/edit` })}
                  data-ocid="field_detail.records.add_button"
                >
                  Abhilekh Jodein
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Crops tab ── */}
          <TabsContent value="crops" className="space-y-4">
            {/* Active crops */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Is Saal ki Fasal (FY {currentFY})
              </p>
              {activeSeasons.length > 0 ? (
                <div className="space-y-2">
                  {activeSeasons.map((s, i) => (
                    <CropCard
                      key={String(s.id)}
                      season={s}
                      isActive
                      data-ocid={`field_detail.active_crop.${i + 1}`}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center"
                  data-ocid="field_detail.crops.empty_state"
                >
                  <Sprout className="w-7 h-7 text-muted-foreground/40 mx-auto mb-1.5" />
                  <p className="text-sm text-muted-foreground">
                    Is saal koi fasal nahi
                  </p>
                </div>
              )}
            </div>

            {/* Past crops */}
            {pastSeasons.length > 0 && (
              <div>
                <Separator className="mb-3" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Pichli Fasal (History)
                </p>
                <div className="space-y-2">
                  {pastSeasons.slice(0, 5).map((s) => (
                    <CropCard key={String(s.id)} season={s} isActive={false} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── SHC tab ── */}
          <TabsContent value="shc">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Soil Health Card
                </span>
              </div>

              {field.shcNumber ? (
                <div className="space-y-1">
                  <InfoRow label="SHC Number" value={field.shcNumber} />
                  <InfoRow label="Expiry" value={formatDate(field.shcExpiry)} />
                  {(shcExpired || shcSoon) && (
                    <div
                      className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                        shcExpired
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {shcExpired
                        ? "SHC miyad khatm — Renewal ki zaroorat hai"
                        : "SHC renewal jald — 90 din mein"}
                    </div>
                  )}
                  {!shcExpired && !shcSoon && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-xs font-medium text-primary">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      SHC valid hai
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="text-center py-4"
                  data-ocid="field_detail.shc.empty_state"
                >
                  <p className="text-sm text-muted-foreground">
                    Soil Health Card enter nahi kiya gaya
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate({ to: `/fields/${fieldId}/edit` })}
                    data-ocid="field_detail.shc.add_button"
                  >
                    SHC Jodein
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent data-ocid="field_detail.delete.dialog">
          <DialogHeader>
            <DialogTitle>Khet Delete Karein?</DialogTitle>
            <DialogDescription>
              "{field.name}" aur uski saari jankari hamesha ke liye mit jayegi.
              Yeh action wapas nahi ho sakti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              data-ocid="field_detail.delete.cancel_button"
            >
              Raddh Karein
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              data-ocid="field_detail.delete.confirm_button"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {deleting ? "Delete ho raha hai..." : "Haan, Delete Karein"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
