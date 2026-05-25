import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

/**
 * Generic skeleton grid — used as page-level loading states.
 * Renders `rows × cols` skeleton cards in a responsive grid.
 */
export function SkeletonGrid({
  rows = 3,
  cols = 3,
}: {
  rows?: number;
  cols?: number;
}) {
  const colClass =
    cols === 2
      ? "grid-cols-1 md:grid-cols-2"
      : cols === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  return (
    <div className={`grid ${colClass} gap-4`}>
      {Array.from({ length: rows * Math.min(cols, 3) }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Generic skeleton list — used for table/list loading states.
 * Renders `rows` full-width skeleton rows.
 */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
