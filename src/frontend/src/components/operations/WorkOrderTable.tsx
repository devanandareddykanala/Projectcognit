import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Phase 1B stub — work orders coming in Phase 1B
export function WorkOrderTable() {
  return (
    <Card data-ocid="operations.work_orders.card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">काम का रिकॉर्ड</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="py-8 text-center"
          data-ocid="operations.work_orders.empty_state"
        >
          <Badge variant="outline" className="text-sm px-4 py-2">
            Phase 1B में आएगा — इनपुट, मशीनरी और लेबर module
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
