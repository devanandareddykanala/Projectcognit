import { cn } from "@/lib/utils";

function Pulse({ className }: { className?: string }) {
  return <div className={cn("bg-muted rounded animate-pulse", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-3",
        className,
      )}
      aria-busy="true"
      aria-label="Loading"
    >
      <Pulse className="h-4 w-2/3" />
      <Pulse className="h-3 w-full" />
      <Pulse className="h-3 w-5/6" />
      <div className="flex gap-2 pt-1">
        <Pulse className="h-7 w-20 rounded-lg" />
        <Pulse className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonList({
  rows = 4,
  className,
}: { rows?: number; className?: string }) {
  return (
    <div
      className={cn("space-y-3", className)}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: stable static skeleton rows
          key={`skeleton-row-${i}`}
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
        >
          <Pulse className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Pulse className="h-3.5 w-3/4" />
            <Pulse className="h-3 w-1/2" />
          </div>
          <Pulse className="h-7 w-14 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="p-4 space-y-4" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Pulse className="h-6 w-48" />
        <Pulse className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonList rows={3} />
    </div>
  );
}
