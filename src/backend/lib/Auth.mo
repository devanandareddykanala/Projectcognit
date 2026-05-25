// lib/Auth.mo — Authentication helpers and permission validation
import Common "../types/Common";
import FarmTypes "../types/Farm";

module {

  // Check if caller is the farm owner
  public func isFarmOwner(
    caller : Principal,
    farm : FarmTypes.Farm,
  ) : Bool {
    caller == farm.ownerPrincipal
  };

  // Check if caller has at least the required role on the farm
  // Returns #ok(member) if found with sufficient role, #err(msg) otherwise
  public func requireRole(
    caller : Principal,
    members : [FarmTypes.FarmMember],
    minimumRole : Common.MemberRole,
  ) : Common.Result<FarmTypes.FarmMember, Text> {
    let roleRank = func(r : Common.MemberRole) : Nat {
      switch r {
        case (#Admin) 3;
        case (#Member) 2;
        case (#ViewOnly) 1;
      }
    };
    let minRank = roleRank(minimumRole);
    var found : ?FarmTypes.FarmMember = null;
    for (m in members.vals()) {
      switch (m.principal) {
        case (?p) {
          if (p == caller and roleRank(m.role) >= minRank) {
            found := ?m;
          };
        };
        case null {};
      };
    };
    switch found {
      case (?m) #ok(m);
      case null #err("Access denied: insufficient role");
    }
  };

  // Check if caller can perform a named action on a farm
  // Actions: "read" | "write" | "admin" | "invite" | "remove_member"
  public func hasPermission(
    caller : Principal,
    members : [FarmTypes.FarmMember],
    action : Text,
  ) : Bool {
    let minRole : Common.MemberRole = switch action {
      case "admin" #Admin;
      case "invite" #Admin;
      case "remove_member" #Admin;
      case "write" #Member;
      case "read" #ViewOnly;
      case _ #ViewOnly;
    };
    switch (requireRole(caller, members, minRole)) {
      case (#ok _) true;
      case (#err _) false;
    }
  };

  // Validate that removing memberId will not leave the farm without an admin
  public func canRemoveMember(
    targetMemberId : Nat,
    members : [FarmTypes.FarmMember],
  ) : Bool {
    // Find the target member's role
    var targetRole : ?Common.MemberRole = null;
    for (m in members.vals()) {
      if (m.id == targetMemberId) {
        targetRole := ?m.role;
      };
    };
    switch targetRole {
      case null false; // member not found
      case (?role) {
        switch role {
          case (#Admin) {
            // Cannot remove sole admin
            countAdmins(members) > 1
          };
          case _ true;
        }
      };
    }
  };

  // Count active admin members on a farm
  public func countAdmins(members : [FarmTypes.FarmMember]) : Nat {
    var count : Nat = 0;
    for (m in members.vals()) {
      switch (m.role) {
        case (#Admin) count += 1;
        case _ {};
      };
    };
    count
  };

  // Validate text field length (max 500 chars)
  public func validateTextLength(field : Text, fieldName : Text) : Common.Result<(), Text> {
    if (field.size() > 500) {
      #err(fieldName # " must be 500 characters or fewer")
    } else {
      #ok(())
    }
  };

  // Validate geoPoints count (max 100 items)
  public func validateGeoPoints(points : [(Float, Float)]) : Common.Result<(), Text> {
    if (points.size() > 100) {
      #err("Field boundary may have at most 100 GPS points")
    } else {
      #ok(())
    }
  };

};
