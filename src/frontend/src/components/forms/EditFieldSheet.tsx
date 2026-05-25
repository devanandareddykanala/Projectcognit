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
import { useActor } from "@/hooks/useActor";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { Field } from "../../backend.d.ts";

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

// sqm → acres display
function sqmToAcres(sqm: bigint): string {
  return (Number(sqm) / 4046.86).toFixed(2);
}

interface FormValues {
  name: string;
  areaSqmDisplay: string; // displayed in acres, converted on submit
  soilType: string;
  irrigationType: string;
  tenure: string;
  surveyNumber: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: Field;
  onSuccess: () => void;
}

export function EditFieldSheet({
  open,
  onOpenChange,
  field,
  onSuccess,
}: Props) {
  const { actor: backend } = useActor();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (open) {
      reset({
        name: field.name,
        areaSqmDisplay: sqmToAcres(field.areaSqm),
        soilType: field.soilType || "Red",
        irrigationType: field.irrigationType || "Borewell",
        tenure: field.tenure || "Owned",
        surveyNumber: field.surveyNumber || "",
      });
    }
  }, [open, field, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!backend) return;
    setSubmitting(true);
    try {
      const acresNum = Number.parseFloat(data.areaSqmDisplay);
      const areaSqm = BigInt(Math.round(acresNum * 4046.86));
      const surveyNumber: string | null = data.surveyNumber.trim() || null;

      const result = await backend.updateField(field.id, {
        name: data.name,
        areaSqm,
        unit: "Acres",
        soilType: data.soilType,
        irrigationType: data.irrigationType,
        tenure: data.tenure,
        surveyNumber: surveyNumber ?? undefined,
      });

      if (result.__kind__ !== "ok") {
        toast.error("खेत अपडेट नहीं हो सका। दोबारा कोशिश करें।");
        return;
      }

      toast.success("खेत सफलतापूर्वक अपडेट किया गया।");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("खेत अपडेट नहीं हो सका। दोबारा कोशिश करें।");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-[500px] overflow-y-auto"
        data-ocid="fields.edit.sheet"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>खेत संपादित करें</SheetTitle>
          <SheetDescription>{field.name} की जानकारी अपडेट करें।</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Field Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-field-name">खेत का नाम *</Label>
            <Input
              id="edit-field-name"
              data-ocid="fields.edit.input"
              {...register("name", { required: "नाम आवश्यक है" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Area in acres */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-field-area">क्षेत्रफल (एकड़) *</Label>
            <Input
              id="edit-field-area"
              type="number"
              min="0.01"
              step="0.01"
              data-ocid="fields.edit.area.input"
              {...register("areaSqmDisplay", {
                required: "क्षेत्रफल आवश्यक है",
                min: { value: 0.01, message: "0 से अधिक होना चाहिए" },
              })}
            />
            {errors.areaSqmDisplay && (
              <p className="text-xs text-destructive">
                {errors.areaSqmDisplay.message}
              </p>
            )}
          </div>

          {/* Soil Type */}
          <div className="space-y-1.5">
            <Label>मिट्टी का प्रकार *</Label>
            <Controller
              name="soilType"
              control={control}
              rules={{ required: "मिट्टी का प्रकार आवश्यक है" }}
              render={({ field: f }) => (
                <Select onValueChange={f.onChange} value={f.value}>
                  <SelectTrigger data-ocid="fields.edit.soiltype.select">
                    <SelectValue placeholder="मिट्टी चुनें" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOIL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.soilType && (
              <p className="text-xs text-destructive">
                {errors.soilType.message}
              </p>
            )}
          </div>

          {/* Irrigation Type */}
          <div className="space-y-1.5">
            <Label>सिंचाई का प्रकार *</Label>
            <Controller
              name="irrigationType"
              control={control}
              rules={{ required: "सिंचाई का प्रकार आवश्यक है" }}
              render={({ field: f }) => (
                <Select onValueChange={f.onChange} value={f.value}>
                  <SelectTrigger data-ocid="fields.edit.irrigation.select">
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
              )}
            />
            {errors.irrigationType && (
              <p className="text-xs text-destructive">
                {errors.irrigationType.message}
              </p>
            )}
          </div>

          {/* Tenure */}
          <div className="space-y-1.5">
            <Label>जमीन का प्रकार *</Label>
            <Controller
              name="tenure"
              control={control}
              rules={{ required: "जमीन का प्रकार आवश्यक है" }}
              render={({ field: f }) => (
                <Select onValueChange={f.onChange} value={f.value}>
                  <SelectTrigger data-ocid="fields.edit.tenure.select">
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
              )}
            />
            {errors.tenure && (
              <p className="text-xs text-destructive">
                {errors.tenure.message}
              </p>
            )}
          </div>

          {/* Survey Number (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-survey-number">सर्वे नंबर (वैकल्पिक)</Label>
            <Input
              id="edit-survey-number"
              placeholder="जैसे: 123/A"
              data-ocid="fields.edit.survey_number.input"
              {...register("surveyNumber")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="fields.edit.cancel_button"
            >
              रद्द करें
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              data-ocid="fields.edit.submit_button"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitting ? "सहेज रहे हैं..." : "बदलाव सहेजें"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
