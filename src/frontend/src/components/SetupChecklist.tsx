import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, Circle, X } from "lucide-react";
import { useState } from "react";
import type { CropSeason, Field } from "../backend.d.ts";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

interface SetupChecklistProps {
  fields: Field[];
  cropSeasons: CropSeason[];
  onDismiss: () => void;
}

export function SetupChecklist({
  fields,
  cropSeasons,
  onDismiss,
}: SetupChecklistProps) {
  const [openStep, setOpenStep] = useState<number | null>(null);

  const completed = [
    true, // Farm created (user is here = farm exists)
    fields.length > 0,
    cropSeasons.length > 0,
  ];

  const doneCount = completed.filter(Boolean).length;
  const allDone = doneCount === completed.length;

  if (allDone) return null;

  const steps = [
    { label: "Farm profile created" },
    { label: "Add your first field (Plot/Survey)" },
    { label: "Plan your first crop season" },
  ];

  const toggleStep = (i: number) => {
    setOpenStep((prev) => (prev === i ? null : i));
  };

  return (
    <Card
      className="mb-6 border-l-4"
      style={{ borderLeftColor: "oklch(0.40 0.14 145)" }}
      data-ocid="setup_checklist.card"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Kisan Seva — शुरू करें
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              इन steps को पूरा करें अपनी खेती शुरू करने के लिए
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
            data-ocid="setup_checklist.close_button"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">
              {doneCount} of {steps.length} complete
            </span>
            <span className="text-xs font-medium text-foreground">
              {Math.round((doneCount / steps.length) * 100)}%
            </span>
          </div>
          <Progress
            value={(doneCount / steps.length) * 100}
            className="h-1.5"
            data-ocid="setup_checklist.progress"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ol className="space-y-1">
          {steps.map((step, i) => {
            const done = completed[i];
            const isOpen = openStep === i;
            return (
              <li key={step.label} data-ocid={`setup_checklist.item.${i + 1}`}>
                <div className="flex items-center gap-3 py-1.5">
                  {done ? (
                    <CheckCircle2
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "oklch(0.40 0.14 145)" }}
                    />
                  ) : (
                    <Circle className="w-4 h-4 flex-shrink-0 text-muted-foreground/40" />
                  )}
                  <span
                    className={
                      done
                        ? "flex-1 text-sm line-through text-muted-foreground"
                        : "flex-1 text-sm text-foreground"
                    }
                  >
                    {step.label}
                  </span>
                  {!done && (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-muted transition-colors"
                      style={{ color: "oklch(0.40 0.14 145)" }}
                      onClick={() => toggleStep(i)}
                      data-ocid={`setup_checklist.step_${i + 1}.toggle`}
                    >
                      अभी करें
                      <ChevronRight
                        className={`w-3 h-3 transition-transform ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {!done && isOpen && (
                  <div className="ml-7 mb-2 p-3 rounded-md bg-muted/50 border border-border">
                    {i === 1 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          खेत जोड़ें — हर फसल और खर्च इससे जुड़ेगा
                        </p>
                        <Link
                          to="/fields"
                          className="text-xs font-medium underline-offset-2 hover:underline"
                          style={{ color: "oklch(0.40 0.14 145)" }}
                          data-ocid="setup_checklist.go_to_fields.link"
                        >
                          खेत देखें →
                        </Link>
                      </div>
                    )}
                    {i === 2 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          पहले खेत जोड़ें, फिर फसल season plan करें
                        </p>
                        <Link
                          to="/fields"
                          className="text-xs font-medium underline-offset-2 hover:underline"
                          style={{ color: "oklch(0.40 0.14 145)" }}
                          data-ocid="setup_checklist.go_to_crops.link"
                        >
                          खेत और फसल →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
