// lib/Field.mo — Field entity domain logic, LandRecord
import Common "../types/Common";
import FieldTypes "../types/Field";
import Text "mo:core/Text";

module {

  // Validate field creation input
  public func validateCreate(input : FieldTypes.CreateFieldInput) : Common.Result<(), Text> {
    if (input.name.size() == 0) return #err("Field name is required");
    if (input.name.size() > 500) return #err("Field name must be 500 characters or fewer");
    if (input.areaSqm == 0) return #err("Field area must be greater than zero");
    if (input.geoPoints.size() > 100) return #err("Field boundary may have at most 100 GPS points");
    #ok(())
  };

  // Build a new Field record
  public func buildField(
    id : Nat,
    input : FieldTypes.CreateFieldInput,
    createdAt : Common.Timestamp,
  ) : FieldTypes.Field {
    {
      id;
      farmId = input.farmId;
      name = input.name;
      areaSqm = input.areaSqm;
      unit = input.unit;
      soilType = input.soilType;
      irrigationType = input.irrigationType;
      tenure = input.tenure;
      surveyNumber = input.surveyNumber;
      ulpin = input.ulpin;
      landRecordRef = null;
      shcNumber = input.shcNumber;
      shcExpiry = input.shcExpiry;
      geoPoints = input.geoPoints;
      isActive = true;
      createdAt;
    }
  };

  // Apply field update input
  public func applyUpdate(
    field : FieldTypes.Field,
    updates : FieldTypes.UpdateFieldInput,
  ) : FieldTypes.Field {
    {
      field with
      name = switch (updates.name) { case (?n) n; case null field.name };
      areaSqm = switch (updates.areaSqm) { case (?a) a; case null field.areaSqm };
      unit = switch (updates.unit) { case (?u) u; case null field.unit };
      soilType = switch (updates.soilType) { case (?s) s; case null field.soilType };
      irrigationType = switch (updates.irrigationType) { case (?i) i; case null field.irrigationType };
      tenure = switch (updates.tenure) { case (?t) t; case null field.tenure };
      surveyNumber = switch (updates.surveyNumber) { case (?s) ?s; case null field.surveyNumber };
      ulpin = switch (updates.ulpin) { case (?u) ?u; case null field.ulpin };
      shcNumber = switch (updates.shcNumber) { case (?s) ?s; case null field.shcNumber };
      shcExpiry = switch (updates.shcExpiry) { case (?e) ?e; case null field.shcExpiry };
      geoPoints = switch (updates.geoPoints) { case (?g) g; case null field.geoPoints };
    }
  };

  // Build a LandRecord from save input
  public func buildLandRecord(
    id : Nat,
    fieldId : Nat,
    input : FieldTypes.SaveLandRecordInput,
  ) : FieldTypes.LandRecord {
    {
      id;
      fieldId;
      state = input.state;
      adangalNumber = input.adangalNumber;
      pattadarPassbook = input.pattadarPassbook;
      pahaniNumber = input.pahaniNumber;
      bhudhaarNumber = input.bhudhaarNumber;
      satbaraNumber = input.satbaraNumber;
      rtcNumber = input.rtcNumber;
      genericRecordNumber = input.genericRecordNumber;
    }
  };

  // Check if SHC renewal reminder should fire (< 90 days until expiry)
  public func needsShcRenewal(field : FieldTypes.Field, now : Common.Timestamp) : Bool {
    // 90 days in nanoseconds = 90 * 24 * 60 * 60 * 1_000_000_000
    let ninetyDaysNs : Int = 7_776_000_000_000_000;
    switch (field.shcExpiry) {
      case null false;
      case (?expiry) {
        expiry - now <= ninetyDaysNs and expiry > now
      };
    }
  };

};
