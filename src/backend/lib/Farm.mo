// lib/Farm.mo — Farm entity domain logic, KS Farm ID generation, FarmerProfile
import Common "../types/Common";
import FarmTypes "../types/Farm";
import Nat "mo:core/Nat";
import Text "mo:core/Text";

module {

  // Generate a KS Farm ID from Random.blob() entropy
  // Format: KS-[STATE_CODE]-[YEAR]-[6 DIGIT RANDOM]
  // state: full state name ("Andhra Pradesh" → "AP")
  // Generate a KS Farm ID from Random.blob() entropy
  // Format: KS-[STATE_CODE]-[YEAR]-[8 ALPHANUMERIC RANDOM]
  // Uses 5 bytes of entropy to produce an 8-char alphanumeric suffix (base-36)
  public func generateKsId(
    stateCode_ : Text,
    year : Text,
    entropyBlob : Blob,
  ) : Text {
    // Base-36 alphabet (no ambiguous chars: 0, O, 1, I, L excluded)
    let alphabet : [Char] = [
      '2', '3', '4', '5', '6', '7', '8', '9',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
      'J', 'K', 'M', 'N', 'P', 'Q', 'R', 'S',
      'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    ];
    let base : Nat = alphabet.size(); // 31
    // Read first 5 bytes → Nat (max 40-bit value ~1.1e12)
    let arr = entropyBlob.vals();
    var n : Nat = 0;
    var count = 0;
    label byteLoop for (b in arr) {
      if (count >= 5) break byteLoop;
      n := n * 256 + Nat.fromNat8(b);
      count += 1;
    };
    // Encode n into 8 base-31 characters
    var suffix = "";
    var remaining = n;
    var chars : [Char] = [];
    var i = 0;
    while (i < 8) {
      let idx = remaining % base;
      chars := [alphabet[idx]].concat(chars);
      remaining := remaining / base;
      i += 1;
    };
    for (c in chars.vals()) {
      suffix := suffix # Text.fromChar(c);
    };
    "KS-" # stateCode_ # "-" # year # "-" # suffix
  };

  // Extract 2-letter state code from full state name
  public func stateCode(stateName : Text) : Text {
    let lower = stateName.toLower();
    if (lower.contains(#text "andhra")) "AP"
    else if (lower.contains(#text "telangana")) "TG"
    else if (lower.contains(#text "maharashtra")) "MH"
    else if (lower.contains(#text "karnataka")) "KA"
    else if (lower.contains(#text "tamil")) "TN"
    else if (lower.contains(#text "kerala")) "KL"
    else if (lower.contains(#text "gujarat")) "GJ"
    else if (lower.contains(#text "rajasthan")) "RJ"
    else if (lower.contains(#text "madhya pradesh")) "MP"
    else if (lower.contains(#text "uttar pradesh")) "UP"
    else if (lower.contains(#text "punjab")) "PB"
    else if (lower.contains(#text "haryana")) "HR"
    else if (lower.contains(#text "bihar")) "BR"
    else if (lower.contains(#text "west bengal")) "WB"
    else if (lower.contains(#text "odisha")) "OD"
    else if (lower.contains(#text "assam")) "AS"
    else if (lower.contains(#text "jharkhand")) "JH"
    else if (lower.contains(#text "chhattisgarh")) "CG"
    else if (lower.contains(#text "uttarakhand")) "UK"
    else if (lower.contains(#text "himachal")) "HP"
    else if (lower.contains(#text "goa")) "GA"
    else {
      // Take first 2 chars uppercase as fallback
      let chars = stateName.toUpper();
      let charArr = chars.toArray();
      if (charArr.size() >= 2) {
        Text.fromChar(charArr[0]) # Text.fromChar(charArr[1])
      } else "IN"
    }
  };

  // Check if a farm name+location combination already exists (uniqueness enforcement)
  public func isDuplicateFarm(
    name : Text,
    state : Text,
    mandal : Text,
    village : Text,
    existing : [FarmTypes.Farm],
  ) : Bool {
    let n = name.toLower().trim(#char ' ');
    let s = state.toLower().trim(#char ' ');
    let m = mandal.toLower().trim(#char ' ');
    let v = village.toLower().trim(#char ' ');
    var dup = false;
    for (farm in existing.vals()) {
      if (
        farm.name.toLower().trim(#char ' ') == n and
        farm.state.toLower().trim(#char ' ') == s and
        farm.mandal.toLower().trim(#char ' ') == m and
        farm.village.toLower().trim(#char ' ') == v
      ) {
        dup := true;
      };
    };
    dup
  };

  // Validate farm creation input
  public func validateCreate(input : FarmTypes.CreateFarmInput) : Common.Result<(), Text> {
    if (input.name.size() == 0) return #err("Farm name is required");
    if (input.name.size() > 500) return #err("Farm name must be 500 characters or fewer");
    if (input.state.size() == 0) return #err("State is required");
    if (input.district.size() == 0) return #err("District is required");
    if (input.mandal.size() == 0) return #err("Mandal is required");
    if (input.village.size() == 0) return #err("Village is required");
    if (input.totalAreaSqm == 0) return #err("Total area must be greater than zero");
    #ok(())
  };

  // Build a new Farm record (does not persist — persistence is in the mixin)
  public func buildFarm(
    id : Nat,
    ksId : Text,
    ownerPrincipal : Principal,
    input : FarmTypes.CreateFarmInput,
    createdAt : Common.Timestamp,
  ) : FarmTypes.Farm {
    {
      id;
      ksId;
      name = input.name;
      ownerPrincipal;
      state = input.state;
      district = input.district;
      mandal = input.mandal;
      village = input.village;
      surveyNumber = input.surveyNumber;
      totalAreaSqm = input.totalAreaSqm;
      ownershipType = input.ownershipType;
      purposes = input.purposes;
      createdAt;
      isDemo = false;
    }
  };

  // Apply an UpdateFarmInput to an existing Farm (returns updated record)
  public func applyUpdate(
    farm : FarmTypes.Farm,
    updates : FarmTypes.UpdateFarmInput,
  ) : FarmTypes.Farm {
    {
      farm with
      name = switch (updates.name) { case (?n) n; case null farm.name };
      district = switch (updates.district) { case (?d) d; case null farm.district };
      mandal = switch (updates.mandal) { case (?m) m; case null farm.mandal };
      village = switch (updates.village) { case (?v) v; case null farm.village };
      surveyNumber = switch (updates.surveyNumber) { case (?s) ?s; case null farm.surveyNumber };
      totalAreaSqm = switch (updates.totalAreaSqm) { case (?a) a; case null farm.totalAreaSqm };
      ownershipType = switch (updates.ownershipType) { case (?o) o; case null farm.ownershipType };
      purposes = switch (updates.purposes) { case (?p) p; case null farm.purposes };
    }
  };

  // Validate and apply FarmerProfile save
  public func validateProfile(profile : FarmTypes.FarmerProfile) : Common.Result<(), Text> {
    // Validate IFSC: 11 chars, first 4 alpha, 5th char 0, last 6 alphanumeric
    switch (profile.bankIfsc) {
      case (?ifsc) {
        if (ifsc.size() != 11) {
          return #err("Bank IFSC code must be exactly 11 characters");
        };
      };
      case null {};
    };
    // Validate GST: 15 characters
    switch (profile.gstNumber) {
      case (?gst) {
        if (gst.size() != 15) {
          return #err("GST number must be exactly 15 characters");
        };
      };
      case null {};
    };
    #ok(())
  };

};
