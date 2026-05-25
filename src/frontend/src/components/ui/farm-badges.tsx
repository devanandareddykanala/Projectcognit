import { cn } from "@/lib/utils";

const cropClasses: Record<string, string> = {
  Corn: "bg-amber-100 text-amber-800",
  corn: "bg-amber-100 text-amber-800",
  Soybeans: "bg-green-100 text-green-800",
  soybeans: "bg-green-100 text-green-800",
  Wheat: "bg-yellow-100 text-yellow-800",
  wheat: "bg-yellow-100 text-yellow-800",
  Fallow: "bg-muted text-muted-foreground",
  fallow: "bg-muted text-muted-foreground",
};

const statusClasses: Record<string, string> = {
  // Field / Season statuses
  Planned: "bg-blue-100 text-blue-700",
  Active: "bg-green-100 text-green-700",
  Harvested: "bg-amber-100 text-amber-700",
  Closed: "bg-muted text-muted-foreground",
  // Input statuses
  OnOrder: "bg-blue-100 text-blue-700",
  OnHand: "bg-green-100 text-green-700",
  Used: "bg-muted text-muted-foreground",
  Returned: "bg-red-100 text-red-600",
  // Contract statuses
  Open: "bg-blue-100 text-blue-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-muted text-muted-foreground",
  // Contract types
  Forward: "bg-teal-100 text-teal-800",
  HTA: "bg-blue-100 text-blue-800",
  Basis: "bg-purple-100 text-purple-800",
  Cash: "bg-green-100 text-green-800",
  DP: "bg-orange-100 text-orange-800",
  // Expense categories
  Variable: "bg-blue-100 text-blue-800",
  Fixed: "bg-purple-100 text-purple-800",
  Overhead: "bg-orange-100 text-orange-800",
  Labour: "bg-pink-100 text-pink-800",
  // Service / alert levels
  Due: "bg-red-100 text-red-700",
  Soon: "bg-amber-100 text-amber-700",
  Good: "bg-green-100 text-green-700",
  // Work order statuses
  Overdue: "bg-red-100 text-red-700",
  Today: "bg-amber-100 text-amber-700",
  Upcoming: "bg-blue-100 text-blue-700",
  Completed: "bg-muted text-muted-foreground",
  Done: "bg-green-100 text-green-700",
  // Roles
  Owner: "bg-green-100 text-green-800",
  Manager: "bg-blue-100 text-blue-800",
  Operator: "bg-yellow-100 text-yellow-800",
  Agronomist: "bg-teal-100 text-teal-800",
  Accountant: "bg-purple-100 text-purple-800",
  Viewer: "bg-muted text-muted-foreground",
};

interface BadgeProps {
  value: string;
  className?: string;
}

export function CropBadge({ value, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        cropClasses[value] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {value}
    </span>
  );
}

export function StatusBadge({ value, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        statusClasses[value] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {value}
    </span>
  );
}
