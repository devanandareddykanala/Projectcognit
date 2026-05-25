// Indian Rupee formatter — paise (1/100 of a rupee) as input
export function formatRupees(paise: bigint | number): string {
  const n = typeof paise === "bigint" ? Number(paise) : paise;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n / 100);
}

// Indian number format without currency symbol
export function formatIndianNumber(n: bigint | number): string {
  const v = typeof n === "bigint" ? Number(n) : n;
  return new Intl.NumberFormat("en-IN").format(v);
}

// Area formatting — default unit is acres
export function formatArea(value: bigint | number, unit = "acres"): string {
  const n = typeof value === "bigint" ? Number(value) : value;
  if (unit === "guntha") return `${n.toFixed(2)} Guntha`;
  if (unit === "sqm") return `${formatIndianNumber(n)} sq.m`;
  return `${n.toFixed(2)} Acres`;
}

// Weight formatting — default kg
export function formatWeight(kg: bigint | number, unit = "kg"): string {
  const n = typeof kg === "bigint" ? Number(kg) : kg;
  if (unit === "quintal") return `${(n / 100).toFixed(2)} Quintal`;
  if (unit === "tonnes") return `${(n / 1000).toFixed(3)} Tonnes`;
  return `${formatIndianNumber(n)} kg`;
}

// DD/MM/YYYY format
export function formatDate(timestamp: number | bigint): string {
  const ms =
    typeof timestamp === "bigint" ? Number(timestamp) / 1_000_000 : timestamp;
  const d = new Date(ms);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// "2025-26" → "FY 2025-26 (Apr-Mar)"
export function formatFinancialYear(fy: string): string {
  return `FY ${fy} (Apr-Mar)`;
}

// Legacy compat — keep fmt object for existing code
export const fmt = {
  usd: formatRupees,
  rupees: formatRupees,
  num: formatIndianNumber,
  acres: (a: bigint | number) => formatArea(a),
};

// Indian crop color map (using design token–safe values)
export const cropColor: Record<string, string> = {
  Paddy: "oklch(0.70 0.12 140)",
  paddy: "oklch(0.70 0.12 140)",
  Rice: "oklch(0.70 0.12 140)",
  rice: "oklch(0.70 0.12 140)",
  Wheat: "oklch(0.72 0.12 72)",
  wheat: "oklch(0.72 0.12 72)",
  Cotton: "oklch(0.80 0.04 200)",
  cotton: "oklch(0.80 0.04 200)",
  Sugarcane: "oklch(0.68 0.14 155)",
  sugarcane: "oklch(0.68 0.14 155)",
  Maize: "oklch(0.76 0.14 68)",
  maize: "oklch(0.76 0.14 68)",
  Groundnut: "oklch(0.66 0.10 55)",
  groundnut: "oklch(0.66 0.10 55)",
  Soybean: "oklch(0.62 0.13 140)",
  soybean: "oklch(0.62 0.13 140)",
  Fallow: "oklch(0.60 0.01 200)",
  fallow: "oklch(0.60 0.01 200)",
};

// Badge classes using semantic token-safe Tailwind (no raw color classes)
export const cropBadgeClass: Record<string, string> = {
  Paddy: "bg-primary/10 text-primary",
  paddy: "bg-primary/10 text-primary",
  Rice: "bg-primary/10 text-primary",
  rice: "bg-primary/10 text-primary",
  Wheat: "bg-accent/20 text-foreground",
  wheat: "bg-accent/20 text-foreground",
  Cotton: "bg-secondary/10 text-secondary-foreground",
  cotton: "bg-secondary/10 text-secondary-foreground",
  Maize: "bg-accent/20 text-foreground",
  maize: "bg-accent/20 text-foreground",
  Fallow: "bg-muted text-muted-foreground",
  fallow: "bg-muted text-muted-foreground",
};

export const statusBadge: Record<string, string> = {
  Planned: "bg-primary/10 text-primary",
  Active: "bg-secondary/10 text-secondary-foreground",
  Harvested: "bg-accent/20 text-foreground",
  Closed: "bg-muted text-muted-foreground",
  OnOrder: "bg-primary/10 text-primary",
  OnHand: "bg-secondary/10 text-secondary-foreground",
  Used: "bg-muted text-muted-foreground",
  Returned: "bg-destructive/10 text-destructive",
  Open: "bg-primary/10 text-primary",
  Delivered: "bg-secondary/10 text-secondary-foreground",
  Cancelled: "bg-muted text-muted-foreground",
};
