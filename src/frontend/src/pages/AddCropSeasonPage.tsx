import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { CropMSP, Field } from "../backend.d.ts";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";
import { usePageData } from "../hooks/usePageData";
import { kisanDB } from "../lib/db";

const CROPS_BY_SEASON: Record<string, string[]> = {
  Kharif: [
    "Paddy",
    "Cotton",
    "Groundnut",
    "Maize",
    "Tur",
    "Chilli",
    "Jowar",
    "Bajra",
    "Castor",
    "Sesame",
    "Sunflower",
    "Soybean",
    "Green gram",
    "Black gram",
    "Tobacco",
  ],
  Rabi: [
    "Wheat",
    "Chickpea",
    "Mustard",
    "Linseed",
    "Coriander",
    "Fenugreek",
    "Onion",
    "Potato",
    "Tomato",
    "Brinjal",
  ],
  Zaid: ["Watermelon", "Muskmelon", "Cucumber", "Bottle gourd", "Ridge gourd"],
  Boro: ["Boro Paddy"],
  Perennial: [
    "Banana",
    "Coconut",
    "Mango",
    "Jamun",
    "Sapota",
    "Guava",
    "Papaya",
    "Citrus",
  ],
};

const CROP_TO_SEASON: Record<string, string> = Object.entries(
  CROPS_BY_SEASON,
).reduce<Record<string, string>>((acc, [season, crops]) => {
  for (const c of crops) acc[c] = season;
  return acc;
}, {});

const CROP_VARIETIES: Record<string, string[]> = {
  Paddy: [
    "BPT 5204",
    "Sona Masuri",
    "HMT Rice",
    "MTU 1010",
    "Rajendra Bhagwati",
  ],
  Wheat: ["HD 2967", "PBW 343", "K 307", "GW 496"],
  Cotton: ["Bunny BG-II", "MRC 7017", "Ankur 651"],
  Maize: ["NK 6240", "Pioneer 30V92", "DKC 9081"],
  Groundnut: ["K 6", "ICGS 76", "GG 20"],
};

const HARVEST_DAYS: Record<string, number> = {
  Paddy: 105,
  "Boro Paddy": 135,
  Wheat: 135,
  Maize: 90,
  Cotton: 150,
  Groundnut: 120,
  Soybean: 100,
  Tur: 180,
  Bajra: 75,
  Jowar: 110,
  Mustard: 120,
  Chickpea: 130,
  Banana: 270,
  Mango: 365,
  Coconut: 365,
};

function getCurrentFY(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return month >= 4
    ? `${year}-${String(year + 1).slice(-2)}`
    : `${year - 1}-${String(year).slice(-2)}`;
}

function toTimestamp(dateStr: string): bigint {
  return BigInt(new Date(dateStr).getTime() * 1_000_000);
}

