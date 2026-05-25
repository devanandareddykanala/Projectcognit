// types/Field.mo — Field, LandRecord types
import Common "../types/Common";

module {

  public type Field = {
    id : Nat;
    farmId : Nat;
    name : Text;
    areaSqm : Nat;
    unit : Text;           // acres | guntha | cents | hectares | bigha
    soilType : Text;
    irrigationType : Text;
    tenure : Text;
    surveyNumber : ?Text;
    ulpin : ?Text;         // Unique Land Parcel Identification Number (optional)
    landRecordRef : ?Text;
    shcNumber : ?Text;     // Soil Health Card number
    shcExpiry : ?Common.Timestamp;
    geoPoints : [(Float, Float)];  // Max 100 points
    isActive : Bool;
    createdAt : Common.Timestamp;
  };

  public type LandRecord = {
    id : Nat;
    fieldId : Nat;
    state : Text;
    adangalNumber : ?Text;      // AP — Adangal
    pattadarPassbook : ?Text;   // AP — Pattadar Passbook
    pahaniNumber : ?Text;       // TG — Pahani
    bhudhaarNumber : ?Text;     // TG — Bhudhaar
    satbaraNumber : ?Text;      // MH — 7/12 Utara
    rtcNumber : ?Text;          // KA — RTC
    genericRecordNumber : ?Text; // Other states
  };

  // ─── Input shapes ─────────────────────────────────────────────────────────

  public type CreateFieldInput = {
    farmId : Nat;
    name : Text;
    areaSqm : Nat;
    unit : Text;
    soilType : Text;
    irrigationType : Text;
    tenure : Text;
    surveyNumber : ?Text;
    ulpin : ?Text;
    shcNumber : ?Text;
    shcExpiry : ?Common.Timestamp;
    geoPoints : [(Float, Float)];
  };

  public type UpdateFieldInput = {
    name : ?Text;
    areaSqm : ?Nat;
    unit : ?Text;
    soilType : ?Text;
    irrigationType : ?Text;
    tenure : ?Text;
    surveyNumber : ?Text;
    ulpin : ?Text;
    shcNumber : ?Text;
    shcExpiry : ?Common.Timestamp;
    geoPoints : ?[(Float, Float)];
  };

  public type SaveLandRecordInput = {
    state : Text;
    adangalNumber : ?Text;
    pattadarPassbook : ?Text;
    pahaniNumber : ?Text;
    bhudhaarNumber : ?Text;
    satbaraNumber : ?Text;
    rtcNumber : ?Text;
    genericRecordNumber : ?Text;
  };

};
