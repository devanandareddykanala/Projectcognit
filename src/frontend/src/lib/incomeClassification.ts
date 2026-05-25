export interface ClassificationResult {
  code: string;
  incomeType: "Agri" | "Business" | "AgriExpense" | "BusinessExpense";
  taxSection: string;
  guidance: string;
  warning?: string;
}

const DAIRY_CODES: Record<string, string> = {
  milk: "BI-DRY-001",
  curd: "BI-DRY-002",
  ghee: "BI-DRY-002",
  paneer: "BI-DRY-002",
  amul: "BI-DRY-003",
};

const WARNINGS: Record<string, string> = {
  "BI-DRY-001": "classification.warning_dairy",
  "BI-MCH-001": "classification.warning_machinery",
  "BI-GHS-002": "classification.warning_microgreens_restaurant",
  "AI-GHS-001": "classification.warning_microgreens_home",
  "AI-FSH-001": "classification.warning_fish",
  "AI-HNY-001": "classification.warning_honey_unbranded",
  "BI-HNY-002": "classification.warning_honey_branded",
  "AI-SCH-001": "classification.warning_pmkisan",
  "AI-MSH-001": "classification.warning_mushroom",
  "AI-DCK-001": "classification.warning_duck",
};

function resolveIncomeType(code: string): ClassificationResult["incomeType"] {
  if (code.startsWith("AI")) return "Agri";
  if (code.startsWith("BI")) return "Business";
  if (code.startsWith("AE")) return "AgriExpense";
  return "BusinessExpense";
}

export function classifyIncome(
  module: string,
  itemType: string,
  channel: string,
): ClassificationResult {
  const item = itemType.toLowerCase();
  const ch = channel.toLowerCase();
  let code = "AI-CRP-001";

  if (module === "dairy") {
    code = DAIRY_CODES[item] ?? "BI-DRY-001";
  } else if (module === "greenhouse") {
    code =
      ch.includes("restaurant") || ch.includes("retail")
        ? "BI-GHS-002"
        : "AI-GHS-001";
  } else if (module === "machinery" && ch.includes("hire")) {
    code = "BI-MCH-001";
  } else if (module === "schemes") {
    const schemeMap: Record<string, string> = {
      pmkisan: "AI-SCH-001",
      "rythu bandhu": "AI-SCH-002",
      "ysr rythu bharosa": "AI-SCH-003",
      pmfby: "AI-SCH-004",
    };
    code = schemeMap[item] ?? "AI-SCH-001";
  } else if (module === "poultry") {
    code = item.includes("egg") ? "BI-PLT-002" : "BI-PLT-001";
  } else if (module === "fisheries") {
    code = "AI-FSH-001";
  } else if (module === "beekeeping") {
    code =
      ch.includes("branded") || ch.includes("fssai")
        ? "BI-HNY-002"
        : "AI-HNY-001";
  } else if (module === "mushroom") {
    code = "AI-MSH-001";
  } else if (module === "duck") {
    code = item.includes("egg") ? "AI-DCK-001" : "AI-DCK-002";
  }

  const warning = WARNINGS[code];
  return {
    code,
    incomeType: resolveIncomeType(code),
    taxSection: code.startsWith("AI") ? "Section 10(1)" : "Schedule BP",
    guidance: `Income classified as ${code}`,
    warning,
  };
}
