// types/Crop.mo — CropSeason, CropHarvest, CropMSP types
import Common "../types/Common";

module {

  public type CropSeason = {
    id : Nat;
    farmId : Nat;
    fieldId : Nat;
    cropName : Text;
    variety : Text;
    season : Text;             // Kharif | Rabi | Zaid | Boro | Perennial
    financialYear : Text;      // e.g. "2025-26"
    areaSqm : Nat;
    sowingDate : Common.Timestamp;
    expectedHarvestDate : Common.Timestamp;
    expectedYieldQt : ?Float;
    actualYieldQt : ?Float;
    stage : Common.CropStage;
    isInterCrop : Bool;
    parentCropId : ?Nat;       // Set when this is an inter-crop
    mspPerQuintal : ?Nat;      // Pre-filled from CropMSP if available
    createdAt : Common.Timestamp;
  };

  public type CropHarvest = {
    id : Nat;
    cropSeasonId : Nat;
    harvestDate : Common.Timestamp;
    actualYieldQt : Float;
    qualityGrade : Common.QualityGrade;
    moisturePercent : ?Float;
    notes : ?Text;
    recordedBy : Principal;
  };

  public type CropMSP = {
    id : Nat;
    cropName : Text;
    season : Text;           // Kharif | Rabi
    financialYear : Text;
    mspPerQuintal : Nat;     // in paise (₹ × 100)
    lastUpdated : Common.Timestamp;
  };

  // ─── Input shapes ─────────────────────────────────────────────────────────

  public type CreateCropSeasonInput = {
    farmId : Nat;
    fieldId : Nat;
    cropName : Text;
    variety : Text;
    season : Text;
    financialYear : Text;
    areaSqm : Nat;
    sowingDate : Common.Timestamp;
    expectedHarvestDate : Common.Timestamp;
    mspPerQuintal : ?Nat;
    isInterCrop : Bool;
    parentCropId : ?Nat;
  };

  public type LogHarvestInput = {
    cropSeasonId : Nat;
    harvestDate : Common.Timestamp;
    yieldQt : Float;
    qualityGrade : Common.QualityGrade;
    moisturePercent : ?Float;
    notes : ?Text;
  };

};
