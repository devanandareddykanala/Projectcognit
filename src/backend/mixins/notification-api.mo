// mixins/notification-api.mo — Public Notification and AuditLog API
import Common "../types/Common";
import FarmTypes "../types/Farm";
import NotifLib "../lib/Notifications";
import AuthLib "../lib/Auth";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";

mixin (
  farms : Map.Map<Nat, FarmTypes.Farm>,
  farmMembers : Map.Map<Nat, FarmTypes.FarmMember>,
  notifications : Map.Map<Nat, Common.NotificationEntity>,
  notifCounter : { var v : Nat },
  auditLogs : Map.Map<Nat, Common.AuditLog>,
  auditCounter : { var v : Nat },
) {

  // ─── Private helpers ──────────────────────────────────────────────────────

  private func getFarmMembersForN(farmId : Nat) : [FarmTypes.FarmMember] {
    var acc : [FarmTypes.FarmMember] = [];
    for ((_, m) in farmMembers.entries()) {
      if (m.farmId == farmId) acc := acc.concat([m]);
    };
    acc
  };

  private func verifyAdminN(caller : Principal, farmId : Nat) : Common.Result<(), Text> {
    switch (farms.get(farmId)) {
      case null { return #err("Farm not found") };
      case (?farm) {
        if (farm.ownerPrincipal == caller) return #ok(());
        let mems = getFarmMembersForN(farmId);
        switch (AuthLib.requireRole(caller, mems, #Admin)) {
          case (#ok _) #ok(());
          case (#err e) #err(e);
        }
      };
    }
  };

  // ─── Notification methods ─────────────────────────────────────────────────

  public query ({ caller }) func getNotifications(
    farmId : Nat,
  ) : async Common.Result<[Common.NotificationEntity], Text> {
    let now = Time.now();
    var acc : [Common.NotificationEntity] = [];
    for ((_, n) in notifications.entries()) {
      if (n.farmId == farmId and n.recipientPrincipal == caller) {
        if (not n.isDismissed) {
          switch (n.snoozedUntil) {
            case (?until) { if (until <= now) acc := acc.concat([n]) };
            case null { acc := acc.concat([n]) };
          };
        };
      };
    };
    #ok(acc)
  };

  public shared ({ caller }) func markNotificationRead(
    notifId : Nat,
  ) : async Common.Result<Bool, Text> {
    switch (notifications.get(notifId)) {
      case null { #err("Notification not found") };
      case (?n) {
        if (n.recipientPrincipal != caller) return #err("Access denied");
        let updated = NotifLib.markRead(n);
        notifications.add(notifId, updated);
        #ok(true)
      };
    }
  };

  public shared ({ caller }) func snoozeNotification(
    notifId : Nat,
    until : Common.Timestamp,
  ) : async Common.Result<Bool, Text> {
    switch (notifications.get(notifId)) {
      case null { #err("Notification not found") };
      case (?n) {
        if (n.recipientPrincipal != caller) return #err("Access denied");
        let updated = NotifLib.snooze(n, until);
        notifications.add(notifId, updated);
        #ok(true)
      };
    }
  };

  // ─── Audit log ────────────────────────────────────────────────────────────

  public query ({ caller }) func getAuditLog(
    farmId : Nat,
    limit : Nat,
  ) : async Common.Result<[Common.AuditLog], Text> {
    switch (verifyAdminN(caller, farmId)) {
      case (#err e) { return #err(e) };
      case (#ok _) {};
    };
    var acc : [Common.AuditLog] = [];
    for ((_, log) in auditLogs.entries()) {
      if (log.farmId == farmId) {
        acc := acc.concat([log]);
      };
    };
    // Return last N entries
    let total = acc.size();
    if (total <= limit) {
      #ok(acc)
    } else {
      let start = if (total > limit) { total - limit } else { 0 };
      #ok(acc.sliceToArray(start, total))
    }
  };

};
