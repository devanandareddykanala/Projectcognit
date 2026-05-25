import { Calendar, FileText } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

export default function Reports() {
  return (
    <div
      className="p-6 flex-1 flex items-center justify-center min-h-[60vh]"
      data-ocid="reports.page"
    >
      <Card className="max-w-md w-full border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-foreground mb-2">
              CA Reports &amp; Analytics
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate CA-ready PDF reports with Schedule EI and Schedule BP
              groupings, Indian number formatting, and KS Farm ID on every page.
              Coming in Phase 1C.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70 pt-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Coming in Phase 1C</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