export default function AddCropSeasonPage() {
  const navigate = useNavigate();
  const { farmId } = useFarm();
  const { actor } = useActor();

  const [fieldId, setFieldId] = useState("");
  const [cropSearch, setCropSearch] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [variety, setVariety] = useState("");
  const [season, setSeason] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [expectedYield, setExpectedYield] = useState("");
  const [isInterCrop, setIsInterCrop] = useState(false);
  const [parentCropId, setParentCropId] = useState("");
  const [mspData, setMspData] = useState<CropMSP | null>(null);
  const [saving, setSaving] = useState(false);

  const currentFY = getCurrentFY();
  const CACHE_KEY_FIELDS = `fields_farm_${String(farmId)}`;

  const { data: fields } = usePageData(async () => {
    if (!actor || !farmId) return [] as Field[];
    // Try IndexedDB cache first (Build 1 schema)
    try {
      const cached = await kisanDB.getCache(CACHE_KEY_FIELDS);
      if (cached && Date.now() - cached.cachedAt < 10 * 60 * 1000) {
        return cached.data as Field[];
      }
    } catch {
      /* cache miss */
    }
    const result = await actor.getFieldsForFarm(farmId);
    if (result.__kind__ === "ok") {
      try {
        await kisanDB.setCache(CACHE_KEY_FIELDS, result.ok);
      } catch {
        /* non-critical */
      }
      return result.ok;
    }
    return [] as Field[];
  }, [actor, farmId]);

  const { data: cropSeasons } = usePageData(async () => {
    if (!actor || !farmId) return [];
    const result = await actor.getCropSeasonsForFarm(farmId, currentFY);
    return result.__kind__ === "ok" ? result.ok : [];
  }, [actor, farmId, currentFY]);

  const allCrops = useMemo(() => {
    const all: string[] = [];
    for (const crops of Object.values(CROPS_BY_SEASON)) all.push(...crops);
    return all;
  }, []);

  const filteredCrops = useMemo(() => {
    if (!cropSearch) return null;
    const q = cropSearch.toLowerCase();
    return allCrops.filter((c) => c.toLowerCase().includes(q));
  }, [allCrops, cropSearch]);

  const handleCropSelect = async (crop: string) => {
    setSelectedCrop(crop);
    setCropSearch(crop);
    const detectedSeason = CROP_TO_SEASON[crop] ?? "";
    setSeason(detectedSeason);
    // Auto-suggest harvest date
    if (sowingDate && HARVEST_DAYS[crop]) {
      const d = new Date(sowingDate);
      d.setDate(d.getDate() + HARVEST_DAYS[crop]);
      setHarvestDate(d.toISOString().split("T")[0]);
    }
    // Fetch MSP
    if (actor && detectedSeason) {
      try {
        const result = await actor.getCropMSP(crop, detectedSeason, currentFY);
        if (result.__kind__ === "ok" && result.ok) setMspData(result.ok);
        else setMspData(null);
      } catch {
        setMspData(null);
      }
    }
  };

  const handleSowingChange = (val: string) => {
    setSowingDate(val);
    if (val && selectedCrop && HARVEST_DAYS[selectedCrop]) {
      const d = new Date(val);
      d.setDate(d.getDate() + HARVEST_DAYS[selectedCrop]);
      setHarvestDate(d.toISOString().split("T")[0]);
    }
  };

  const handleFieldChange = (fid: string) => {
    setFieldId(fid);
    const field = fields?.find((f) => String(f.id) === fid);
    if (field && !areaSqm) setAreaSqm(String(Number(field.areaSqm)));
  };

  const canSave =
    fieldId && selectedCrop && season && sowingDate && harvestDate;

  const handleSave = async () => {
    if (!actor || !farmId || !canSave) return;
    setSaving(true);
    try {
      const result = await actor.createCropSeason(
        farmId,
        BigInt(fieldId),
        selectedCrop,
        variety || "",
        season,
        currentFY,
        BigInt(Math.round(Number(areaSqm) || 0)),
        toTimestamp(sowingDate),
        toTimestamp(harvestDate),
        mspData ? mspData.mspPerQuintal : null,
        isInterCrop,
        isInterCrop && parentCropId ? BigInt(parentCropId) : null,
      );
      if (result.__kind__ === "ok") {
        toast.success("Fasal season safaltapoorvak joda gaya!");
        navigate({ to: "/crops" });
      } else {
        toast.error(`Error: ${result.err}`);
      }
    } catch (_err) {
      toast.error("Fasal jodne mein dikkat aayi. Dobara try karein.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      data-ocid="add-crop-season.page"
    >
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 shadow-sm flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/crops" })}
          className="p-1 -ml-1"
          data-ocid="add-crop-season.back_button"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl text-primary font-bold">
          Naya Fasal Season
        </h1>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto pb-24">
        {/* Field selector */}
        <div className="space-y-1.5">
          <Label>Khet chunein *</Label>
          <Select value={fieldId} onValueChange={handleFieldChange}>
            <SelectTrigger data-ocid="add-crop-season.field_select">
              <SelectValue placeholder="Apna khet chunein" />
            </SelectTrigger>
            <SelectContent>
              {(fields ?? []).map((f) => (
                <SelectItem key={String(f.id)} value={String(f.id)}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Crop name */}
        <div className="space-y-1.5">
          <Label>Fasal ka naam *</Label>
          <div className="relative">
            <Input
              placeholder="Fasal khojein (Paddy, Wheat...)"
              value={cropSearch}
              onChange={(e) => setCropSearch(e.target.value)}
              data-ocid="add-crop-season.crop_input"
            />
            {filteredCrops &&
              filteredCrops.length > 0 &&
              cropSearch &&
              selectedCrop !== cropSearch && (
                <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
                  {filteredCrops.slice(0, 12).map((crop) => (
                    <button
                      key={crop}
                      type="button"
                      onClick={() => handleCropSelect(crop)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <span className="font-medium">{crop}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {CROP_TO_SEASON[crop]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
          </div>
          {/* Grouped dropdown fallback */}
          {!selectedCrop && (
            <Select onValueChange={handleCropSelect}>
              <SelectTrigger
                className="mt-1"
                data-ocid="add-crop-season.crop_select"
              >
                <SelectValue placeholder="Ya yahan se chunein" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Object.entries(CROPS_BY_SEASON).map(([seasonName, crops]) => (
                  <SelectGroup key={seasonName}>
                    <SelectLabel>{seasonName}</SelectLabel>
                    {crops.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* MSP badge if available */}
        {mspData && (
          <div className="flex items-center gap-2 bg-accent/20 border border-accent/40 rounded-lg px-4 py-2.5">
            <CheckCircle className="w-4 h-4 text-accent-foreground shrink-0" />
            <p className="text-sm text-accent-foreground">
              <span className="font-semibold">MSP 2025-26:</span> ₹
              {Number(mspData.mspPerQuintal).toLocaleString("en-IN")}/quintal
            </p>
          </div>
        )}

        {/* Variety */}
        <div className="space-y-1.5">
          <Label>Variety (optional)</Label>
          <Select value={variety} onValueChange={setVariety}>
            <SelectTrigger data-ocid="add-crop-season.variety_select">
              <SelectValue placeholder="Variety chunein ya khud likhein" />
            </SelectTrigger>
            <SelectContent>
              {(CROP_VARIETIES[selectedCrop] ?? []).map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
              <SelectItem value="other">Other / Koi bhi</SelectItem>
            </SelectContent>
          </Select>
          {(variety === "other" || !CROP_VARIETIES[selectedCrop]) && (
            <Input
              placeholder="Variety ka naam likhein"
              value={variety === "other" ? "" : variety}
              onChange={(e) => setVariety(e.target.value)}
            />
          )}
        </div>

        {/* Season */}
        <div className="space-y-1.5">
          <Label>Season *</Label>
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger data-ocid="add-crop-season.season_select">
              <SelectValue placeholder="Season chunein" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CROPS_BY_SEASON).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Financial Year */}
        <div className="space-y-1.5">
          <Label>Financial Year</Label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{currentFY} (Apr–Mar)</span>
          </div>
        </div>

        {/* Area */}
        <div className="space-y-1.5">
          <Label>Area (varg meter mein) *</Label>
          <Input
            type="number"
            placeholder="e.g. 6075 (1.5 acres)"
            value={areaSqm}
            onChange={(e) => setAreaSqm(e.target.value)}
            data-ocid="add-crop-season.area_input"
          />
          {areaSqm && (
            <p className="text-xs text-muted-foreground">
              {(Number(areaSqm) / 4047).toFixed(2)} acres
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Buwai ki taareekh *</Label>
            <Input
              type="date"
              value={sowingDate}
              onChange={(e) => handleSowingChange(e.target.value)}
              data-ocid="add-crop-season.sowing_date_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Expected Harvest *</Label>
            <Input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              data-ocid="add-crop-season.harvest_date_input"
            />
          </div>
        </div>
        {selectedCrop && HARVEST_DAYS[selectedCrop] && (
          <p className="text-xs text-muted-foreground -mt-3">
            {selectedCrop} ke liye ~{HARVEST_DAYS[selectedCrop]} din
            auto-suggest kiya gaya
          </p>
        )}

        {/* Expected yield */}
        <div className="space-y-1.5">
          <Label>Expected yield in quintals (optional)</Label>
          <Input
            type="number"
            placeholder="e.g. 25"
            value={expectedYield}
            onChange={(e) => setExpectedYield(e.target.value)}
            data-ocid="add-crop-season.yield_input"
          />
        </div>

        {/* Inter-crop toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-secondary rounded-lg border border-border">
          <div>
            <p className="text-sm font-medium">Kya yeh inter-crop hai?</p>
            <p className="text-xs text-muted-foreground">
              Ek hi khet mein do fasal ek saath
            </p>
          </div>
          <Switch
            checked={isInterCrop}
            onCheckedChange={setIsInterCrop}
            data-ocid="add-crop-season.intercrop_toggle"
          />
        </div>

        {isInterCrop && (
          <div className="space-y-1.5">
            <Label>Primary crop chunein</Label>
            <Select value={parentCropId} onValueChange={setParentCropId}>
              <SelectTrigger data-ocid="add-crop-season.parent_crop_select">
                <SelectValue placeholder="Primary fasal kaunsi hai?" />
              </SelectTrigger>
              <SelectContent>
                {(cropSeasons ?? [])
                  .filter((cs) => !cs.isInterCrop)
                  .map((cs) => (
                    <SelectItem key={String(cs.id)} value={String(cs.id)}>
                      {cs.cropName} — {cs.variety || cs.season}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Save */}
        <Button
          className="w-full"
          disabled={!canSave || saving}
          onClick={handleSave}
          data-ocid="add-crop-season.submit_button"
        >
          {saving ? "Saving..." : "Season Jodein"}
        </Button>
      </div>
    </div>
  );
}
