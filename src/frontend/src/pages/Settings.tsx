import {
  Check,
  Copy,
  Globe,
  Loader2,
  LogOut,
  Save,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MemberRole } from "../backend";
import type { FarmMember } from "../backend.d.ts";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { useFarm } from "../context/FarmContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// helpers
function sqmToAcres(sqm: bigint): string {
  return (Number(sqm) / 4046.86).toFixed(2);
}

function roleBadge(role: MemberRole): string {
  switch (role) {
    case MemberRole.Admin:
      return "bg-green-100 text-green-800";
    case MemberRole.Member:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getRoleLabel(role: MemberRole): string {
  switch (role) {
    case MemberRole.Admin:
      return "Admin";
    case MemberRole.Member:
      return "Sadasya";
    case MemberRole.ViewOnly:
      return "Dekhne Wala";
    default:
      return "Unknown";
  }
}

const LANGUAGES = [
  {
    code: "hi",
    label: "\u0939\u093f\u0902\u0926\u0940",
    flag: "\uD83C\uDDEE\uD83C\uDDF3",
  },
  {
    code: "te",
    label: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41",
    flag: "\uD83C\uDDEE\uD83C\uDDF3",
  },
  { code: "en", label: "English", flag: "\uD83C\uDF10" },
];

function truncatePrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}...${p.slice(-8)}`;
}

// ─── Family Members Card ────────────────────────────────────────────────────
function FamilyMembersCard() {
  const { farmId } = useFarm();
  const { actor: backend } = useActor();
  const [members, setMembers] = useState<FarmMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!backend || !farmId) return;
    setLoading(true);
    backend
      .getFarmMembers(farmId)
      .then((result) => {
        if (result.__kind__ === "ok") setMembers(result.ok);
      })
      .catch((err) => console.error("getFarmMembers error:", err))
      .finally(() => setLoading(false));
  }, [backend, farmId]);

  return (
    <Card
      className="border-l-4 border-l-primary"
      data-ocid="settings.family.card"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-display">
              Parivar Sadasya
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            onClick={() => window.location.assign("/family")}
            data-ocid="settings.family.open_modal_button"
          >
            Sadasya Bulayein
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Invite karein aur access manage karein
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div
            className="py-6 text-center"
            data-ocid="settings.family.loading_state"
          >
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div
            className="py-6 text-center"
            data-ocid="settings.family.empty_state"
          >
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Koi sadasya nahi hai
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Parivar ke sadasya ko invite karein
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member, i) => (
              <div
                key={String(member.id)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 text-sm"
                data-ocid={`settings.family.item.${i + 1}`}
              >
                <span className="text-2xl flex-shrink-0">{member.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.relation}
                  </p>
                </div>
                <Badge
                  className={`text-xs flex-shrink-0 ${roleBadge(member.role)}`}
                >
                  {getRoleLabel(member.role)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Language Card ──────────────────────────────────────────────────────────
function LanguageCard() {
  const [selectedLang, setSelectedLang] = useState(() => {
    return sessionStorage.getItem("kisan-seva-lang") ?? "en";
  });

  const handleLangChange = (code: string) => {
    sessionStorage.setItem("kisan-seva-lang", code);
    setSelectedLang(code);
    toast.success("Language updated");
  };

  return (
    <Card
      className="border-l-4 border-l-primary"
      data-ocid="settings.language.card"
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <CardTitle className="text-base font-display">
            Bhasha / Language
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLangChange(lang.code)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                selectedLang === lang.code
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:bg-muted/50"
              }`}
              data-ocid={`settings.language.${lang.code}.toggle`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {selectedLang === lang.code && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Account Card ───────────────────────────────────────────────────────────
function AccountCard() {
  const { clear, identity } = useInternetIdentity();
  const [copied, setCopied] = useState(false);

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal ? truncatePrincipal(principal) : "—";

  const handleCopy = async () => {
    if (!principal) return;
    await navigator.clipboard.writeText(principal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Principal ID copied");
  };

  const handleLogout = async () => {
    await clear();
    toast.success("Logged out successfully");
  };

  return (
    <Card
      className="border-l-4 border-l-primary"
      data-ocid="settings.account.card"
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <CardTitle className="text-base font-display">Account</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Principal ID</Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted rounded px-3 py-2 font-mono truncate">
              {shortPrincipal}
            </code>
            {principal && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="flex-shrink-0"
                data-ocid="settings.account.copy_button"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Version</span>
          <Badge variant="outline" className="text-xs font-mono">
            Kisan Seva v1.0.0
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Build</span>
          <span className="text-xs text-muted-foreground">Pre-Phase + 1A</span>
        </div>

        <Separator />

        <Button
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          data-ocid="settings.account.logout_button"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ─────────────────────────────────────────────────────
export default function Settings() {
  const { farm, updateFarm, isDemo, clearDemoFarm } = useFarm();
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEditName = () => {
    setEditName(farm?.name ?? "");
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const ok = await updateFarm({ name: editName.trim() });
    setSaving(false);
    setEditingName(false);
    if (ok) toast.success("Farm name updated");
    else toast.error("Update failed. Please try again.");
  };

  const handleCopyKsId = async () => {
    if (!farm?.ksId) return;
    await navigator.clipboard.writeText(farm.ksId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("KS Farm ID copied");
  };

  return (
    <div className="p-4 md:p-6" data-ocid="settings.page">
      <h1 className="text-2xl font-semibold font-display text-foreground mb-1">
        Settings
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Aapki farm aur account settings
      </p>

      <div className="max-w-2xl space-y-4">
        {/* Section 1: Farm Profile */}
        <Card
          className="border-l-4 border-l-primary"
          data-ocid="settings.farm_profile.card"
        >
          <CardHeader>
            <CardTitle className="text-base font-display">
              Farm Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3 text-sm">
            {farm ? (
              <>
                {/* KS Farm ID */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">KS Farm ID</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded text-primary font-semibold">
                      {farm.ksId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyKsId}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-ocid="settings.farm_profile.copy_button"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Farm Name */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Farm Name</span>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm w-44"
                        data-ocid="settings.farm_name.input"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingName(false)}
                        data-ocid="settings.farm_name.cancel_button"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={saving || !editName.trim()}
                        onClick={handleSaveName}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        data-ocid="settings.farm_name.save_button"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{farm.name}</span>
                      <button
                        type="button"
                        onClick={handleEditName}
                        className="text-xs text-primary hover:underline"
                        data-ocid="settings.farm_name.edit_button"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {/* Location (read-only) */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State</span>
                  <span className="font-medium">{farm.state || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">District</span>
                  <span className="font-medium">{farm.district || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mandal</span>
                  <span className="font-medium">{farm.mandal || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Village</span>
                  <span className="font-medium">{farm.village || "—"}</span>
                </div>

                <Separator />

                {/* Area & Ownership */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Area</span>
                  <span className="font-medium">
                    {sqmToAcres(farm.totalAreaSqm)} acres
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ownership</span>
                  <span className="font-medium">
                    {farm.ownershipType || "—"}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground py-4 text-center">
                Koi farm nahi mili.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Family Members */}
        <FamilyMembersCard />

        {/* Section 3: Language */}
        <LanguageCard />

        {/* Section 4: Account */}
        <AccountCard />

        {/* Demo exit */}
        {isDemo && (
          <Card
            className="border-l-4 border-l-amber-500"
            data-ocid="settings.demo.card"
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Demo Mode Active
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Develvyn Farm ka demo chal raha hai
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDemoFarm}
                  className="border-amber-500 text-amber-700 hover:bg-amber-50"
                  data-ocid="settings.demo.exit_button"
                >
                  Exit Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
