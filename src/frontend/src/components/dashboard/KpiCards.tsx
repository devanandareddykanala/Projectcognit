import { Bell, Leaf, MapPin, Sprout, Tractor } from "lucide-react";
import type { CropSeason, Farm, Field } from "../../backend.d.ts";
import { fmt, formatIndianNumber } from "../../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface KpiCardsProps {
  farms: Farm[];
  fields: Field[];
  cropSeasons: CropSeason[];
  notificationCount: number;
  isLoading: boolean;
}

export function KpiCards({
  farms,
  fields,
  cropSeasons,
  notificationCount,
  isLoading,
}: KpiCardsProps) {
  const activeCrops = cropSeasons.filter(
    (s) => s.stage !== "PostHarvest" && s.stage !== "Harvest",
  );
  const totalAreaSqm = fields.reduce((sum, f) => sum + Number(f.areaSqm), 0);
  const totalAcres = (totalAreaSqm / 4046.86).toFixed(2);

  return (
    <>
      {/* Farms */}
      <Card data-ocid="dashboard.farms.card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground/80">
              Farms
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-3xl font-bold font-display text-foreground">
                {farms.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {farms[0]?.state ?? ""} • {farms[0]?.district ?? ""}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fields */}
      <Card data-ocid="dashboard.fields_count.card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Tractor className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground/80">
              Fields / Plots
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-3xl font-bold font-display text-foreground">
                {fields.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {fmt.acres(totalAreaSqm)} total area
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Crop Seasons */}
      <Card data-ocid="dashboard.crops.card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground/80">
              Active Crop Seasons
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-3xl font-bold font-display text-foreground">
                {activeCrops.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {cropSeasons.length} total seasons
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card data-ocid="dashboard.notifications.card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground/80">
              Notifications
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div
                className={`text-3xl font-bold font-display ${
                  notificationCount > 0 ? "text-amber-600" : "text-foreground"
                }`}
              >
                {notificationCount}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {notificationCount === 0 ? "All clear" : "Pending alerts"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Total Area */}
      <Card data-ocid="dashboard.area.card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground/80">
              Total Land Area
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold font-display text-foreground">
                {totalAcres} ac
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatIndianNumber(totalAreaSqm)} sq.m
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
