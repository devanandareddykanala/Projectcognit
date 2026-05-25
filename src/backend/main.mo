// main.mo — Kisan Seva — Composition root ONLY
// Zero business logic. All logic lives in lib/ and mixins/.
// Every domain module is injected here via `include`.

import Map "mo:core/Map";
import Common "types/Common";
import FarmTypes "types/Farm";
import FieldTypes "types/Field";
import CropTypes "types/Crop";
import FarmMixin "mixins/farm-api";
import ClassificationMixin "mixins/classification-api";
import FieldMixin "mixins/field-api";
import CropMixin "mixins/crop-api";
import NotificationMixin "mixins/notification-api";

import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Principal "mo:core/Principal";


actor {

  // ─── Farm state ───────────────────────────────────────────────────────────

  let farms              = Map.empty<Nat, FarmTypes.Farm>();
  let farmCounter        = { var v : Nat = 0 };
  let profiles           = Map.empty<Principal, FarmTypes.FarmerProfile>();
  let members            = Map.empty<Nat, FarmTypes.FarmMember>();
  let memberCounter      = { var v : Nat = 0 };
  let invites            = Map.empty<Nat, FarmTypes.InviteToken>();
  let inviteCounter      = { var v : Nat = 0 };
  let hmacSecret         = { var blob : Blob = "" };
  // ─── Authorization (Caffeine platform requirement) ─────────────────────────

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);


  // ─── Field state ───────────────────────────────────────────────────────────

  let fields             = Map.empty<Nat, FieldTypes.Field>();
  let fieldCounter       = { var v : Nat = 0 };
  let landRecords        = Map.empty<Nat, FieldTypes.LandRecord>();
  let landRecordCounter  = { var v : Nat = 0 };

  // ─── Crop state ────────────────────────────────────────────────────────────

  let cropSeasons        = Map.empty<Nat, CropTypes.CropSeason>();
  let cropSeasonCounter  = { var v : Nat = 0 };
  let cropHarvests       = Map.empty<Nat, CropTypes.CropHarvest>();
  let cropHarvestCounter = { var v : Nat = 0 };
  let mspRates           = Map.empty<Nat, CropTypes.CropMSP>();
  let mspCounter         = { var v : Nat = 0 };

  // ─── Notification & audit state ──────────────────────────────────────────

  let notifications      = Map.empty<Nat, Common.NotificationEntity>();
  let notifCounter       = { var v : Nat = 0 };
  let auditLogs          = Map.empty<Nat, Common.AuditLog>();
  let auditCounter       = { var v : Nat = 0 };

  // ─── Demo farm and MSP seed (runs once on fresh install via let-binding) ───
  // Enhanced orthogonal persistence: let bindings execute once on fresh canister
  // install and their values persist across upgrades — no system func init needed.

  let _seedDemoFarm = do {
    farmCounter.v += 1;
    let demoId = farmCounter.v;
    let demoFarm : FarmTypes.Farm = {
      id = demoId;
      ksId = "KS-AP-2026-DEMO01";
      name = "Develvyn Farm";
      ownerPrincipal = Principal.fromText("2vxsx-fae"); // anonymous principal
      state = "Andhra Pradesh";
      district = "Kadapa";
      mandal = "Galiveedu Mandal";
      village = "Galiveedu";
      surveyNumber = null;
      totalAreaSqm = 6070; // 1.5 acres
      ownershipType = "Own";
      purposes = ["Crops", "Horticulture"];
      createdAt = 0;
      isDemo = true;
    };
    farms.add(demoId, demoFarm);
  };

  let _seedMspRates = do {
    let mspSeeds : [(Text, Text, Nat)] = [
      // (cropName, season, mspPerQuintalPaise)
      // Kharif 2025 — Paise = Rs × 100
      ("Paddy (Common)",     "Kharif", 230000),
      ("Paddy (Grade A)",    "Kharif", 232000),
      ("Maize",              "Kharif", 209000),
      ("Jowar (Hybrid)",     "Kharif", 337100),
      ("Bajra",              "Kharif", 250000),
      ("Groundnut",          "Kharif", 678300),
      ("Sunflower",          "Kharif", 728000),
      ("Soybean",            "Kharif", 489200),
      ("Cotton (Medium)",    "Kharif", 662000),
      ("Cotton (Long)",      "Kharif", 702000),
      ("Sugarcane",          "Kharif", 31500),
      ("Turmeric",           "Kharif", 700000),
      ("Red Chilli",         "Kharif", 540000),
      // Rabi 2025
      ("Wheat",              "Rabi",   227500),
    ];
    for ((cropName, season, mspPaise) in mspSeeds.vals()) {
      mspCounter.v += 1;
      let msp : CropTypes.CropMSP = {
        id = mspCounter.v;
        cropName;
        season;
        financialYear = "2025-26";
        mspPerQuintal = mspPaise;
        lastUpdated = 0;
      };
      mspRates.add(mspCounter.v, msp);
    };
  };

  // ─── Mixin includes (all public API surfaces) ───────────────────────────────

  // Farm management, farmer profile, members, invites, demo farm
  include FarmMixin(
    farms,
    farmCounter,
    profiles,
    members,
    memberCounter,
    invites,
    inviteCounter,
    hmacSecret,
  );

  // Income classification engine
  include ClassificationMixin();

  // Field management and land records
  include FieldMixin(
    farms,
    fields,
    fieldCounter,
    landRecords,
    landRecordCounter,
    members,
    notifications,
    notifCounter,
  );

  // Crop season planning, harvest logging, MSP rates
  include CropMixin(
    farms,
    members,
    cropSeasons,
    cropSeasonCounter,
    cropHarvests,
    cropHarvestCounter,
    mspRates,
    mspCounter,
  );

  // Notifications and audit log
  include NotificationMixin(
    farms,
    members,
    notifications,
    notifCounter,
    auditLogs,
    auditCounter,
  );

};

