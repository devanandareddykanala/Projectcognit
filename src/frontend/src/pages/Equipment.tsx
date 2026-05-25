import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Pencil,
  Plus,
  Tractor,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
// EquipmentUnit is not in backend.d.ts — defined locally
interface EquipmentUnit {
  id: bigint;
  name: string;
  make: string;
  model: string;
  year: number;
  serialNumber?: string;
  hours?: bigint;
  status: string;
  farmId: bigint;
}

interface EquipmentServiceEvent {
  id: bigint;
  equipmentId: bigint;
  serviceDate: string;
  serviceType: string;
  hoursAtService: bigint;
  cost: bigint;
  vendor: string;
  notes: string;
}
import { AddEquipmentSheet } from "../components/forms/AddEquipmentSheet";
import { EditEquipmentSheet } from "../components/forms/EditEquipmentSheet";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { Skeleton } from "../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";
import { usePageData } from "../hooks/usePageData";
import { fmt } from "../lib/format";

const SERVICE_TYPES = [
  "Oil & Filter",
  "Annual Inspection",
  "Harvest Prep",
  "Repair",
  "Other",
];

function _EquipmentSkeleton() {
  return (
    <div className="p-6" data-ocid="equipment.loading_state">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => (
          <Card key={id}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Service History Sheet
// ─────────────────────────────────────────────

interface ServiceHistorySheetProps {
  cropYear: number;
  equipment: EquipmentUnit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function _ServiceHistorySheet({
  equipment,
  open,
  onOpenChange,
  cropYear,
}: ServiceHistorySheetProps) {
  const { actor: backend } = useActor();
  const [events, setEvents] = useState<EquipmentServiceEvent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<EquipmentServiceEvent | null>(null);
  const filteredEvents =
    cropYear !== 0
      ? events.filter(
          (ev) => new Date(ev.serviceDate).getFullYear() === cropYear,
        )
      : events;
  const [form, setForm] = useState({
    serviceDate: "",
    serviceType: "Oil & Filter",
    hoursAtService: "",
    cost: "",
    vendor: "",
    notes: "",
  });

  const loadEvents = async () => {
    if (!backend || !equipment) return;
    setIsSubmitting(true);
    try {
      const data = await (backend as any).getServiceEventsForEquipment(
        equipment.id,
      );
      setEvents(
        data.sort((a, b) => b.serviceDate.localeCompare(a.serviceDate)),
      );
    } catch {
      toast.error("Failed to load service history");
    } finally {
      setIsSubmitting(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadEvents is stable within this scope
  useEffect(() => {
    if (open && equipment) {
      loadEvents();
    }
  }, [open, equipment?.id]);

  const resetForm = () =>
    setForm({
      serviceDate: "",
      serviceType: "Oil & Filter",
      hoursAtService: "",
      cost: "",
      vendor: "",
      notes: "",
    });

  const handleAdd = async () => {
    if (!backend || !equipment || !form.serviceDate) return;
    setSaving(true);
    try {
      await (backend as any).createServiceEvent(
        equipment.id,
        form.serviceDate,
        form.serviceType,
        BigInt(Math.round(Number(form.hoursAtService) || 0)),
        BigInt(Math.round((Number(form.cost) || 0) * 100)),
        form.vendor,
        form.notes,
      );
      await loadEvents();
      setAddOpen(false);
      resetForm();
      toast.success("Service event saved");
    } catch {
      toast.error("Failed to save service event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: EquipmentServiceEvent) => {
    if (!backend) return;
    try {
      await (backend as any).deleteServiceEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      setDeleteTarget(null);
      toast.success("Service event deleted");
    } catch {
      toast.error("Failed to delete service event");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-2xl overflow-y-auto"
          data-ocid="equipment.service_history.sheet"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-muted-foreground" />
              Service History
            </SheetTitle>
            <SheetDescription>
              {equipment?.name} — {equipment?.year} {equipment?.make}{" "}
              {equipment?.model}
            </SheetDescription>
          </SheetHeader>

          <div className="mb-4">
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              data-ocid="equipment.add_service_event.button"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Service Event
            </Button>
          </div>

          {isSubmitting ? (
            <div
              className="space-y-2"
              data-ocid="equipment.service_history.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div
              className="py-12 text-center"
              data-ocid="equipment.service_history.empty_state"
            >
              <Wrench className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {cropYear !== 0
                  ? `No service events for ${cropYear}.`
                  : "No service events recorded."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table data-ocid="equipment.service_history.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((ev, i) => (
                    <TableRow
                      key={String(ev.id)}
                      data-ocid={`equipment.service_history.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">
                        {ev.serviceDate}
                      </TableCell>
                      <TableCell>{ev.serviceType}</TableCell>
                      <TableCell className="text-right">
                        {fmt.num(ev.hoursAtService)} hrs
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt.usd(ev.cost)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ev.vendor || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {ev.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(ev)}
                          data-ocid={`equipment.service_history.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Service Event Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent
          className="overflow-y-auto"
          data-ocid="equipment.add_service_event.sheet"
        >
          <SheetHeader>
            <SheetTitle>Add Service Event</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4 py-4 mt-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Service Date</Label>
              <Input
                type="date"
                value={form.serviceDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, serviceDate: e.target.value }))
                }
                data-ocid="equipment.service_date.input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Service Type</Label>
              <Select
                value={form.serviceType}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, serviceType: v }))
                }
              >
                <SelectTrigger data-ocid="equipment.service_type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hours at Service</Label>
              <Input
                type="number"
                placeholder="e.g. 1240"
                value={form.hoursAtService}
                onChange={(e) =>
                  setForm((p) => ({ ...p, hoursAtService: e.target.value }))
                }
                data-ocid="equipment.service_hours.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 250"
                value={form.cost}
                onChange={(e) =>
                  setForm((p) => ({ ...p, cost: e.target.value }))
                }
                data-ocid="equipment.service_cost.input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Vendor</Label>
              <Input
                placeholder="e.g. John Deere Dealer"
                value={form.vendor}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vendor: e.target.value }))
                }
                data-ocid="equipment.service_vendor.input"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                data-ocid="equipment.service_notes.textarea"
              />
            </div>
          </div>
          <div className="col-span-2 flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setAddOpen(false)}
              data-ocid="equipment.add_service_event.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAdd}
              disabled={!form.serviceDate || saving}
              data-ocid="equipment.add_service_event.submit_button"
            >
              {saving ? "Saving..." : "Save Event"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation — inline */}
      <div
        className={
          deleteTarget
            ? "fixed inset-0 z-50 bg-background/80 flex items-center justify-center opacity-100 transition-opacity duration-200 ease"
            : "fixed inset-0 z-50 bg-background/80 flex items-center justify-center opacity-0 pointer-events-none transition-opacity duration-200 ease"
        }
        data-ocid="equipment.delete_service.dialog"
      >
        <div className="bg-background border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
          <h3 className="font-semibold text-foreground mb-2">
            Delete Service Event
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete this service event? This action
            cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              data-ocid="equipment.delete_service.cancel_button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              data-ocid="equipment.delete_service.confirm_button"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Main Equipment Page
// ─────────────────────────────────────────────

export default function Equipment() {
  return (
    <div className="p-8 text-center">
      <h2 className="font-display text-2xl text-primary mb-4">
        Machinery &amp; Equipment
      </h2>
      <p className="text-muted-foreground">
        Coming in Phase 1B — Indian machinery database with CHC tracking and
        service reminders.
      </p>
    </div>
  );
}
