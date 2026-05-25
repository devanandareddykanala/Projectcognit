// mixins/field-api.mo — Public Field and LandRecord API
import Common "../types/Common";
import FieldTypes "../types/Field";
import FarmTypes "../types/Farm";
import FieldLib "../lib/Field";
import AuthLib "../lib/Auth";
import NotifLib "../lib/Notifications";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";

mixin (
  farms : Map.Map<Nat, FarmTypes.Farm>,
  fields : Map.Map<Nat, FieldTypes.Field>,
  fieldCounter : { var v : Nat },
  landRecords : Map.Map<Nat, FieldTypes.LandRecord>,
  landRecordCounter : { var v : Nat },
  farmMembers : Map.Map<Nat, FarmTypes.FarmMember>,
  notifications : Map.Map<Nat, Common.NotificationEntity>,
  notifCounter : { var v : Nat },
) {

  // ─── Private helpers ──────────────────────────────────────────────────────

  private func getFarmMembersFor(farmId : Nat) : [FarmTypes.FarmMember] {
    var acc : [FarmTypes.FarmMember] = [];
    for ((_, m) in farmMembers.entries()) {
      if (m.farmId == farmId) acc := acc.concat([m]);
    };
    acc
  };

  private func verifyFarmMember_(caller : Principal, farmId : Nat) : Common.Result<(), Text> {
    switch (farms.get(farmId)) {
      case null { return #err("Farm not found") };
      case (?farm) {
        if (farm.ownerPrincipal == caller) return #ok(());
        let mems = getFarmMembersFor(farmId);
        switch (AuthLib.requireRole(caller, mems, #ViewOnly)) {
          case (#ok _) #ok(());
          case (#err e) #err(e);
        }
      };
    }
  };

  private func verifyMemberOrAdmin(caller : Principal, farmId : Nat) : Common.Result<(), Text> {
    switch (farms.get(farmId)) {
      case null { return #err("Farm not found") };
      case (?farm) {
        if (farm.ownerPrincipal == caller) return #ok(());
        let mems = getFarmMembersFor(farmId);
        switch (AuthLib.requireRole(caller, mems, #Member)) {
          case (#ok _) #ok(());
          case (#err e) #err(e);
        }
      };
    }
  };

  private func verifyAdmin_(caller : Principal, farmId : Nat) : Common.Result<(), Text> {
    switch (farms.get(farmId)) {
      case null { return #err("Farm not found") };
      case (?farm) {
        if (farm.ownerPrincipal == caller) return #ok(());
        let mems = getFarmMembersFor(farmId);
        switch (AuthLib.requireRole(caller, mems, #Admin)) {
          case (#ok _) #ok(());
          case (#err e) #err(e);
        }
      };
    }
  };

  // ─── Field methods ────────────────────────────────────────────────────────

  public query ({ caller }) func getFieldsForFarm(
    farmId : Nat,
  ) : async Common.Result<[FieldTypes.Field], Text> {
    switch (verifyFarmMember_(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    var acc : [FieldTypes.Field] = [];
    for ((_, f) in fields.entries()) {
      if (f.farmId == farmId and f.isActive) {
        acc := acc.concat([f]);
      };
    };
    #ok(acc)
  };

  public shared ({ caller }) func createField(
    farmId : Nat,
    name : Text,
    areaSqm : Nat,
    unit : Text,
    soilType : Text,
    irrigationType : Text,
    tenure : Text,
    surveyNumber : ?Text,
    ulpin : ?Text,
    shcNumber : ?Text,
    shcExpiry : ?Common.Timestamp,
    geoPoints : [(Float, Float)],
  ) : async Common.Result<FieldTypes.Field, Text> {
    switch (verifyMemberOrAdmin(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    let input : FieldTypes.CreateFieldInput = {
      farmId; name; areaSqm; unit; soilType; irrigationType;
      tenure; surveyNumber; ulpin; shcNumber; shcExpiry; geoPoints;
    };
    switch (FieldLib.validateCreate(input)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    let now = Time.now();
    fieldCounter.v += 1;
    let field = FieldLib.buildField(fieldCounter.v, input, now);
    fields.add(fieldCounter.v, field);
    // SHC expiry notification if needed
    if (NotifLib.shcExpiryAlert(shcExpiry, now)) {
      notifCounter.v += 1;
      let notif = NotifLib.buildNotification(
        notifCounter.v,
        farmId,
        caller,
        "shc_expiry",
        "Soil Health Card Expiring Soon",
        "Soil Health Card for field " # name # " expires soon. Please renew.",
        "reminder",
        now,
      );
      notifications.add(notifCounter.v, notif);
    };
    #ok(field)
  };

  public shared ({ caller }) func updateField(
    fieldId : Nat,
    updates : FieldTypes.UpdateFieldInput,
  ) : async Common.Result<FieldTypes.Field, Text> {
    switch (fields.get(fieldId)) {
      case null { return #err("Field not found") };
      case (?field) {
        switch (verifyMemberOrAdmin(caller, field.farmId)) {
          case (#err e) { return #err(e) };
          case (#ok _) {};
        };
        let updated = FieldLib.applyUpdate(field, updates);
        fields.add(fieldId, updated);
        #ok(updated)
      };
    }
  };

  public shared ({ caller }) func deleteField(
    fieldId : Nat,
  ) : async Common.Result<Bool, Text> {
    switch (fields.get(fieldId)) {
      case null { return #err("Field not found") };
      case (?field) {
        switch (verifyAdmin_(caller, field.farmId)) {
          case (#err e) { return #err(e) };
          case (#ok _) {};
        };
        let deactivated = { field with isActive = false };
        fields.add(fieldId, deactivated);
        #ok(true)
      };
    }
  };

  public shared ({ caller }) func saveLandRecord(
    fieldId : Nat,
    record : FieldTypes.SaveLandRecordInput,
  ) : async Common.Result<FieldTypes.LandRecord, Text> {
    switch (fields.get(fieldId)) {
      case null { return #err("Field not found") };
      case (?field) {
        switch (verifyMemberOrAdmin(caller, field.farmId)) {
          case (#err e) { return #err(e) };
          case (#ok _) {};
        };
        // Check for existing land record for this field and update in place
        var existingId : ?Nat = null;
        for ((id, lr) in landRecords.entries()) {
          if (lr.fieldId == fieldId) existingId := ?id;
        };
        let lrId = switch existingId {
          case (?eid) eid;
          case null {
            landRecordCounter.v += 1;
            landRecordCounter.v
          };
        };
        let lr = FieldLib.buildLandRecord(lrId, fieldId, record);
        landRecords.add(lrId, lr);
        #ok(lr)
      };
    }
  };

  public query ({ caller }) func getLandRecord(
    fieldId : Nat,
  ) : async Common.Result<?FieldTypes.LandRecord, Text> {
    switch (fields.get(fieldId)) {
      case null { return #err("Field not found") };
      case (?field) {
        switch (verifyFarmMember_(caller, field.farmId)) {
          case (#err e) { return #err(e) };
          case (#ok _) {};
        };
        var found : ?FieldTypes.LandRecord = null;
        for ((_, lr) in landRecords.entries()) {
          if (lr.fieldId == fieldId) found := ?lr;
        };
        #ok(found)
      };
    }
  };

};
