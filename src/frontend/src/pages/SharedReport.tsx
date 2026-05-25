import { Leaf } from "lucide-react";

export default function SharedReport() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background"
      data-ocid="shared_report.page"
    >
      <div className="text-center space-y-3 max-w-sm px-6">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Leaf className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground font-display">
          Report Sharing
        </h1>
        <p className="text-sm text-muted-foreground">
          Shared reports will be available in Phase 1C when the full financial
          ledger and CA PDF export are built.
        </p>
      </div>
    </div>
  );
}
