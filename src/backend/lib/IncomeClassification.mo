// lib/IncomeClassification.mo — Income/expense auto-classification engine
// 40+ AI/BI/AE/BE codes for all modules.
// AI = Agricultural Income (Schedule EI, tax-exempt)
// BI = Business Income (Schedule BP, taxable)
// AE = Agricultural Expense
// BE = Business Expense
import Common "../types/Common";
import Text "mo:core/Text";

module {

  // Classify income/expense for a given module + item type + market channel
  // module:  "crops" | "dairy" | "horticulture" | "greenhouse" | "fisheries"
  //          | "poultry" | "solar" | "machinery" | "beekeeping" | "mushroom"
  //          | "schemes" | "labour" | "inputs" | "property" | "agroforestry"
  // itemType: crop-specific or product-specific name (e.g. "paddy", "milk", "honey")
  // channel: "direct" | "apmc" | "fpo" | "contract" | "restaurant"
  //          | "home_delivery" | "discom" | "chc" | "branded" | "unbranded"
  public func classify(
    module_ : Text,
    itemType : Text,
    channel : Text,
  ) : Common.Result<Common.ClassificationCode, Text> {
    let item = itemType.toLower();
    let ch = channel.toLower();
    let m = module_.toLower();
    let code : Common.ClassificationCode = switch m {
      case "crops" classifyCrop(item, ch);
      case "dairy" classifyDairy(item);
      case "horticulture" classifyHorticulture(item, ch);
      case "greenhouse" classifyGreenhouse(item, ch);
      case "fisheries" classifyFisheries(item, ch);
      case "poultry" classifyPoultry(item, ch);
      case "solar" classifySolar(item);
      case "machinery" classifyMachinery(ch == "chc");
      case "beekeeping" classifyBeekeeping(item, ch == "branded");
      case "mushroom" classifyMushroom(ch);
      case "schemes" classifySchemeReceipt(item);
      case "agroforestry" { { code = "BI-AGF-001"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Timber/wood sale from agroforestry is business income" } };
      case "duck" { { code = "AI-DCK-001"; incomeType = "Agricultural Income"; taxSection = "Schedule EI"; guidance = "Duck eggs from own land are agricultural income" } };
      case "azolla" { { code = "AI-AZL-001"; incomeType = "Agricultural Income"; taxSection = "Schedule EI"; guidance = "Azolla grown on own land is agricultural income" } };
      case "agri-tourism" { { code = "BI-TRS-001"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Agri-tourism income is business income" } };
      case "biogas" { { code = "BI-BIO-001"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Commercial biogas sale is business income" } };
      case _ return #err("Unknown module: " # module_);
    };
    #ok(code)
  };

  // Return all classification entries for the UI code picker
  public func getAllCodes() : [Common.ClassificationEntry] {
    [
      // Agri Income
      { code = "AI-CRP-001"; description = "Crop sales (paddy, wheat, maize, pulses)"; examples = ["Paddy", "Wheat", "Maize", "Tur", "Cotton"]; warnings = [] },
      { code = "AI-HRT-001"; description = "Horticulture produce (fruits, vegetables from open field)"; examples = ["Mango", "Banana", "Tomato", "Onion"]; warnings = [] },
      { code = "AI-GHS-001"; description = "Greenhouse produce sold locally / home delivery"; examples = ["Microgreens home", "Hydroponic veggies local"]; warnings = ["Restaurant/retail sales are BI-GHS-002"] },
      { code = "AI-FSH-001"; description = "Fish from own farm pond on agricultural land"; examples = ["Rohu", "Catla", "Tilapia"]; warnings = [] },
      { code = "AI-DCK-001"; description = "Duck eggs from own land"; examples = ["Khaki Campbell eggs"]; warnings = [] },
      { code = "AI-HNY-001"; description = "Honey unbranded / bulk sale"; examples = ["Raw honey bulk"]; warnings = ["Branded FSSAI honey is BI-HNY-002"] },
      { code = "AI-MSH-001"; description = "Mushroom grown as farm byproduct / waste utilisation"; examples = ["Oyster mushroom"]; warnings = [] },
      { code = "AI-AZL-001"; description = "Azolla from own farm"; examples = ["Azolla biomass sale"]; warnings = [] },
      { code = "AI-SCH-001"; description = "PM-KISAN instalment"; examples = ["PM-KISAN Rs.2000"]; warnings = [] },
      { code = "AI-SCH-002"; description = "Rythu Bandhu / Rytu Bandhu (Telangana)"; examples = ["Rythu Bandhu Rs.5000/acre"]; warnings = [] },
      { code = "AI-SCH-003"; description = "YSR Rythu Bharosa (Andhra Pradesh)"; examples = ["YSR Rythu Bharosa Rs.13500"]; warnings = [] },
      { code = "AI-SCH-004"; description = "PMFBY crop insurance claim"; examples = ["PMFBY claim"]; warnings = [] },
      // Business Income
      { code = "BI-DRY-001"; description = "Milk sale"; examples = ["Cow milk", "Buffalo milk"]; warnings = ["Milk is business income - NOT agri income even if from own cattle"] },
      { code = "BI-DRY-002"; description = "Curd, ghee, paneer sale"; examples = ["Ghee 1 kg", "Paneer 500g"]; warnings = [] },
      { code = "BI-DRY-003"; description = "AMUL cooperative income"; examples = ["AMUL route income"]; warnings = [] },
      { code = "BI-PLT-001"; description = "Poultry meat sale"; examples = ["Broiler", "Country chicken"]; warnings = [] },
      { code = "BI-PLT-002"; description = "Hen eggs"; examples = ["Layer eggs"]; warnings = [] },
      { code = "BI-PLT-003"; description = "Kadaknath chicken/eggs (premium)"; examples = ["Kadaknath broiler", "Kadaknath eggs"]; warnings = [] },
      { code = "BI-QUL-001"; description = "Quail meat"; examples = ["Japanese quail"]; warnings = [] },
      { code = "BI-QUL-002"; description = "Quail eggs"; examples = ["Quail eggs"] ; warnings = [] },
      { code = "BI-PIG-001"; description = "Pig meat (pork)"; examples = ["Large White Yorkshire"]; warnings = [] },
      { code = "BI-PIG-002"; description = "Piglet sale"; examples = ["Weaner piglet"]; warnings = [] },
      { code = "BI-GHS-001"; description = "Hydroponic/aeroponic commercial sale"; examples = ["Lettuce restaurant supply"]; warnings = [] },
      { code = "BI-GHS-002"; description = "Microgreens - restaurant/retail/export"; examples = ["Sunflower microgreens hotel"]; warnings = [] },
      { code = "BI-SLR-001"; description = "Solar power export to DISCOM"; examples = ["PM-KUSUM export"]; warnings = [] },
      { code = "BI-MCH-001"; description = "Machinery hire income (CHC)"; examples = ["Tractor hire", "Thresher CHC"]; warnings = [] },
      { code = "BI-TRS-001"; description = "Agri-tourism income"; examples = ["Farm stay", "Tour group visit"]; warnings = [] },
      { code = "BI-BIO-001"; description = "Commercial biogas sale"; examples = ["Biogas pipeline supply"]; warnings = [] },
      { code = "BI-HNY-002"; description = "Branded honey with FSSAI licence"; examples = ["Branded honey retail"]; warnings = [] },
      { code = "BI-AGF-001"; description = "Timber/wood from agroforestry"; examples = ["Teak log", "Eucalyptus"]; warnings = [] },
      // Agri Expenses
      { code = "AE-INP-001"; description = "Fertiliser purchase"; examples = ["Urea", "DAP", "MOP"]; warnings = [] },
      { code = "AE-INP-002"; description = "Pesticide purchase"; examples = ["Monocrotophos", "Chlorpyrifos"]; warnings = [] },
      { code = "AE-INP-003"; description = "Organic input purchase"; examples = ["Neem cake", "Vermicompost"]; warnings = [] },
      { code = "AE-INP-004"; description = "Seed purchase"; examples = ["Paddy seed", "Cotton BT seed"]; warnings = [] },
      { code = "AE-LBR-001"; description = "Labour for crop operations"; examples = ["Transplanting", "Weeding"]; warnings = [] },
      { code = "AE-LBR-002"; description = "Labour for orchard/horticulture"; examples = ["Mango pruning", "Harvest labour"]; warnings = [] },
      { code = "AE-MCH-001"; description = "Machine hire expense"; examples = ["Tractor ploughing hire"]; warnings = [] },
      { code = "AE-MCH-002"; description = "Own machine fuel cost"; examples = ["Diesel for tractor"]; warnings = [] },
      { code = "AE-LND-001"; description = "Land rent / lease payment"; examples = ["Annual lease Rs.15000"]; warnings = [] },
      { code = "AE-HRT-001"; description = "Orchard establishment cost"; examples = ["Mango saplings", "Drip irrigation orchard"]; warnings = [] },
      { code = "AE-GHS-001"; description = "Greenhouse maintenance cost"; examples = ["Shade net replacement"]; warnings = [] },
      { code = "AE-SCH-001"; description = "PMFBY premium payment"; examples = ["PMFBY Kharif premium"]; warnings = [] },
      // Business Expenses
      { code = "BE-DRY-001"; description = "Cattle feed"; examples = ["Dry fodder", "Concentrate feed"]; warnings = [] },
      { code = "BE-DRY-002"; description = "Veterinary charges (cattle)"; examples = ["Vet visit", "Vaccination"]; warnings = [] },
      { code = "BE-PLT-001"; description = "Poultry feed"; examples = ["Layer mash", "Broiler feed"]; warnings = [] },
      { code = "BE-PLT-002"; description = "Poultry medicine"; examples = ["Vaccine", "Antibiotic"]; warnings = [] },
      { code = "BE-PLT-003"; description = "Day-old chicks purchase"; examples = ["DOC broiler", "DOC layer"]; warnings = [] },
      { code = "BE-QUL-001"; description = "Quail farm expense"; examples = ["Quail feed", "Quail cage"]; warnings = [] },
      { code = "BE-PIG-001"; description = "Pig feed"; examples = ["Pig grower mash"]; warnings = [] },
      { code = "BE-FSH-001"; description = "Fingerlings purchase"; examples = ["Rohu fingerlings"]; warnings = [] },
      { code = "BE-FSH-002"; description = "Fish feed"; examples = ["Pellet feed"]; warnings = [] },
      { code = "BE-GHS-001"; description = "Nutrient solution (hydroponics)"; examples = ["NPK solution"]; warnings = [] },
      { code = "BE-GHS-002"; description = "Growing media"; examples = ["Coco peat", "Rockwool"]; warnings = [] },
      { code = "BE-GHS-003"; description = "Microgreens trays and seeds"; examples = ["Tray 10x20", "Sunflower seed"]; warnings = [] },
    ]
  };

  // ─── Per-module classification helpers ────────────────────────────────────

  // Crops — paddy/wheat/maize/pulses via any channel → AI-CRP-001
  public func classifyCrop(cropName : Text, channel : Text) : Common.ClassificationCode {
    ignore (cropName, channel);
    {
      code = "AI-CRP-001";
      incomeType = "Agricultural Income";
      taxSection = "Schedule EI";
      guidance = "Crop sale income is agricultural income — exempt from income tax under Section 10(1)"
    }
  };

  // Dairy — milk is always BI (business income), not AI
  // milk → BI-DRY-001; calf sale → BI-DRY-002; dung/manure → AI-DRY-003
  public func classifyDairy(itemType : Text) : Common.ClassificationCode {
    let item = itemType.toLower();
    if (item.contains(#text "milk")) {
      { code = "BI-DRY-001"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Milk sale is business income (CBDT Circular 47/1983) — NOT agricultural income" }
    } else if (item.contains(#text "amul") or item.contains(#text "cooperative")) {
      { code = "BI-DRY-003"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Cooperative dairy income is business income" }
    } else {
      { code = "BI-DRY-002"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Value-added dairy products (curd, ghee, paneer) are business income" }
    }
  };

  // Horticulture — fruit/vegetable grown in open field → AI-HRT-001
  public func classifyHorticulture(itemType : Text, channel : Text) : Common.ClassificationCode {
    ignore (itemType, channel);
    {
      code = "AI-HRT-001";
      incomeType = "Agricultural Income";
      taxSection = "Schedule EI";
      guidance = "Fruits and vegetables grown in open field are agricultural income"
    }
  };

  // Greenhouse / Hydroponics
  // restaurant/retail/export → BI-GHS-002
  // home_delivery/local/apmc → AI-GHS-001
  public func classifyGreenhouse(itemType : Text, channel : Text) : Common.ClassificationCode {
    ignore itemType;
    let ch = channel.toLower();
    if (ch == "restaurant" or ch == "retail" or ch == "export" or ch == "hotel") {
      if (itemType.toLower().contains(#text "microgreen")) {
        { code = "BI-GHS-002"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Microgreens sold to restaurant/retail/hotel are business income" }
      } else {
        { code = "BI-GHS-001"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Hydroponic/aeroponic produce sold commercially is business income" }
      }
    } else {
      { code = "AI-GHS-001"; incomeType = "Agricultural Income"; taxSection = "Schedule EI"; guidance = "Greenhouse produce sold locally/home delivery is agricultural income" }
    }
  };

  // Fisheries — AI-FSH-001
  public func classifyFisheries(itemType : Text, channel : Text) : Common.ClassificationCode {
    ignore (itemType, channel);
    {
      code = "AI-FSH-001";
      incomeType = "Agricultural Income";
      taxSection = "Schedule EI";
      guidance = "Fish from pond on own agricultural land is agricultural income (Section 2(1A))"
    }
  };

  // Poultry / Eggs
  // Kadaknath → BI-PLT-002 (premium); standard → BI-PLT-001
  public func classifyPoultry(breed : Text, itemType : Text) : Common.ClassificationCode {
    let b = breed.toLower();
    if (b.contains(#text "kadaknath")) {
      { code = "BI-PLT-003"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Kadaknath (premium breed) is business income" }
    } else {
      let item = itemType.toLower();
      if (item.contains(#text "quail")) {
        if (item.contains(#text "egg")) {
          { code = "BI-QUL-002"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Quail eggs are business income" }
        } else {
          { code = "BI-QUL-001"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Quail meat is business income" }
        }
      } else if (item.contains(#text "egg")) {
        { code = "BI-PLT-002"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Hen/layer eggs are business income" }
      } else {
        { code = "BI-PLT-001"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Poultry meat sale is business income" }
      }
    }
  };

  // Machinery hiring income — CHC flag → BI-MCH-001
  public func classifyMachinery(chcFlag : Bool) : Common.ClassificationCode {
    ignore chcFlag;
    {
      code = "BI-MCH-001";
      incomeType = "Business Income";
      taxSection = "Schedule BP";
      guidance = "Machinery hiring income (CHC) is business income"
    }
  };

  // Beekeeping
  // branded → BI-HNY-001; unbranded → AI-HNY-001
  public func classifyBeekeeping(itemType : Text, branded : Bool) : Common.ClassificationCode {
    ignore itemType;
    if (branded) {
      { code = "BI-HNY-002"; incomeType = "Business Income"; taxSection = "Schedule BP"; guidance = "Branded honey with FSSAI licence is business income" }
    } else {
      { code = "AI-HNY-001"; incomeType = "Agricultural Income"; taxSection = "Schedule EI"; guidance = "Unbranded/bulk honey sale is agricultural income" }
    }
  };

  // Solar — DISCOM export → BI-SLR-001
  public func classifySolar(itemType : Text) : Common.ClassificationCode {
    ignore itemType;
    {
      code = "BI-SLR-001";
      incomeType = "Business Income";
      taxSection = "Schedule BP";
      guidance = "Solar power export to DISCOM (PM-KUSUM) is business income"
    }
  };

  // Government scheme receipts — always AI-SCH-xxx (tax-exempt under Schedule EI)
  public func classifySchemeReceipt(schemeName : Text) : Common.ClassificationCode {
    let s = schemeName.toLower();
    let code = if (s.contains(#text "pm-kisan") or s.contains(#text "pm kisan")) {
      "AI-SCH-001"
    } else if (s.contains(#text "rythu bandhu") or s.contains(#text "rytu bandhu")) {
      "AI-SCH-002"
    } else if (s.contains(#text "rythu bharosa") or s.contains(#text "rytu bharosa")) {
      "AI-SCH-003"
    } else if (s.contains(#text "pmfby") or s.contains(#text "fasal bima")) {
      "AI-SCH-004"
    } else {
      "AI-SCH-001" // default scheme receipt is agri income
    };
    {
      code;
      incomeType = "Agricultural Income";
      taxSection = "Schedule EI";
      guidance = "Government scheme receipts are agricultural income — exempt from income tax"
    }
  };

  // Mushroom — AI-MSH-001
  public func classifyMushroom(channel : Text) : Common.ClassificationCode {
    ignore channel;
    {
      code = "AI-MSH-001";
      incomeType = "Agricultural Income";
      taxSection = "Schedule EI";
      guidance = "Mushroom grown as farm byproduct/waste utilisation is agricultural income"
    }
  };

  // Build a warning message for commonly misclassified items
  // Returns ?Text — null means no warning needed
  public func getClassificationWarning(code : Common.ClassificationCode) : ?Text {
    switch (code.code) {
      case "BI-DRY-001" ?"WARNING: Milk is Business Income — NOT Agricultural Income. CBDT Circular 47/1983.";
      case "AI-FSH-001" ?"NOTE: Fish from own farm pond on agricultural land is Agricultural Income (Section 2(1A))";
      case "AI-HNY-001" ?"NOTE: Unbranded/bulk honey is Agricultural Income. If you have FSSAI licence, use BI-HNY-002";
      case "BI-HNY-002" ?"NOTE: Branded honey with FSSAI licence is Business Income";
      case "BI-GHS-002" ?"NOTE: Microgreens sold to restaurant/retail is Business Income";
      case "AI-GHS-001" ?"NOTE: Greenhouse produce sold locally/home is Agricultural Income";
      case "AI-SCH-001" ?"NOTE: PM-KISAN receipts are Agricultural Income — fully exempt under Section 10(1)";
      case "BI-MCH-001" ?"NOTE: Machine hiring income is Business Income even if the machine is used for farming";
      case "AI-MSH-001" ?"NOTE: Mushroom as farm byproduct is Agricultural Income. Commercial mushroom farm is Business Income";
      case "AI-DCK-001" ?"NOTE: Duck eggs from own land are Agricultural Income";
      case _ null;
    }
  };

};
