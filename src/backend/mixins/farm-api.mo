// mixins/farm-api.mo — Public Farm, FarmerProfile, Member, Invite, and Demo API
import Common "../types/Common";
import FarmTypes "../types/Farm";
import FarmLib "../lib/Farm";
import AuthLib "../lib/Auth";
import InviteLib "../lib/Invite";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Random "mo:core/Random";

mixin (
  farms : Map.Map<Nat, FarmTypes.Farm>,
  farmCounter : { var v : Nat },
  profiles : Map.Map<Principal, FarmTypes.FarmerProfile>,
  members : Map.Map<Nat, FarmTypes.FarmMember>,
  memberCounter : { var v : Nat },
  invites : Map.Map<Nat, FarmTypes.InviteToken>,
  inviteCounter : { var v : Nat },
  hmacSecret : { var blob : Blob },
) {

  // ─── Private helpers ──────────────────────────────────────────────────────

  // Collect all farm members for a given farmId
  private func farmMembersFor(farmId : Nat) : [FarmTypes.FarmMember] {
    var acc : [FarmTypes.FarmMember] = [];
    for ((_, m) in members.entries()) {
      if (m.farmId == farmId) {
        acc := acc.concat([m]);
      };
    };
    acc
  };

  // Collect all farms as an array
  private func allFarms() : [FarmTypes.Farm] {
    var acc : [FarmTypes.Farm] = [];
    for ((_, f) in farms.entries()) {
      acc := acc.concat([f]);
    };
    acc
  };

  // Collect all invites as an array
  private func allInvites() : [FarmTypes.InviteToken] {
    var acc : [FarmTypes.InviteToken] = [];
    for ((_, inv) in invites.entries()) {
      acc := acc.concat([inv]);
    };
    acc
  };

  // Verify caller is a member of a farm (owner counts)
  private func verifyFarmMember(caller : Principal, farmId : Nat) : Common.Result<(), Text> {
    switch (farms.get(farmId)) {
      case null { return #err("Farm not found") };
      case (?farm) {
        if (farm.ownerPrincipal == caller) return #ok(());
        let farmMembers = farmMembersFor(farmId);
        switch (AuthLib.requireRole(caller, farmMembers, #ViewOnly)) {
          case (#ok _) #ok(());
          case (#err e) #err(e);
        }
      };
    }
  };

  // Verify caller has Admin role on the farm (owner always qualifies)
  private func verifyAdmin(caller : Principal, farmId : Nat) : Common.Result<(), Text> {
    switch (farms.get(farmId)) {
      case null { return #err("Farm not found") };
      case (?farm) {
        if (farm.ownerPrincipal == caller) return #ok(());
        let farmMembers = farmMembersFor(farmId);
        switch (AuthLib.requireRole(caller, farmMembers, #Admin)) {
          case (#ok _) #ok(());
          case (#err e) #err(e);
        }
      };
    }
  };

  // ─── Farm management ──────────────────────────────────────────────────────

  public shared ({ caller }) func createFarm(
    name : Text,
    state : Text,
    district : Text,
    mandal : Text,
    village : Text,
    surveyNumber : ?Text,
    totalAreaSqm : Nat,
    unit : Text,
    ownershipType : Text,
    purposes : [Text],
  ) : async Common.Result<FarmTypes.Farm, Text> {
    let input : FarmTypes.CreateFarmInput = {
      name; state; district; mandal; village;
      surveyNumber; totalAreaSqm; unit; ownershipType; purposes;
    };
    switch (FarmLib.validateCreate(input)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    if (FarmLib.isDuplicateFarm(name, state, mandal, village, allFarms())) {
      return #err("A farm with this name already exists in " # mandal # ", " # village);
    };
    let now = Time.now();
    let year = "2026";
    let sc = FarmLib.stateCode(state);
    farmCounter.v += 1;
    let id = farmCounter.v;
    // Generate KS Farm ID with collision check — retry up to 5 times
    var ksId = "";
    var attempts = 0;
    label idLoop while (attempts < 5) {
      let entropyBlob = await Random.blob();
      let candidate = FarmLib.generateKsId(sc, year, entropyBlob);
      var collision = false;
      for ((_, f) in farms.entries()) {
        if (f.ksId == candidate) collision := true;
      };
      if (not collision) {
        ksId := candidate;
        break idLoop;
      };
      attempts += 1;
    };
    if (ksId == "") {
      return #err("Failed to generate a unique KS Farm ID. Please try again.");
    };
    let farm = FarmLib.buildFarm(id, ksId, caller, input, now);
    farms.add(id, farm);
    // Add owner as Admin member
    memberCounter.v += 1;
    let mem : FarmTypes.FarmMember = {
      id = memberCounter.v;
      farmId = id;
      principal = ?caller;
      name = "Owner";
      relation = "Self";
      emoji = "👨‍🌾";
      phone = null;
      role = #Admin;
      moduleToggles = {
        crops = true; dairy = true; horticulture = true;
        greenhouse = true; fisheries = true; poultry = true;
        solar = true; finance = true; labour = true; machinery = true;
      };
      joinedAt = now;
      lastActiveAt = ?now;
      addedBy = caller;
    };
    members.add(memberCounter.v, mem);
    #ok(farm)
  };

  public query ({ caller }) func getFarm(farmId : Nat) : async Common.Result<FarmTypes.Farm, Text> {
    switch (farms.get(farmId)) {
      case null { #err("Farm not found") };
      case (?farm) {
        if (farm.isDemo) return #ok(farm);
        switch (verifyFarmMember(caller, farmId)) {
          case (#err e) { #err(e) };
          case (#ok _) { #ok(farm) };
        }
      };
    }
  };

  public query ({ caller }) func getUserFarms() : async [FarmTypes.Farm] {
    var acc : [FarmTypes.Farm] = [];
    for ((_, farm) in farms.entries()) {
      if (farm.isDemo) {
        // Skip demo farm in user list
      } else if (farm.ownerPrincipal == caller) {
        acc := acc.concat([farm]);
      } else {
        // Check if caller is a member
        let farmMembers = farmMembersFor(farm.id);
        var isMember = false;
        for (m in farmMembers.vals()) {
          switch (m.principal) {
            case (?p) { if (p == caller) isMember := true };
            case null {};
          };
        };
        if (isMember) {
          acc := acc.concat([farm]);
        };
      };
    };
    acc
  };

  public shared ({ caller }) func updateFarm(
    farmId : Nat,
    updates : FarmTypes.UpdateFarmInput,
  ) : async Common.Result<FarmTypes.Farm, Text> {
    switch (verifyAdmin(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    switch (farms.get(farmId)) {
      case null { #err("Farm not found") };
      case (?farm) {
        let updated = FarmLib.applyUpdate(farm, updates);
        farms.add(farmId, updated);
        #ok(updated)
      };
    }
  };

  // ─── Farmer profile ───────────────────────────────────────────────────────

  public shared ({ caller }) func saveFarmerProfile(
    profile : FarmTypes.FarmerProfile,
  ) : async Common.Result<FarmTypes.FarmerProfile, Text> {
    switch (FarmLib.validateProfile(profile)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    // Force principal to be the caller
    let p : FarmTypes.FarmerProfile = { profile with principal = caller };
    profiles.add(caller, p);
    #ok(p)
  };

  public query ({ caller }) func getFarmerProfile() : async Common.Result<FarmTypes.FarmerProfile, Text> {
    switch (profiles.get(caller)) {
      case null { #err("Profile not found") };
      case (?p) { #ok(p) };
    }
  };

  // ─── Members ──────────────────────────────────────────────────────────────

  public query ({ caller }) func getFarmMembers(
    farmId : Nat,
  ) : async Common.Result<[FarmTypes.FarmMember], Text> {
    switch (verifyFarmMember(caller, farmId)) {
      case (#err e) { #err(e) };
      case (#ok _) { #ok(farmMembersFor(farmId)) };
    }
  };

  public shared ({ caller }) func addFarmMember(
    farmId : Nat,
    name : Text,
    relation : Text,
    emoji : Text,
    phone : ?Text,
    role : Common.MemberRole,
    moduleToggles : Common.ModuleToggles,
  ) : async Common.Result<FarmTypes.FarmMember, Text> {
    switch (verifyAdmin(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    let now = Time.now();
    memberCounter.v += 1;
    let mem : FarmTypes.FarmMember = {
      id = memberCounter.v;
      farmId;
      principal = null;
      name;
      relation;
      emoji;
      phone;
      role;
      moduleToggles;
      joinedAt = now;
      lastActiveAt = null;
      addedBy = caller;
    };
    members.add(memberCounter.v, mem);
    #ok(mem)
  };

  public shared ({ caller }) func updateMemberRole(
    farmId : Nat,
    memberId : Nat,
    newRole : Common.MemberRole,
  ) : async Common.Result<FarmTypes.FarmMember, Text> {
    switch (verifyAdmin(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    switch (members.get(memberId)) {
      case null { #err("Member not found") };
      case (?mem) {
        if (mem.farmId != farmId) return #err("Member does not belong to this farm");
        // Prevent downgrading the sole admin
        if (mem.role == #Admin) {
          let farmMembers = farmMembersFor(farmId);
          if (AuthLib.countAdmins(farmMembers) <= 1 and newRole != #Admin) {
            return #err("Cannot remove the sole admin from a farm");
          };
        };
        let updated = { mem with role = newRole };
        members.add(memberId, updated);
        #ok(updated)
      };
    }
  };

  public shared ({ caller }) func removeFarmMember(
    farmId : Nat,
    memberId : Nat,
  ) : async Common.Result<Bool, Text> {
    switch (verifyAdmin(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    let farmMembers = farmMembersFor(farmId);
    if (not AuthLib.canRemoveMember(memberId, farmMembers)) {
      return #err("Cannot remove the sole admin from a farm");
    };
    switch (members.get(memberId)) {
      case null { #err("Member not found") };
      case (?mem) {
        if (mem.farmId != farmId) return #err("Member does not belong to this farm");
        members.remove(memberId);
        #ok(true)
      };
    }
  };

  // ─── Invites ──────────────────────────────────────────────────────────────

  public shared ({ caller }) func generateInvite(
    farmId : Nat,
    role : Common.MemberRole,
    moduleToggles : Common.ModuleToggles,
  ) : async Common.Result<FarmTypes.InviteToken, Text> {
    switch (verifyAdmin(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    let now = Time.now();
    let activeCount = InviteLib.countActive(allInvites(), now);
    if (activeCount >= InviteLib.MAX_ACTIVE_INVITES) {
      return #err("Maximum 10 active invites allowed per farm. Revoke an existing invite first.");
    };
    // Use entropy for code, token, hmac
    let entropyBlob = await Random.blob();
    let entropyBlob2 = await Random.blob();
    let code = InviteLib.generateCode(entropyBlob);
    let token = InviteLib.generateToken(entropyBlob2);
    let expiresAt = now + InviteLib.LINK_EXPIRY_NS;
    let hmac = InviteLib.computeHmac(farmId, code, expiresAt, hmacSecret.blob);
    inviteCounter.v += 1;
    let invite : FarmTypes.InviteToken = {
      id = inviteCounter.v;
      farmId;
      code;
      token;
      hmac;
      role;
      moduleToggles;
      expiresAt;
      createdBy = caller;
      acceptedBy = null;
      revokedAt = null;
    };
    invites.add(inviteCounter.v, invite);
    #ok(invite)
  };

  public shared ({ caller }) func acceptInvite(
    code : Text,
  ) : async Common.Result<FarmTypes.Farm, Text> {
    let now = Time.now();
    let inviteArr = allInvites();
    switch (InviteLib.findByCode(code, inviteArr)) {
      case null { return #err("Invite code not found or expired") };
      case (?invite) {
        if (not InviteLib.isValid(invite, now)) {
          return #err("Invite code is expired, revoked, or already used");
        };
        if (not InviteLib.verifyHmac(invite, hmacSecret.blob)) {
          return #err("Invite code is invalid");
        };
        // Mark invite as accepted
        let accepted = { invite with acceptedBy = ?caller };
        invites.add(invite.id, accepted);
        // Create a farm member record for the caller
        memberCounter.v += 1;
        let mem : FarmTypes.FarmMember = {
          id = memberCounter.v;
          farmId = invite.farmId;
          principal = ?caller;
          name = "";
          relation = "";
          emoji = "👤";
          phone = null;
          role = invite.role;
          moduleToggles = invite.moduleToggles;
          joinedAt = now;
          lastActiveAt = ?now;
          addedBy = invite.createdBy;
        };
        members.add(memberCounter.v, mem);
        switch (farms.get(invite.farmId)) {
          case null { #err("Farm not found") };
          case (?farm) { #ok(farm) };
        }
      };
    }
  };

  public query ({ caller }) func getActiveInvites(
    farmId : Nat,
  ) : async Common.Result<[FarmTypes.InviteToken], Text> {
    switch (verifyAdmin(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    let now = Time.now();
    var acc : [FarmTypes.InviteToken] = [];
    for ((_, inv) in invites.entries()) {
      if (inv.farmId == farmId and InviteLib.isValid(inv, now)) {
        acc := acc.concat([inv]);
      };
    };
    #ok(acc)
  };

  public shared ({ caller }) func revokeInvite(
    farmId : Nat,
    inviteId : Nat,
  ) : async Common.Result<Bool, Text> {
    switch (verifyAdmin(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    switch (invites.get(inviteId)) {
      case null { #err("Invite not found") };
      case (?invite) {
        if (invite.farmId != farmId) return #err("Invite does not belong to this farm");
        let now = Time.now();
        let revoked = { invite with revokedAt = ?now };
        invites.add(inviteId, revoked);
        #ok(true)
      };
    }
  };

  // ─── Demo farm ────────────────────────────────────────────────────────────

  public query func getDemoFarm() : async Common.Result<FarmTypes.Farm, Text> {
    var found : ?FarmTypes.Farm = null;
    for ((_, f) in farms.entries()) {
      if (f.isDemo) found := ?f;
    };
    switch found {
      case null { #err("Demo farm not available") };
      case (?f) { #ok(f) };
    }
  };

};
