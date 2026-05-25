import { Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export function BudgetTab() {
  return (
    <div
      className="flex items-center justify-center min-h-[320px]"
      data-ocid="finances.budget.panel"
    >
      <Card className="max-w-sm w-full border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-foreground mb-1">
              Budget Tracker
            </h3>
            <p className="text-xs text-muted-foreground">
              Budget vs actual expense comparison coming in Phase 1C.
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
