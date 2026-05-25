import { Link } from "@tanstack/react-router";
import { Bell, ChevronRight, MapPin, Sprout } from "lucide-react";
import type { CropSeason, Field } from "../../backend.d.ts";
import type { FarmAlert } from "../../hooks/useNotifications";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface RecentActivityProps {
  notifications: FarmAlert[];
  cropSeasons: CropSeason[];
  fields: Field[];
  financialYear: string;
}

export function RecentActivity({
  notifications,
  cropSeasons,
  fields,
  financialYear,
}: RecentActivityProps) {
  return (
    <>
      {/* Notifications feed */}
      <Card className="md:col-span-2" data-ocid="dashboard.notifications.card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <CardTitle className="text-sm font-semibold text-foreground/80">
              Notifications &amp; Alerts
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div
              className="py-8 text-center"
              data-ocid="dashboard.notifications.empty_state"
            >
              <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground/70">
                सब ठीक है — कोई alert नहीं
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n, i) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 py-1.5 border-b border-border last:border-0"
                  data-ocid={`dashboard.notifications.item.${i + 1}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      n.type === "error"
                        ? "bg-destructive"
                        : n.type === "warning"
                          ? "bg-amber-500"
                          : "bg-primary"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    {n.title && (
                      <div className="text-sm font-medium text-foreground">
                        {n.title}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {n.message}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs flex-shrink-0 ${
                      n.type === "error"
                        ? "border-destructive/50 text-destructive"
                        : n.type === "warning"
                          ? "border-amber-500/50 text-amber-700"
                          : ""
                    }`}
                  >
                    {n.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crop Seasons summary */}
      <Card data-ocid="dashboard.crops_summary.card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground/80">
            Crops — FY {financialYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {cropSeasons.slice(0, 5).map((s, i) => {
              const field = fields.find(
                (f) => String(f.id) === String(s.fieldId),
              );
              return (
                <div
                  key={String(s.id)}
                  className="flex items-center gap-2 py-1.5 px-1 rounded-md border-b border-border last:border-0"
                  data-ocid={`dashboard.crops_summary.item.${i + 1}`}
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
                  <span className="text-sm text-foreground/80 flex-1 truncate">
                    {s.cropName}
                    {s.variety ? ` (${s.variety})` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {field?.name ?? ""}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
                </div>
              );
            })}
            {cropSeasons.length === 0 && (
              <div
                className="py-4 text-center"
                data-ocid="dashboard.crops_summary.empty_state"
              >
                <Sprout className="w-7 h-7 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm text-muted-foreground/70">
                  FY {financialYear} में कोई फसल नहीं
                </p>
                <Link
                  to="/fields"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                  data-ocid="dashboard.crops_summary.add_link"
                >
                  खेत और फसल जोड़ें →
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
