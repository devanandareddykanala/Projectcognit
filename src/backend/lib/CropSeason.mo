// lib/CropSeason.mo — CropSeason and CropHarvest domain logic
import Common "../types/Common";
import CropTypes "../types/Crop";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";

module {

  // Validate crop season creation input
  public func validateCreate(input : CropTypes.CreateCropSeasonInput) : Common.Result<(), Text> {
    if (input.cropName.size() == 0) return #err("Crop name is required");
    if (input.cropName.size() > 500) return #err("Crop name must be 500 characters or fewer");
    if (input.farmId == 0) return #err("Farm ID is required");
    if (input.fieldId == 0) return #err("Field ID is required");
    if (input.areaSqm == 0) return #err("Crop area must be greater than zero");
    if (input.expectedHarvestDate <= input.sowingDate) {
      return #err("Expected harvest date must be after sowing date");
    };
    let validSeasons = ["Kharif", "Rabi", "Zaid", "Boro", "Perennial"];
    var seasonValid = false;
    for (s in validSeasons.vals()) {
      if (s == input.season) seasonValid := true;
    };
    if (not seasonValid) return #err("Season must be one of: Kharif, Rabi, Zaid, Boro, Perennial");
    #ok(())
  };

  // Build a new CropSeason record
  public func buildCropSeason(
    id : Nat,
    input : CropTypes.CreateCropSeasonInput,
    createdAt : Common.Timestamp,
  ) : CropTypes.CropSeason {
    {
      id;
      farmId = input.farmId;
      fieldId = input.fieldId;
      cropName = input.cropName;
      variety = input.variety;
      season = input.season;
      financialYear = input.financialYear;
      areaSqm = input.areaSqm;
      sowingDate = input.sowingDate;
      expectedHarvestDate = input.expectedHarvestDate;
      expectedYieldQt = null;
      actualYieldQt = null;
      stage = #Sowing;
      isInterCrop = input.isInterCrop;
      parentCropId = input.parentCropId;
      mspPerQuintal = input.mspPerQuintal;
      createdAt;
    }
  };

  // Advance the crop stage (validates stage is a valid progression)
  public func advanceStage(
    season : CropTypes.CropSeason,
    newStage : Common.CropStage,
  ) : Common.Result<CropTypes.CropSeason, Text> {
    let stageOrder = func(s : Common.CropStage) : Nat {
      switch s {
        case (#LandPrep) 0;
        case (#Sowing) 1;
        case (#Germination) 2;
        case (#Vegetative) 3;
        case (#Flowering) 4;
        case (#GrainFilling) 5;
        case (#Harvest) 6;
        case (#PostHarvest) 7;
      }
    };
    if (stageOrder(newStage) <= stageOrder(season.stage)) {
      #err("Stage must be a forward progression from current stage")
    } else {
      #ok({ season with stage = newStage })
    }
  };

  // Build a CropHarvest record from log input
  public func buildHarvest(
    id : Nat,
    recorder : Principal,
    input : CropTypes.LogHarvestInput,
  ) : CropTypes.CropHarvest {
    {
      id;
      cropSeasonId = input.cropSeasonId;
      harvestDate = input.harvestDate;
      actualYieldQt = input.yieldQt;
      qualityGrade = input.qualityGrade;
      moisturePercent = input.moisturePercent;
      notes = input.notes;
      recordedBy = recorder;
    }
  };

  // Update actualYieldQt on CropSeason from harvest log
  public func applyHarvestYield(
    season : CropTypes.CropSeason,
    yieldQt : Float,
  ) : CropTypes.CropSeason {
    { season with actualYieldQt = ?yieldQt; stage = #PostHarvest }
  };

  // Get all MSP-notified crop names for a given season
  // Returns [Text] — empty if season is "Perennial" or "Boro"
  public func getMspNotifiedCrops(season : Text) : [Text] {
    switch season {
      case "Kharif" [
        "Paddy", "Cotton", "Groundnut", "Maize", "Tur", "Jowar", "Bajra",
        "Sesame", "Sunflower", "Soybean", "Nigerseed", "Green gram", "Black gram",
      ];
      case "Rabi" [
        "Wheat", "Mustard", "Chickpea", "Lentil", "Safflower", "Barley",
      ];
      case _ [];
    }
  };

  // Check if a crop is MSP-notified in a given season
  public func isMspNotified(cropName : Text, season : Text) : Bool {
    let crops = getMspNotifiedCrops(season);
    let lower = cropName.toLower();
    var found = false;
    for (c in crops.vals()) {
      if (c.toLower() == lower) found := true;
    };
    found
  };

  // Return default MSP rates seeded for 2025-26
  public func getDefaultMSPRates(financialYear : Text) : [CropTypes.CropMSP] {
    if (financialYear != "2025-26") return [];
    let now = Time.now();
    [
      { id = 1; cropName = "Paddy";     season = "Kharif"; financialYear; mspPerQuintal = 230000; lastUpdated = now },
      { id = 2; cropName = "Wheat";     season = "Rabi";   financialYear; mspPerQuintal = 242500; lastUpdated = now },
      { id = 3; cropName = "Maize";     season = "Kharif"; financialYear; mspPerQuintal = 222500; lastUpdated = now },
      { id = 4; cropName = "Groundnut"; season = "Kharif"; financialYear; mspPerQuintal = 685000; lastUpdated = now },
      { id = 5; cropName = "Cotton";    season = "Kharif"; financialYear; mspPerQuintal = 712100; lastUpdated = now },
      { id = 6; cropName = "Tur";       season = "Kharif"; financialYear; mspPerQuintal = 755000; lastUpdated = now },
      { id = 7; cropName = "Soybean";   season = "Kharif"; financialYear; mspPerQuintal = 489200; lastUpdated = now },
      { id = 8; cropName = "Mustard";   season = "Rabi";   financialYear; mspPerQuintal = 595000; lastUpdated = now },
      { id = 9; cropName = "Chickpea";  season = "Rabi";   financialYear; mspPerQuintal = 576000; lastUpdated = now },
    ]
  };
};
