import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";

// ── conversion ───────────────────────────────────────────────────────────────
type AreaUnit = "Acres" | "Guntha" | "Cents" | "Bigha" | "Hectares";
const AREA_UNITS: AreaUnit[] = [
  "Acres",
  "Guntha",
  "Cents",
  "Bigha",
  "Hectares",
];

function toSqm(value: number, unit: AreaUnit): number {
  switch (unit) {
    case "Acres":
      return value * 4046.86;
    case "Guntha":
      return value * 101.17;
    case "Cents":
      return value * 40.47;
    case "Bigha":
      return value * 2529.29;
    case "Hectares":
      return value * 10000;
    default:
      return value * 4046.86;
  }
}

const SOIL_TYPES = [
  "Red",
  "Black (Regur)",
  "Alluvial",
  "Laterite",
  "Sandy",
  "Loamy",
  "Clay",
];
const IRRIGATION_TYPES = [
  "Borewell",
  "Canal",
  "Tank",
  "Rainwater",
  "Drip",
  "Sprinkler",
];
const TENURE_TYPES = ["Owned", "Leased", "Shared"];

// ── state-adaptive land records ───────────────────────────────────────────────
interface LandRecordField {
  key: string;
  label: string;
  placeholder: string;
}

function getLandRecordFields(state: string): LandRecordField[] {
  const s = state.toUpperCase();
  if (s === "ANDHRA PRADESH" || s === "AP")
    return [
      {
        key: "adangalNumber",
        label: "Adangal Number (ఆదంగల్)",
        placeholder: "e.g. ADG-2024-001",
      },
      {
        key: "pattadarPassbook",
        label: "Pattadar Passbook Number (పట్టాదార్)",
        placeholder: "Optional",
      },
    ];
  if (s === "TELANGANA" || s === "TG")
    return [
      {
        key: "pahaniNumber",
        label: "Pahani Number (పహని)",
        placeholder: "e.g. PHN-2024-001",
      },
      {
        key: "bhudhaarNumber",
        label: "Bhudhaar Number (భూధార్, Optional)",
        placeholder: "Optional",
      },
    ];
  if (s === "MAHARASHTRA" || s === "MH")
    return [
      {
        key: "satbaraNumber",
        label: "Satbara (7/12) Extract Number",
        placeholder: "e.g. 7/12-2024",
      },
    ];
  if (s === "KARNATAKA" || s === "KA")
    return [
      {
        key: "rtcNumber",
        label: "RTC / Pahani Number",
        placeholder: "Optional",
      },
    ];
  return [
    {
      key: "genericRecordNumber",
      label: "Land Record Number",
      placeholder: "Optional",
    },
  ];
}

function isSHCExpiringSoon(dateStr: string): boolean {
  if (!dateStr) return false;
  const exp = new Date(dateStr).getTime();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  return exp - Date.now() <= ninetyDays && exp > Date.now();
}

// ── form types ────────────────────────────────────────────────────────────────
interface FormValues {
  name: string;
  areaValue: string;
  unit: AreaUnit;
  soilType: string;
  irrigationType: string;
  tenure: string;
  surveyNumber: string;
  ulpin: string;
  shcNumber: string;
  shcExpiry: string;
  // land record fields (dynamic)
  adangalNumber: string;
  pattadarPassbook: string;
  pahaniNumber: string;
  bhudhaarNumber: string;
  satbaraNumber: string;
  rtcNumber: string;
  genericRecordNumber: string;
}

