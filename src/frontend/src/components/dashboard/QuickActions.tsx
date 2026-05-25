import { useNavigate } from "@tanstack/react-router";
import { Plus, Sprout, UserPlus } from "lucide-react";
import { Button } from "../ui/button";

interface QuickActionsProps {
  onAddField: () => void;
}

export function QuickActions({ onAddField }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-wrap gap-2 mb-6"
      data-ocid="dashboard.quick_actions.section"
    >
      <Button
        size="sm"
        variant="outline"
        onClick={onAddField}
        data-ocid="dashboard.add_field.button"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        खेत जोड़ें
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate({ to: "/fields" })}
        data-ocid="dashboard.plan_crop.button"
      >
        <Sprout className="w-3.5 h-3.5 mr-1.5" />
        फसल Plan करें
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate({ to: "/settings" })}
        data-ocid="dashboard.invite_member.button"
      >
        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
        सदस्य जोड़ें
      </Button>
    </div>
  );
}
