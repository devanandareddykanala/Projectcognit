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
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const EQUIPMENT_TYPES = [
  "Tractor",
  "Combine",
  "Sprayer",
  "Planter",
  "Implement",
  "Truck",
];

interface FormValues {
  name: string;
  manufacturer: string;
  model: string;
  year: string;
  serialNumber: string;
  equipmentType: string;
  currentHours: string;
  nextServiceHours: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddEquipmentSheet({ open, onOpenChange, onSuccess }: Props) {
  const { actor: backend } = useActor();
  const { farmId } = useFarm();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      manufacturer: "",
      model: "",
      year: String(new Date().getFullYear()),
      serialNumber: "",
      equipmentType: "Tractor",
      currentHours: "0",
      nextServiceHours: "250",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!backend || !farmId) return;
    setSubmitting(true);
    try {
      await (backend as any).createEquipment(
        farmId,
        data.name,
        data.manufacturer,
        data.model,
        BigInt(data.year),
        data.serialNumber,
        data.equipmentType,
        BigInt(data.currentHours),
        BigInt(data.nextServiceHours),
      );
      toast.success("Equipment added successfully.");
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add equipment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-y-auto sm:max-w-[500px]"
        data-ocid="equipment.add.dialog"
      >
        <SheetHeader>
          <SheetTitle>Add Equipment</SheetTitle>
          <SheetDescription>
            Register a new machine in your fleet.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-eq-name">Name *</Label>
            <Input
              id="add-eq-name"
              placeholder="e.g. Case IH 8250"
              data-ocid="equipment.add.input"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-eq-manufacturer">Manufacturer *</Label>
              <Input
                id="add-eq-manufacturer"
                placeholder="e.g. Case IH"
                {...register("manufacturer", { required: "Required" })}
              />
              {errors.manufacturer && (
                <p className="text-xs text-destructive">
                  {errors.manufacturer.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-eq-model">Model *</Label>
              <Input
                id="add-eq-model"
                placeholder="e.g. 8250"
                {...register("model", { required: "Required" })}
              />
              {errors.model && (
                <p className="text-xs text-destructive">
                  {errors.model.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-eq-year">Year *</Label>
              <Input
                id="add-eq-year"
                type="number"
                min="1900"
                max="2100"
                {...register("year", { required: "Required" })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Controller
                name="equipmentType"
                control={control}
                rules={{ required: "Required" }}
                render={({ field: f }) => (
                  <Select onValueChange={f.onChange} value={f.value}>
                    <SelectTrigger data-ocid="equipment.add.select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-eq-serial">Serial Number</Label>
            <Input
              id="add-eq-serial"
              placeholder="Optional"
              {...register("serialNumber")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-eq-hours">Current Hours *</Label>
              <Input
                id="add-eq-hours"
                type="number"
                min="0"
                step="1"
                {...register("currentHours", {
                  required: "Required",
                  min: { value: 0, message: "Must be ≥ 0" },
                })}
              />
              {errors.currentHours && (
                <p className="text-xs text-destructive">
                  {errors.currentHours.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-eq-service-hours">Next Service (hrs) *</Label>
              <Input
                id="add-eq-service-hours"
                type="number"
                min="1"
                step="1"
                {...register("nextServiceHours", {
                  required: "Required",
                  min: { value: 1, message: "Must be > 0" },
                })}
              />
              {errors.nextServiceHours && (
                <p className="text-xs text-destructive">
                  {errors.nextServiceHours.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-ocid="equipment.add.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting}
              data-ocid="equipment.add.submit_button"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitting ? "Adding..." : "Add Equipment"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
