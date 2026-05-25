import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFarm } from "@/context/FarmContext";
import { useActor } from "@/hooks/useActor";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type AreaUnit = "Acres" | "Guntha" | "Cents" | "Bigha" | "Hectares";

const AREA_UNITS: AreaUnit[] = [
  "Acres",
  "Guntha",
  "Cents",
  "Bigha",
  "Hectares",
];

// Convert user input to square meters
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

interface FormValues {
  name: string;
  areaValue: string;
  unit: AreaUnit;
  soilType: string;
  irrigationType: string;
  tenure: string;
  surveyNumber: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddFieldSheet({ open, onOpenChange, onSuccess }: Props) {
  const { farmId } = useFarm();
  const { actor: backend } = useActor();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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
    },
  });

  const unit = watch("unit");
  const soilType = watch("soilType");
  const irrigationType = watch("irrigationType");
  const tenure = watch("tenure");

  const onSubmit = async (data: FormValues) => {
    if (!backend || !farmId) return;
    setSubmitting(true);
    try {
      const areaNum = Number.parseFloat(data.areaValue);
      const areaSqm = BigInt(Math.round(toSqm(areaNum, data.unit)));
      const surveyNumber: string | null = data.surveyNumber.trim() || null;

      const result = await backend.createField(
        farmId,
        data.name,
        areaSqm,
        data.unit,
        data.soilType,
        data.irrigationType,
        data.tenure,
        surveyNumber,
        null, // ulpin
        null, // shcNumber
        null, // shcExpiry
        [], // geoPoints
      );

      if (result.__kind__ !== "ok") {
        toast.error("खेत जोड़ने में त्रुटि। दोबारा कोशिश करें।");
        return;
      }

      toast.success(`"${data.name}" खेत सफलतापूर्वक जोड़ा गया।`);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("खेत जोड़ने में त्रुटि। दोबारा कोशिश करें।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-y-auto sm:max-w-[480px]"
        data-ocid="fields.add.dialog"
      >
        <SheetHeader>
          <SheetTitle>नया खेत जोड़ें</SheetTitle>
          <SheetDescription>
            खेत की जानकारी भरें। सर्वे नंबर वैकल्पिक है।
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Field Name */}
          <div className="space-y-1.5">
            <Label htmlFor="field-name">खेत का नाम *</Label>
            <Input
              id="field-name"
              placeholder="जैसे: उत्तर खेत"
              data-ocid="fields.add.input"
              {...register("name", { required: "खेत का नाम आवश्यक है" })}
            />
            {errors.name && (
              <p
                className="text-xs text-destructive"
                data-ocid="fields.add.error_state"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Area + Unit */}
          <div className="space-y-1.5">
            <Label>क्षेत्रफल *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="1.5"
                className="flex-1"
                data-ocid="fields.add.acres.input"
                {...register("areaValue", {
                  required: "क्षेत्रफल आवश्यक है",
                  min: { value: 0.01, message: "0 से अधिक होना चाहिए" },
                })}
              />
              <Select
                value={unit}
                onValueChange={(v) => setValue("unit", v as AreaUnit)}
              >
                <SelectTrigger className="w-32">
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
            {errors.areaValue && (
              <p className="text-xs text-destructive">
                {errors.areaValue.message}
              </p>
            )}
          </div>

          {/* Soil Type */}
          <div className="space-y-1.5">
            <Label>मिट्टी का प्रकार *</Label>
            <Select
              value={soilType}
              onValueChange={(v) => setValue("soilType", v)}
            >
              <SelectTrigger data-ocid="fields.add.soiltype.select">
                <SelectValue placeholder="मिट्टी चुनें" />
              </SelectTrigger>
              <SelectContent>
                {SOIL_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Irrigation Type */}
          <div className="space-y-1.5">
            <Label>सिंचाई का प्रकार *</Label>
            <Select
              value={irrigationType}
              onValueChange={(v) => setValue("irrigationType", v)}
            >
              <SelectTrigger data-ocid="fields.add.irrigation.select">
                <SelectValue placeholder="सिंचाई चुनें" />
              </SelectTrigger>
              <SelectContent>
                {IRRIGATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tenure */}
          <div className="space-y-1.5">
            <Label>जमीन का प्रकार *</Label>
            <Select value={tenure} onValueChange={(v) => setValue("tenure", v)}>
              <SelectTrigger data-ocid="fields.add.tenure.select">
                <SelectValue placeholder="प्रकार चुनें" />
              </SelectTrigger>
              <SelectContent>
                {TENURE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Survey Number (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="survey-number">सर्वे नंबर (वैकल्पिक)</Label>
            <Input
              id="survey-number"
              placeholder="जैसे: 123/A"
              data-ocid="fields.add.survey_number.input"
              {...register("surveyNumber")}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-ocid="fields.add.cancel_button"
            >
              रद्द करें
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting}
              data-ocid="fields.add.submit_button"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitting ? "जोड़ रहे हैं..." : "खेत जोड़ें"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
