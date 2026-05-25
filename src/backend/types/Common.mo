// types/Common.mo — Cross-cutting shared types for Kisan Seva
import Debug "mo:core/Debug";
import Time "mo:core/Time";

module {

  // ─── Fundamental primitives ───────────────────────────────────────────────

  public type Timestamp = Int; // nanoseconds since epoch (Time.now())

  // ─── Result alias ─────────────────────────────────────────────────────────

  public type Result<T, E> = { #ok : T; #err : E };

  // ─── Pagination ───────────────────────────────────────────────────────────

  public type PageParams = {
    offset : Nat;
    limit : Nat;
  };

  public type Page<T> = {
    items : [T];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  // ─── Role & module access ─────────────────────────────────────────────────

  public type MemberRole = {
    #Admin;    // Full access — Malik
    #Member;   // Read + write — Sadasya
    #ViewOnly; // Read-only — Dekhne Wala
  };

  public type ModuleToggles = {
    crops : Bool;
    dairy : Bool;
    horticulture : Bool;
    greenhouse : Bool;
    fisheries : Bool;
    poultry : Bool;
    solar : Bool;
    finance : Bool;
    labour : Bool;
    machinery : Bool;
  };

  // ─── Audit log ────────────────────────────────────────────────────────────

  public type AuditLog = {
    id : Nat;
    farmId : Nat;
    actorPrincipal : Principal;
    action : Text;      // e.g. "CREATE", "UPDATE", "DELETE"
    entityType : Text;  // e.g. "Farm", "Field", "CropSeason"
    entityId : Text;
    details : Text;
    timestamp : Timestamp;
  };

  // ─── Crop stage variant ───────────────────────────────────────────────────

  public type CropStage = {
    #LandPrep;
    #Sowing;
    #Germination;
    #Vegetative;
    #Flowering;
    #GrainFilling;
    #Harvest;
    #PostHarvest;
  };

  // ─── Quality grade variant ────────────────────────────────────────────────

  public type QualityGrade = {
    #FAQ;        // Fair Average Quality (APMC standard)
    #GradeA;
    #GradeB;
    #Processing;
    #Rejected;
  };

  // ─── Income / expense code record ─────────────────────────────────────────

  public type ClassificationCode = {
    code : Text;           // e.g. "AI-CRP-001"
    incomeType : Text;     // "Agricultural Income" | "Business Income" | etc.
    taxSection : Text;     // "Schedule EI" | "Schedule BP" | ...
    guidance : Text;
  };

  public type ClassificationEntry = {
    code : Text;
    description : Text;
    examples : [Text];
    warnings : [Text];
  };

  // ─── Notification type ────────────────────────────────────────────────────

  public type NotificationEntity = {
    id : Nat;
    farmId : Nat;
    recipientPrincipal : Principal;
    notifType : Text;
    title : Text;
    body : Text;
    soundType : Text;
    isRead : Bool;
    snoozedUntil : ?Timestamp;
    isDismissed : Bool;
    createdAt : Timestamp;
  };

};
