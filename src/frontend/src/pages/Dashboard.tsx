import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CropSeason, Farm, Field } from "../backend.d.ts";
import { SetupChecklist } from "../components/SetupChecklist";
import { KpiCards } from "../components/dashboard/KpiCards";
import { QuickActions } from "../components/dashboard/QuickActions";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { AddFieldSheet } from "../components/forms/AddFieldSheet";
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
import { useNotifications } from "../hooks/useNotifications";

// ── Financial year helper (April–March) ──────────────────────────────────
function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  if (month >= 4) return `${year}-${String(year + 1).slice(-2)}`;
  return `${year - 1}-${String(year).slice(-2)}`;
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6" data-ocid="dashboard.loading_state">
      <div className="mb-6">
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {["s1", "s2", "s3", "s4"].map((id) => (
          <Card key={id}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { farm, farmId, cropYear, refetch, needsOnboarding } = useFarm();
  const navigate = useNavigate();
  const { actor: backend } = useActor();
  const checklistRef = useRef<HTMLDivElement>(null);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [cropSeasons, setCropSeasons] = useState<CropSeason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(
    sessionStorage.getItem("kisan-seva-setup-complete") !== "true",
  );
  const [showAddField, setShowAddField] = useState(false);

  const financialYear = getCurrentFinancialYear();

  // Notifications from backend
  const { notifications, visibleCount } = useNotifications({
    backend: backend ?? null,
    farmId: farmId ?? null,
    cropYear,
  });

  useEffect(() => {
    if (!backend || !farmId) return;
    setIsLoading(true);

    Promise.all([
      backend.getUserFarms(),
      backend.getFieldsForFarm(farmId),
      backend.getCropSeasonsForFarm(farmId, financialYear),
    ])
      .then(([farmsResult, fieldsResult, seasonsResult]) => {
        setFarms(farmsResult);
        if (fieldsResult.__kind__ === "ok") setFields(fieldsResult.ok);
        if (seasonsResult.__kind__ === "ok") setCropSeasons(seasonsResult.ok);
      })
      .catch((err) => {
        console.error(err);
        toast.error("डैशबोर्ड लोड नहीं हो सका। दोबारा कोशिश करें।");
      })
      .finally(() => setIsLoading(false));
  }, [backend, farmId, financialYear]);

  const handleFieldAdded = () => {
    refetch();
    if (!backend || !farmId) return;
    backend.getFieldsForFarm(farmId).then((r) => {
      if (r.__kind__ === "ok") setFields(r.ok);
    });
  };

  if (!farm || !farmId || needsOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md px-6 space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-primary text-xl">🌾</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Welcome to Kisan Seva
          </h2>
          <p className="text-sm text-muted-foreground">
            Set up your farm to get started.
          </p>
          <Button onClick={() => navigate({ to: "/onboarding" })}>
            Create Farm
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-6" data-ocid="dashboard.page">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold font-display text-foreground">
          {farm?.name ?? "Kisan Seva"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {farm?.mandal && farm?.district
            ? `${farm.mandal}, ${farm.district}, ${farm.state}`
            : (farm?.state ?? "")}{" "}
          &middot; FY {financialYear}
        </p>
      </div>

      {/* Setup checklist */}
      <div ref={checklistRef}>
        {showChecklist && (
          <SetupChecklist
            fields={fields}
            cropSeasons={cropSeasons}
            onDismiss={() => {
              sessionStorage.setItem("kisan-seva-setup-complete", "true");
              setShowChecklist(false);
            }}
          />
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions onAddField={() => setShowAddField(true)} />

      {/* KPI Cards + Recent Activity grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCards
          farms={farms}
          fields={fields}
          cropSeasons={cropSeasons}
          notificationCount={visibleCount}
          isLoading={false}
        />

        <RecentActivity
          notifications={notifications}
          cropSeasons={cropSeasons}
          fields={fields}
          financialYear={financialYear}
        />
      </div>

      {/* Add Field Sheet */}
      <AddFieldSheet
        open={showAddField}
        onOpenChange={setShowAddField}
        onSuccess={handleFieldAdded}
      />
    </div>
  );
}
