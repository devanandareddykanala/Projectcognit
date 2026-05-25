// mixins/crop-api.mo — Public CropSeason, CropHarvest, and MSP API
import Common "../types/Common";
import CropTypes "../types/Crop";
import FarmTypes "../types/Farm";
import CropLib "../lib/CropSeason";
import AuthLib "../lib/Auth";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";

mixin (
  farms : Map.Map<Nat, FarmTypes.Farm>,
  farmMembers : Map.Map<Nat, FarmTypes.FarmMember>,
  cropSeasons : Map.Map<Nat, CropTypes.CropSeason>,
  cropSeasonCounter : { var v : Nat },
  cropHarvests : Map.Map<Nat, CropTypes.CropHarvest>,
  cropHarvestCounter : { var v : Nat },
  mspRates : Map.Map<Nat, CropTypes.CropMSP>,
  mspCounter : { var v : Nat },
) {

  // ─── Private helpers ──────────────────────────────────────────────────────

  private func getFarmMembersFor_(farmId : Nat) : [FarmTypes.FarmMember] {
    var acc : [FarmTypes.FarmMember] = [];
    for ((_, m) in farmMembers.entries()) {
      if (m.farmId == farmId) acc := acc.concat([m]);
    };
    acc
  };

  private func verifyFarmMember__(caller : Principal, farmId : Nat) : Common.Result<(), Text> {
    switch (farms.get(farmId)) {
      case null { return #err("Farm not found") };
      case (?farm) {
        if (farm.ownerPrincipal == caller) return #ok(());
        let mems = getFarmMembersFor_(farmId);
        switch (AuthLib.requireRole(caller, mems, #ViewOnly)) {
          case (#ok _) #ok(());
          case (#err e) #err(e);
        }
      };
    }
  };

  private func verifyMemberOrAdmin_(caller : Principal, farmId : Nat) : Common.Result<(), Text> {
    switch (farms.get(farmId)) {
      case null { return #err("Farm not found") };
      case (?farm) {
        if (farm.ownerPrincipal == caller) return #ok(());
        let mems = getFarmMembersFor_(farmId);
        switch (AuthLib.requireRole(caller, mems, #Member)) {
          case (#ok _) #ok(());
          case (#err e) #err(e);
        }
      };
    }
  };

  // ─── Crop season methods ──────────────────────────────────────────────────

  public query ({ caller }) func getCropSeasonsForFarm(
    farmId : Nat,
    financialYear : Text,
  ) : async Common.Result<[CropTypes.CropSeason], Text> {
    switch (verifyFarmMember__(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    var acc : [CropTypes.CropSeason] = [];
    for ((_, cs) in cropSeasons.entries()) {
      if (cs.farmId == farmId and cs.financialYear == financialYear) {
        acc := acc.concat([cs]);
      };
    };
    #ok(acc)
  };

  public query ({ caller }) func getCropSeasonsForField(
    fieldId : Nat,
  ) : async Common.Result<[CropTypes.CropSeason], Text> {
    // Find the farmId from any cropSeason for this fieldId, or from field lookup
    // We verify the caller is a member of the farm that owns this field
    var farmId : ?Nat = null;
    for ((_, cs) in cropSeasons.entries()) {
      if (cs.fieldId == fieldId) farmId := ?cs.farmId;
    };
    switch farmId {
      case null {
        // No crop seasons for field — allow if caller has any farm association
        // Return empty list without auth failure (field may have no crops yet)
        return #ok([]);
      };
      case (?fid) {
        switch (verifyFarmMember__(caller, fid)) {
          case (#err e) { return #err(e) };
          case (#ok _) {};
        };
      };
    };
    var acc : [CropTypes.CropSeason] = [];
    for ((_, cs) in cropSeasons.entries()) {
      if (cs.fieldId == fieldId) acc := acc.concat([cs]);
    };
    #ok(acc)
  };

  public shared ({ caller }) func createCropSeason(
    farmId : Nat,
    fieldId : Nat,
    cropName : Text,
    variety : Text,
    season : Text,
    financialYear : Text,
    areaSqm : Nat,
    sowingDate : Common.Timestamp,
    expectedHarvestDate : Common.Timestamp,
    mspPerQuintal : ?Nat,
    isInterCrop : Bool,
    parentCropId : ?Nat,
  ) : async Common.Result<CropTypes.CropSeason, Text> {
    switch (verifyMemberOrAdmin_(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    let input : CropTypes.CreateCropSeasonInput = {
      farmId; fieldId; cropName; variety; season; financialYear;
      areaSqm; sowingDate; expectedHarvestDate; isInterCrop; parentCropId;
      mspPerQuintal;
    };
    switch (CropLib.validateCreate(input)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    // Auto-lookup MSP if not provided and crop is MSP-notified
    let resolvedMsp : ?Nat = switch mspPerQuintal {
      case (?m) ?m;
      case null {
        if (CropLib.isMspNotified(cropName, season)) {
          // Look up from mspRates store
          var found : ?Nat = null;
          let lowerCrop = cropName.toLower();
          for ((_, rate) in mspRates.entries()) {
            if (rate.cropName.toLower() == lowerCrop and
                rate.season == season and
                rate.financialYear == financialYear) {
              found := ?rate.mspPerQuintal;
            };
          };
          found
        } else null
      };
    };
    let finalInput = { input with mspPerQuintal = resolvedMsp };
    let now = Time.now();
    cropSeasonCounter.v += 1;
    let cs = CropLib.buildCropSeason(cropSeasonCounter.v, finalInput, now);
    cropSeasons.add(cropSeasonCounter.v, cs);
    #ok(cs)
  };

  public shared ({ caller }) func updateCropStage(
    cropSeasonId : Nat,
    stage : Common.CropStage,
  ) : async Common.Result<CropTypes.CropSeason, Text> {
    switch (cropSeasons.get(cropSeasonId)) {
      case null { return #err("Crop season not found") };
      case (?cs) {
        switch (verifyMemberOrAdmin_(caller, cs.farmId)) {
          case (#err e) { return #err(e) };
          case (#ok _) {};
        };
        switch (CropLib.advanceStage(cs, stage)) {
          case (#err e) { #err(e) };
          case (#ok updated) {
            cropSeasons.add(cropSeasonId, updated);
            #ok(updated)
          };
        }
      };
    }
  };

  public shared ({ caller }) func logHarvest(
    cropSeasonId : Nat,
    harvestDate : Common.Timestamp,
    yieldQt : Float,
    qualityGrade : Common.QualityGrade,
    moisturePercent : ?Float,
    notes : ?Text,
  ) : async Common.Result<CropTypes.CropHarvest, Text> {
    switch (cropSeasons.get(cropSeasonId)) {
      case null { return #err("Crop season not found") };
      case (?cs) {
        switch (verifyMemberOrAdmin_(caller, cs.farmId)) {
          case (#err e) { return #err(e) };
          case (#ok _) {};
        };
        let input : CropTypes.LogHarvestInput = {
          cropSeasonId;
          harvestDate;
          yieldQt;
          qualityGrade;
          moisturePercent;
          notes;
        };
        cropHarvestCounter.v += 1;
        let harvest = CropLib.buildHarvest(cropHarvestCounter.v, caller, input);
        cropHarvests.add(cropHarvestCounter.v, harvest);
        // Update crop season with actual yield and set stage to PostHarvest
        let updatedCs = CropLib.applyHarvestYield(cs, yieldQt);
        cropSeasons.add(cropSeasonId, updatedCs);
        #ok(harvest)
      };
    }
  };

  // ─── MSP ──────────────────────────────────────────────────────────────────

  public query func getCropMSP(
    cropName : Text,
    season : Text,
    financialYear : Text,
  ) : async Common.Result<?CropTypes.CropMSP, Text> {
    let lowerCrop = cropName.toLower();
    var found : ?CropTypes.CropMSP = null;
    for ((_, rate) in mspRates.entries()) {
      if (rate.cropName.toLower() == lowerCrop and
          rate.season == season and
          rate.financialYear == financialYear) {
        found := ?rate;
      };
    };
    #ok(found)
  };

  public query func getAllMSPRates(
    financialYear : Text,
  ) : async [CropTypes.CropMSP] {
    var acc : [CropTypes.CropMSP] = [];
    for ((_, rate) in mspRates.entries()) {
      if (rate.financialYear == financialYear) {
        acc := acc.concat([rate]);
      };
    };
    acc
  };

};
