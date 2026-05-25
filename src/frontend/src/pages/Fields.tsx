import { Loader2, Pencil, Plus, Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CropSeason, Field } from "../backend.d.ts";
import { AddFieldSheet } from "../components/forms/AddFieldSheet";
import { EditFieldSheet } from "../components/forms/EditFieldSheet";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";

// ── helpers ─────────────────────────────────────────────────────────────────
function sqmToAcres(sqm: bigint | number): string {
  const n = typeof sqm === "bigint" ? Number(sqm) : sqm;
  return (n / 4046.86).toFixed(2);
}

function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 4) return `${year}-${String(year + 1).slice(-2)}`;
  return `${year - 1}-${String(year).slice(-2)}`;
}

export default function Fields() {
  const { farmId, userRole } = useFarm();
  const canWrite = userRole !== "ViewOnly";
  const { actor: backend } = useActor();

  const [fields, setFields] = useState<Field[]>([]);
  const [seasonsByField, setSeasonsByField] = useState<
    Record<string, CropSeason[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAddField, setShowAddField] = useState(false);
  const [editField, setEditField] = useState<Field | null>(null);

  const financialYear = getCurrentFinancialYear();

  const loadData = () => {
    if (!backend || !farmId) return;
    setIsLoading(true);
    backend
      .getFieldsForFarm(farmId)
      .then(async (result) => {
        if (result.__kind__ !== "ok") return;
        const fs = result.ok;
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
      .catch((err) => {
        console.error(err);
        toast.error("خेत लोड नहीं हो सके। दोबारा कोशिश करें।");
      })
      .finally(() => setIsLoading(false));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: farmId is the trigger
  useEffect(() => {
    loadData();
  }, [backend, farmId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6" data-ocid="fields.page">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold font-display text-foreground">
            خेत प्रबंधन
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {fields.length} {fields.length === 1 ? "خेत" : "خेत"} • FY{" "}
            {financialYear}
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => setShowAddField(true)}
            size="sm"
            data-ocid="fields.add_field.button"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            خेत जोड़ें
          </Button>
        )}
      </div>

      {/* Field list */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="fields.loading_state"
        >
          {["a", "b", "c"].map((k) => (
            <Card key={k}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : fields.length === 0 ? (
        <Card
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="fields.empty_state"
        >
          <Sprout className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-foreground font-medium mb-1">
            अभी तक कोई خेत नहीं है
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            अपना पहला خेत जोड़ें और फसल का रिकॉर्ड रखना शुरू करें
          </p>
          {canWrite && (
            <Button
              onClick={() => setShowAddField(true)}
              data-ocid="fields.empty_state.add_button"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              पहला خेत जोड़ें
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field, i) => {
            const seasons = seasonsByField[String(field.id)] ?? [];
            const activeSeason = seasons.find(
              (s) => s.financialYear === financialYear,
            );
            return (
              <Card
                key={String(field.id)}
                className="hover:shadow-md transition-shadow cursor-pointer"
                data-ocid={`fields.item.${i + 1}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {field.name}
                    </CardTitle>
                    {canWrite && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 flex-shrink-0"
                        onClick={() => setEditField(field)}
                        data-ocid={`fields.edit_button.${i + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sqmToAcres(field.areaSqm)} एकड़ &bull; {field.tenure}
                  </p>
                </CardHeader>
                <CardContent className="pt-1 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {field.soilType && (
                      <Badge variant="outline" className="text-xs">
                        {field.soilType}
                      </Badge>
                    )}
                    {field.irrigationType && (
                      <Badge variant="outline" className="text-xs">
                        {field.irrigationType}
                      </Badge>
                    )}
                  </div>
                  {activeSeason ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Sprout className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">
                        {activeSeason.cropName}
                      </span>
                      {activeSeason.variety && (
                        <span className="text-muted-foreground text-xs">
                          ({activeSeason.variety})
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      इस साल कोई फसल नहीं मिली
                    </p>
                  )}
                  {field.surveyNumber && (
                    <p className="text-xs text-muted-foreground">
                      Survey: {field.surveyNumber}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sheets */}
      <AddFieldSheet
        open={showAddField}
        onOpenChange={setShowAddField}
        onSuccess={loadData}
      />
      {editField && (
        <EditFieldSheet
          open={!!editField}
          onOpenChange={(open) => !open && setEditField(null)}
          field={editField}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
