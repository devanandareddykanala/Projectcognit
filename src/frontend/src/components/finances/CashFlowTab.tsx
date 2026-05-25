import { Calendar, TrendingDown } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export function CashFlowTab() {
  return (
    <div
      className="flex items-center justify-center min-h-[320px]"
      data-ocid="finances.cashflow.panel"
    >
      <Card className="max-w-sm w-full border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <TrendingDown className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-foreground mb-1">
              Cash Flow
            </h3>
            <p className="text-xs text-muted-foreground">
              Monthly cash flow analysis coming in Phase 1C.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
            <Calendar className="w-3 h-3" />
            <span>Coming in Phase 1C</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
