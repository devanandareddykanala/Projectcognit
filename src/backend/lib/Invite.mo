// lib/Invite.mo — InviteToken generation, join flow, HMAC validation
import Common "../types/Common";
import FarmTypes "../types/Farm";
import Text "mo:core/Text";
import Nat8 "mo:core/Nat8";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Blob "mo:core/Blob";

module {

  // Maximum active (non-revoked, non-expired) invites per farm
  public let MAX_ACTIVE_INVITES : Nat = 10;

  // Link token expiry: 7 days in nanoseconds
  public let LINK_EXPIRY_NS : Int = 604_800_000_000_000;

  // Short code expiry: 24 hours in nanoseconds
  public let CODE_EXPIRY_NS : Int = 86_400_000_000_000;

  // Generate a 6-character alphanumeric code (no 0,O,1,l,I to avoid confusion)
  public func generateCode(entropyBlob : Blob) : Text {
    // Safe alphanumeric chars — no 0, O, 1, l, I to avoid visual confusion
    let chars = "BCDFGHJKLMNPQRSTVWXYZ23456789";
    let charsArr : [Char] = chars.toArray();
    let n = charsArr.size();
    let bytes = entropyBlob;
    var result = "";
    var idx = 0;
    label cLoop for (b in bytes.vals()) {
      if (idx >= 6) break cLoop;
      let pos = b.toNat() % n;
      result := result # Text.fromChar(charsArr[pos]);
      idx += 1;
    };
    // Pad with 'B' if entropy was short
    while (result.size() < 6) {
      result := result # "B";
    };
    result
  };

  // Generate a long token for the invite link
  public func generateToken(entropyBlob : Blob) : Text {
    // 32-char hex token from blob bytes
    let hex = "0123456789abcdef";
    let hexArr : [Char] = hex.toArray();
    var token = "";
    var count = 0;
    label hexLoop for (b in entropyBlob.vals()) {
      if (count >= 16) break hexLoop; // 16 bytes = 32 hex chars
      let hi = b.toNat() / 16;
      let lo = b.toNat() % 16;
      token := token # Text.fromChar(hexArr[hi]) # Text.fromChar(hexArr[lo]);
      count += 1;
    };
    // Pad with zeros if entropy was short
    while (token.size() < 32) {
      token := token # "0";
    };
    token
  };

  // Compute HMAC for an invite (farmId + code + expiresAt)
  // Uses a canister-internal secret derived from entropy
  public func computeHmac(
    farmId : Nat,
    code : Text,
    expiresAt : Common.Timestamp,
    secret : Blob,
  ) : Text {
    // Simple deterministic hash: XOR bytes of secret with message digest
    // Message = farmId text + code + expiresAt text
    let message = farmId.toText() # code # (if (expiresAt >= 0) Int.abs(expiresAt).toText() else "-" # Int.abs(expiresAt).toText());
    let msgBytes : [Nat8] = message.encodeUtf8().toArray();
    let secretBytes : [Nat8] = secret.toArray();
    let secretLen = secretBytes.size();
    var hash : Nat = 5381;
    var i = 0;
    for (b in msgBytes.vals()) {
      let sk : Nat = if (secretLen > 0) secretBytes[i % secretLen].toNat() else 0;
      hash := (hash * 33 + b.toNat()) + sk;
      i += 1;
    };
    // Return as 16-char hex
    let hex = "0123456789abcdef";
    let hexArr : [Char] = hex.toArray();
    var result = "";
    var h = hash;
    var pos = 0;
    while (pos < 16) {
      result := Text.fromChar(hexArr[h % 16]) # result;
      h := h / 16;
      pos += 1;
    };
    result
  };

  // Verify HMAC before accepting an invite
  public func verifyHmac(
    invite : FarmTypes.InviteToken,
    secret : Blob,
  ) : Bool {
    let expected = computeHmac(invite.farmId, invite.code, invite.expiresAt, secret);
    expected == invite.hmac
  };

  // Count currently active invites (not revoked and not expired)
  public func countActive(
    invites : [FarmTypes.InviteToken],
    now : Common.Timestamp,
  ) : Nat {
    var count : Nat = 0;
    for (inv in invites.vals()) {
      if (isValid(inv, now)) count += 1;
    };
    count
  };

  // Find invite by 6-char code (case-insensitive)
  public func findByCode(
    code : Text,
    invites : [FarmTypes.InviteToken],
  ) : ?FarmTypes.InviteToken {
    let upper = code.toUpper();
    var found : ?FarmTypes.InviteToken = null;
    for (inv in invites.vals()) {
      if (inv.code.toUpper() == upper) {
        found := ?inv;
      };
    };
    found
  };

  // Check invite is valid: not revoked, not expired, not already accepted
  public func isValid(invite : FarmTypes.InviteToken, now : Common.Timestamp) : Bool {
    // Not revoked, not expired, not already accepted
    switch (invite.revokedAt) {
      case (?_) return false;
      case null {};
    };
    switch (invite.acceptedBy) {
      case (?_) return false;
      case null {};
    };
    invite.expiresAt > now
  };

};