// ── section wrapper ────────────────────────────────────────────────────────────
function Section({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  helper,
  children,
  error,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {helper && <p className="text-[11px] text-muted-foreground">{helper}</p>}
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function AddFieldPage() {
  const { farmId, farm } = useFarm();
  const { actor: backend } = useActor();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const farmState = farm?.state ?? "";
  const landFields = getLandRecordFields(farmState);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      areaValue: "",
      unit: "Acres",
      soilType: "Red",
      irrigationType: "Borewell",
      tenure: "Owned",
      surveyNumber: "",
      ulpin: "",
      shcNumber: "",
      shcExpiry: "",
      adangalNumber: "",
      pattadarPassbook: "",
      pahaniNumber: "",
      bhudhaarNumber: "",
      satbaraNumber: "",
      rtcNumber: "",
      genericRecordNumber: "",
    },
  });

  const unitVal = watch("unit");
  const soilVal = watch("soilType");
  const irrigationVal = watch("irrigationType");
  const tenureVal = watch("tenure");
  const shcExpiry = watch("shcExpiry");
  const shcWarningSoon = isSHCExpiringSoon(shcExpiry);

  const onSubmit = async (data: FormValues) => {
    if (!backend || !farmId) return;
    setSubmitting(true);
    try {
      const areaSqm = BigInt(
        Math.round(toSqm(Number.parseFloat(data.areaValue), data.unit)),
      );
      const shcExpiryTs: bigint | null = data.shcExpiry
        ? BigInt(Math.floor(new Date(data.shcExpiry).getTime() / 1000))
        : null;

      const result = await backend.createField(
        farmId,
        data.name.trim(),
        areaSqm,
        data.unit,
        data.soilType,
        data.irrigationType,
        data.tenure,
        data.surveyNumber.trim() || null,
        data.ulpin.trim() || null,
        data.shcNumber.trim() || null,
        shcExpiryTs,
        [],
      );

      if (result.__kind__ !== "ok") {
        toast.error("Khet jodne mein samasya. Dobara koshish karein.");
        return;
      }

      const fieldId = result.ok.id;

      // save land records if any were entered
      const hasLandRecord = landFields.some((lf) => {
        const v = (data as unknown as Record<string, string>)[lf.key];
        return v && v.trim() !== "";
      });

      if (hasLandRecord) {
        await backend.saveLandRecord(fieldId, {
          state: farmState,
          adangalNumber: data.adangalNumber.trim() || undefined,
          pattadarPassbook: data.pattadarPassbook.trim() || undefined,
          pahaniNumber: data.pahaniNumber.trim() || undefined,
          bhudhaarNumber: data.bhudhaarNumber.trim() || undefined,
          satbaraNumber: data.satbaraNumber.trim() || undefined,
          rtcNumber: data.rtcNumber.trim() || undefined,
          genericRecordNumber: data.genericRecordNumber.trim() || undefined,
        });
      }

      toast.success(`"${data.name}" khet safaltapurvak joda gaya!`);
      navigate({ to: `/fields/${String(fieldId)}` });
    } catch {
      toast.error("Khet jodne mein samasya. Dobara koshish karein.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background pb-10"
      data-ocid="add_field.page"
    >
      {/* sticky header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 py-3 md:px-6 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-0 w-8 h-8"
            onClick={() => navigate({ to: "/fields" })}
            data-ocid="add_field.back_button"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground leading-tight">
              Naya Khet Jodein
            </h1>
            {farmState && (
              <p className="text-[11px] text-muted-foreground">
                {farm?.name} • {farmState}
              </p>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="px-4 py-4 md:px-6 space-y-4 max-w-2xl mx-auto"
      >
        {/* ── Basic Info ─────────────────────────────────────────────── */}
        <Section title="Khet ki Jankari">
          <FieldGroup label="Khet ka Naam *" error={errors.name?.message}>
            <Input
              placeholder="jaise: Uttari Khet, Doosra Khet"
              data-ocid="add_field.name.input"
              {...register("name", { required: "Khet ka naam zaroori hai" })}
            />
          </FieldGroup>

          <FieldGroup
            label="Kshetrafal (Area) *"
            error={errors.areaValue?.message}
          >
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1.5"
                className="flex-1"
                data-ocid="add_field.area.input"
                {...register("areaValue", {
                  required: "Kshetrafal zaroori hai",
                  min: { value: 0.01, message: "0 se adhik hona chahiye" },
                })}
              />
              <Select
                value={unitVal}
                onValueChange={(v) => setValue("unit", v as AreaUnit)}
              >
                <SelectTrigger
                  className="w-32"
                  data-ocid="add_field.unit.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREA_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FieldGroup>

          <FieldGroup label="Mitti ka Prakar *">
            <Select
              value={soilVal}
              onValueChange={(v) => setValue("soilType", v)}
            >
              <SelectTrigger data-ocid="add_field.soiltype.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOIL_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Sinchai ka Prakar *">
            <Select
              value={irrigationVal}
              onValueChange={(v) => setValue("irrigationType", v)}
            >
              <SelectTrigger data-ocid="add_field.irrigation.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IRRIGATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Zameen ka Prakar *">
            <Select
              value={tenureVal}
              onValueChange={(v) => setValue("tenure", v)}
            >
              <SelectTrigger data-ocid="add_field.tenure.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TENURE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>
        </Section>

        {/* ── Survey & ULPIN ─────────────────────────────────────────── */}
        <Section title="Survey & Parichay (Vaikalpik)">
          <FieldGroup
            label="Survey Number (वैकल्पिक)"
            helper="Apne dastavej par likha survey number (optional)"
          >
            <Input
              placeholder="jaise: 123/A"
              data-ocid="add_field.survey_number.input"
              {...register("surveyNumber")}
            />
          </FieldGroup>

          <FieldGroup
            label="ULPIN (वैकल्पिक)"
            helper="Unique Land Parcel ID — optional"
          >
            <Input
              placeholder="ULPIN code"
              data-ocid="add_field.ulpin.input"
              {...register("ulpin")}
            />
          </FieldGroup>
        </Section>

        {/* ── Soil Health Card ────────────────────────────────────────── */}
        <Section title="Soil Health Card (SHC)">
          <FieldGroup
            label="SHC Number (वैकल्पिक)"
            helper="Mitti swasthya card par likha number"
          >
            <Input
              placeholder="SHC-2024-XXXXX"
              data-ocid="add_field.shc_number.input"
              {...register("shcNumber")}
            />
          </FieldGroup>

          <FieldGroup label="SHC Expiry Date (वैकल्पिक)">
            <Input
              type="date"
              data-ocid="add_field.shc_expiry.input"
              {...register("shcExpiry")}
            />
            {shcExpiry && shcWarningSoon && (
              <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  SHC renewal jald deya! (90 din ke andar)
                </p>
              </div>
            )}
          </FieldGroup>
        </Section>

        {/* ── State-adaptive land records ─────────────────────────────── */}
        <Section title={`Bhumi Abhilekh — ${farmState || "Other State"}`}>
          {landFields.map((lf) => (
            <FieldGroup key={lf.key} label={lf.label}>
              <Input
                placeholder={lf.placeholder}
                data-ocid={`add_field.${lf.key}.input`}
                {...register(lf.key as keyof FormValues)}
              />
            </FieldGroup>
          ))}
          <p className="text-[11px] text-muted-foreground mt-1">
            Sabhi bhumi abhilekh vaikalpik hain — khet banane ke liye zaroori
            nahi.
          </p>
        </Section>

        {/* ── GPS boundary placeholder ────────────────────────────────── */}
        <Section title="GPS Seema (Aane Wale Update Mein)">
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 flex flex-col items-center text-center gap-2">
            <MapPin className="w-6 h-6 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              GPS boundary marking — agli baar tap karke corners mark karein
            </p>
            <Badge variant="outline" className="text-[10px]">
              Coming Soon
            </Badge>
          </div>
        </Section>

        {/* ── Submit ─────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate({ to: "/fields" })}
            data-ocid="add_field.cancel_button"
          >
            Raddh Karein
          </Button>
          <Button
            type="submit"
            className="flex-1 gap-2"
            disabled={submitting}
            data-ocid="add_field.submit_button"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Jod rahe hain...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Khet Jodein
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
