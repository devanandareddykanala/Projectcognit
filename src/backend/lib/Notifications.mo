// lib/Notifications.mo — Notification entity domain logic
import Common "../types/Common";

module {

  // Build a new notification record
  public func buildNotification(
    id : Nat,
    farmId : Nat,
    recipient : Principal,
    notifType : Text,
    title : Text,
    body : Text,
    soundType : Text,
    createdAt : Common.Timestamp,
  ) : Common.NotificationEntity {
    {
      id;
      farmId;
      recipientPrincipal = recipient;
      notifType;
      title;
      body;
      soundType;
      isRead = false;
      snoozedUntil = null;
      isDismissed = false;
      createdAt;
    }
  };

  // Filter notifications for a recipient — unread only, not dismissed, not snoozed
  public func filterForRecipient(
    notifications : [Common.NotificationEntity],
    recipient : Principal,
    now : Common.Timestamp,
  ) : [Common.NotificationEntity] {
    notifications.filter(func(n : Common.NotificationEntity) : Bool {
      if (n.recipientPrincipal != recipient) return false;
      if (n.isDismissed) return false;
      switch (n.snoozedUntil) {
        case (?until) { if (until > now) return false };
        case null {};
      };
      true
    })
  };

  // Mark a single notification as read (returns updated record)
  public func markRead(notif : Common.NotificationEntity) : Common.NotificationEntity {
    { notif with isRead = true }
  };

  // Snooze a notification until a given timestamp
  public func snooze(
    notif : Common.NotificationEntity,
    until : Common.Timestamp,
  ) : Common.NotificationEntity {
    { notif with snoozedUntil = ?until }
  };

  // Check if an SHC is expiring within 90 days — returns true if reminder needed
  public func shcExpiryAlert(
    shcExpiry : ?Common.Timestamp,
    now : Common.Timestamp,
  ) : Bool {
    // 90 days in nanoseconds
    let ninetyDaysNs : Int = 7_776_000_000_000_000;
    switch shcExpiry {
      case null false;
      case (?expiry) {
        expiry > now and (expiry - now) <= ninetyDaysNs
      };
    }
  };

  // Validate notification sound type
  // Valid: "alert" | "info" | "success" | "warning" | "reminder"
  public func isValidSoundType(soundType : Text) : Bool {
    soundType == "alert" or
    soundType == "info" or
    soundType == "success" or
    soundType == "warning" or
    soundType == "reminder"
  };

};
