import type { UpdateFarmInput } from "@/backend.d.ts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFarm } from "@/context/FarmContext";
import { useActor } from "@/hooks/useActor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, HelpCircle, MapPin, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SQM_PER_ACRE = 4046.86;
const SQM_PER_HECTARE = 10000;

function sqmToAcres(sqm: bigint | number): number {
  return Number(sqm) / SQM_PER_ACRE;
}
function sqmToHectares(sqm: bigint | number): number {
  return Number(sqm) / SQM_PER_HECTARE;
}

const PURPOSE_LABELS: Record<string, string> = {
  Crop: "Fasal",
  Horticulture: "Bagwani",
  Dairy: "Dairy",
  Poultry: "Murgi Palan",
  Fishery: "Machhli",
  Greenhouse: "Greenhouse",
  Solar: "Solar",
  Mixed: "Misrit",
};

export default function FarmProfilePage() {
  const { farm, updateFarm } = useFarm();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editOwnership, setEditOwnership] = useState("");
  const [editSurvey, setEditSurvey] = useState("");
  const [savingField, setSavingField] = useState<string | null>(null);

  const { data: freshFarm, isLoading } = useQuery({
    queryKey: ["farm", farm?.id?.toString()],
    queryFn: async () => {
      if (!actor || !farm) return null;
      const result = await actor.getFarm(farm.id);
      return result.__kind__ === "ok" ? result.ok : null;
    },
    enabled: !!actor && !!farm,
  });

  const displayFarm = freshFarm ?? farm;

  function handleEditStart() {
    if (!displayFarm) return;
    setEditName(displayFarm.name);
    setEditArea(String(sqmToAcres(displayFarm.totalAreaSqm).toFixed(2)));
    setEditOwnership(displayFarm.ownershipType);
    setEditSurvey(displayFarm.surveyNumber ?? "");
    setEditMode(true);
  }

  async function handleSave() {
    if (!displayFarm) return;
    setSavingField("all");
    const areaSqm = BigInt(
      Math.round(Number.parseFloat(editArea) * SQM_PER_ACRE),
    );
    const updates: UpdateFarmInput = {
      name: editName,
      totalAreaSqm: areaSqm,
      ownershipType: editOwnership,
      surveyNumber: editSurvey || undefined,
    };
    const ok = await updateFarm(updates as Parameters<typeof updateFarm>[0]);
    setSavingField(null);
    if (ok) {
      toast.success("Farm details saved!");
      queryClient.invalidateQueries({ queryKey: ["farm"] });
      setEditMode(false);
    } else {
      toast.error("Save failed — try again");
    }
  }

  function copyKsId() {
    if (!displayFarm?.ksId) return;
    navigator.clipboard.writeText(displayFarm.ksId);
    toast.success("KS Farm ID copied!");
  }

  if (isLoading && !displayFarm) {
    return (
      <div className="p-4 space-y-4" data-ocid="farm_profile.loading_state">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!displayFarm) {
    return (
      <div
        className="p-4 text-center text-muted-foreground"
        data-ocid="farm_profile.error_state"
      >
        Farm load nahi ho saka. Refresh karein.
      </div>
    );
  }

  const acres = sqmToAcres(displayFarm.totalAreaSqm);
  const hectares = sqmToHectares(displayFarm.totalAreaSqm);

  return (
    <div
      className="min-h-screen bg-background pb-24"
      data-ocid="farm_profile.page"
    >
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 pt-4 pb-3 flex items-center justify-between shadow-sm">
        <h1
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Mera Kheta
        </h1>
        {!editMode ? (
          <Button
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={handleEditStart}
            data-ocid="farm_profile.edit_button"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(false)}
              data-ocid="farm_profile.cancel_button"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground"
              onClick={handleSave}
              disabled={savingField === "all"}
              data-ocid="farm_profile.save_button"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {savingField === "all" ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
        {/* KS Farm ID Card */}
        <div
          className="rounded-xl p-4 flex items-start justify-between gap-3"
          style={{ background: "oklch(0.38 0.11 148)" }}
          data-ocid="farm_profile.ks_id_card"
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              KS Farm ID
            </p>
            <p
              className="text-xl font-bold mt-0.5 tracking-wider truncate"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: "#fff",
              }}
            >
              {displayFarm.ksId}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              CA aur sarkari kaam mein use karein
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              style={{ color: "rgba(255,255,255,0.85)" }}
              onClick={copyKsId}
              aria-label="Copy KS Farm ID"
              data-ocid="farm_profile.ks_id_copy_button"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  aria-label="KS Farm ID ke baare mein jaankari"
                  data-ocid="farm_profile.ks_id_info_button"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[220px] text-xs">
                Yeh aapka unique Kisan Seva ID hai. CA aur sarkari kaam mein use
                karein.
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Farm Details Card */}
        <Card
          className="border-l-4 shadow-sm"
          style={{ borderLeftColor: "oklch(0.38 0.11 148)" }}
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              Farm Details
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Farm Name */}
            <div data-ocid="farm_profile.name_field">
              <p className="text-xs text-muted-foreground block mb-1">
                Farm ka Naam
              </p>
              {editMode ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border-primary/40 focus:border-primary"
                  data-ocid="farm_profile.name_input"
                />
              ) : (
                <p className="font-semibold text-foreground">
                  {displayFarm.name}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <p className="text-xs text-muted-foreground block mb-1">
                <MapPin className="inline h-3 w-3 mr-1" />
                Location
              </p>
              <p className="text-foreground text-sm">
                {displayFarm.village}, {displayFarm.mandal} Mandal,{" "}
                {displayFarm.district}, {displayFarm.state}
              </p>
            </div>

            {/* Total Area */}
            <div data-ocid="farm_profile.area_field">
              <p className="text-xs text-muted-foreground block mb-1">
                Total Zameen
              </p>
              {editMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    className="border-primary/40 focus:border-primary w-32"
                    data-ocid="farm_profile.area_input"
                  />
                  <span className="text-sm text-muted-foreground">Acres</span>
                </div>
              ) : (
                <p className="font-semibold text-foreground">
                  {acres.toFixed(2)} Acres
                  <span className="text-muted-foreground font-normal text-sm ml-2">
                    / {hectares.toFixed(2)} Hectares
                  </span>
                </p>
              )}
            </div>

            {/* Ownership Type */}
            <div data-ocid="farm_profile.ownership_field">
              <p className="text-xs text-muted-foreground block mb-1">
                Zameen ka Haq (Ownership)
              </p>
              {editMode ? (
                <Input
                  value={editOwnership}
                  onChange={(e) => setEditOwnership(e.target.value)}
                  placeholder="Owned / Leased / Shared..."
                  className="border-primary/40 focus:border-primary"
                  data-ocid="farm_profile.ownership_input"
                />
              ) : (
                <p className="font-semibold text-foreground">
                  {displayFarm.ownershipType}
                </p>
              )}
            </div>

            {/* Survey Number */}
            <div data-ocid="farm_profile.survey_field">
              <p className="text-xs text-muted-foreground block mb-1">
                Survey Number
              </p>
              {editMode ? (
                <Input
                  value={editSurvey}
                  onChange={(e) => setEditSurvey(e.target.value)}
                  placeholder="Optional — enter if available"
                  className="border-primary/40 focus:border-primary"
                  data-ocid="farm_profile.survey_input"
                />
              ) : displayFarm.surveyNumber ? (
                <p className="font-semibold text-foreground font-mono text-sm">
                  {displayFarm.surveyNumber}
                </p>
              ) : (
                <button
                  type="button"
                  className="text-sm text-primary underline underline-offset-2 flex items-center gap-1"
                  onClick={handleEditStart}
                  data-ocid="farm_profile.survey_add_button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Abhi tak nahi diya — Jodein
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Farm purposes */}
        {displayFarm.purposes.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="px-4 py-4">
              <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3">
                Farm ka Prakar
              </p>
              <div
                className="flex flex-wrap gap-2"
                data-ocid="farm_profile.purposes_list"
              >
                {displayFarm.purposes.map((p, i) => (
                  <Badge
                    key={p}
                    className="bg-primary/10 text-primary border border-primary/30 font-medium px-3 py-1"
                    data-ocid={`farm_profile.purpose.${i + 1}`}
                  >
                    {PURPOSE_LABELS[p] ?? p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
