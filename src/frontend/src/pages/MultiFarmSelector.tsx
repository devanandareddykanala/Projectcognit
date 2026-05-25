import type { Farm } from "@/backend.d.ts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, MapPin, Plus } from "lucide-react";

const SQM_PER_ACRE = 4046.86;

function sqmToAcres(sqm: bigint): number {
  return Number(sqm) / SQM_PER_ACRE;
}

function formatLastActive(ts?: bigint): string {
  if (!ts) return "Pehli baar";
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  onSelect?: (farm: Farm) => void;
  onCreateNew?: () => void;
}

export default function MultiFarmSelector({ onSelect, onCreateNew }: Props) {
  const { actor } = useActor();
  const navigate = useNavigate();

  const { data: farms, isLoading } = useQuery({
    queryKey: ["userFarms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserFarms();
    },
    enabled: !!actor,
  });

  function handleSelect(farm: Farm) {
    if (onSelect) {
      onSelect(farm);
    } else {
      navigate({ to: "/dashboard" });
    }
  }

  function handleCreateNew() {
    if (onCreateNew) {
      onCreateNew();
    } else {
      navigate({ to: "/onboarding" });
    }
  }

  return (
    <div className="min-h-screen bg-background" data-ocid="multi_farm.page">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-6 pb-4 shadow-sm">
        <h1
          className="text-3xl font-bold text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Apna Kheta Chuniye
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? "" : `${farms?.length ?? 0} farms milein`}
        </p>
      </div>

      <div className="px-4 py-5 space-y-3 max-w-2xl mx-auto">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: static loading skeleton
                key={i}
                className="h-28 w-full rounded-xl"
                data-ocid={`multi_farm.loading_state.${i + 1}`}
              />
            ))
          : farms?.map((farm, i) => (
              <div
                key={farm.id.toString()}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
                data-ocid={`multi_farm.item.${i + 1}`}
              >
                {/* Green accent bar */}
                <div
                  className="h-1"
                  style={{ background: "oklch(0.38 0.11 148)" }}
                />
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2
                      className="font-bold text-foreground text-lg leading-tight truncate"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {farm.name}
                    </h2>
                    <p
                      className="text-xs tracking-wider mt-0.5 text-muted-foreground"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {farm.ksId}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {farm.district}, {farm.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span
                        className="font-medium"
                        style={{ color: "oklch(0.38 0.11 148)" }}
                      >
                        {sqmToAcres(farm.totalAreaSqm).toFixed(2)} Acres
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatLastActive(farm.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 px-4"
                    onClick={() => handleSelect(farm)}
                    data-ocid={`multi_farm.open_button.${i + 1}`}
                  >
                    Kholein
                  </Button>
                </div>
              </div>
            ))}

        {!isLoading && (!farms || farms.length === 0) && (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="multi_farm.empty_state"
          >
            <p className="text-lg font-medium">Koi farm nahi mila</p>
            <p className="text-sm mt-1">
              Naya kheta banayein ya invite accept karein
            </p>
          </div>
        )}

        {/* Create new farm button */}
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium border-primary/40 text-primary hover:bg-primary/5"
            onClick={handleCreateNew}
            data-ocid="multi_farm.create_button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Naaya Kheta Banayein
          </Button>
        </div>
      </div>
    </div>
  );
}
