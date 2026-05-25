// types/Farm.mo — Farm, FarmerProfile, FarmMember, InviteToken types
import Common "../types/Common";

module {

  public type Farm = {
    id : Nat;
    ksId : Text;           // Format: KS-[STATE]-[YEAR]-[6 DIGIT RANDOM]
    name : Text;
    ownerPrincipal : Principal;
    state : Text;
    district : Text;
    mandal : Text;
    village : Text;
    surveyNumber : ?Text;  // Optional — never block farm creation
    totalAreaSqm : Nat;
    ownershipType : Text;  // Own | Leased | Shared | Assigned
    purposes : [Text];     // Crops | Dairy | Horticulture | Greenhouse | Fisheries | Poultry | Solar
    createdAt : Common.Timestamp;
    isDemo : Bool;
  };

  public type FarmerProfile = {
    principal : Principal;
    name : Text;
    mobile : ?Text;
    aadhaarBankLinked : Bool;
    bankBranch : ?Text;
    bankIfsc : ?Text;
    bankLast4 : ?Text;     // Last 4 digits only — never store full account number
    fpoMember : Bool;
    gstNumber : ?Text;
    fssaiNumber : ?Text;
    agristackId : ?Text;
  };

  public type FarmMember = {
    id : Nat;
    farmId : Nat;
    principal : ?Principal;
    name : Text;
    relation : Text;
    emoji : Text;
    phone : ?Text;
    role : Common.MemberRole;
    moduleToggles : Common.ModuleToggles;
    joinedAt : Common.Timestamp;
    lastActiveAt : ?Common.Timestamp;
    addedBy : Principal;
  };

  public type InviteToken = {
    id : Nat;
    farmId : Nat;
    code : Text;           // 6-char alphanumeric, no ambiguous chars (0O1lI)
    token : Text;          // Full link token
    hmac : Text;           // HMAC signature for tamper detection
    role : Common.MemberRole;
    moduleToggles : Common.ModuleToggles;
    expiresAt : Common.Timestamp;
    createdBy : Principal;
    acceptedBy : ?Principal;
    revokedAt : ?Common.Timestamp;
  };

  // ─── Input shapes for mutations ───────────────────────────────────────────

  public type CreateFarmInput = {
    name : Text;
    state : Text;
    district : Text;
    mandal : Text;
    village : Text;
    surveyNumber : ?Text;
    totalAreaSqm : Nat;
    unit : Text;
    ownershipType : Text;
    purposes : [Text];
  };

  public type UpdateFarmInput = {
    name : ?Text;
    district : ?Text;
    mandal : ?Text;
    village : ?Text;
    surveyNumber : ?Text;
    totalAreaSqm : ?Nat;
    ownershipType : ?Text;
    purposes : ?[Text];
  };

};
