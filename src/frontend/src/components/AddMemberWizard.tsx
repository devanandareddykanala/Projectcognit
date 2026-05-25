import { MemberRole } from "@/backend";
import type { ModuleToggles } from "@/backend.d.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFarm } from "@/context/FarmContext";
import { useActor } from "@/hooks/useActor";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Shield,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { InviteShareCard } from "./InviteShareCard";

const RELATIONS = [
  { emoji: "👨\u200d🌾", label: "Husband / Mali", value: "husband" },
  { emoji: "👩\u200d🌾", label: "Wife / Patni", value: "wife" },
  { emoji: "👦", label: "Son / Beta", value: "son" },
  { emoji: "👧", label: "Daughter / Beti", value: "daughter" },
  { emoji: "👴", label: "Father / Pita", value: "father" },
  { emoji: "👵", label: "Mother / Mata", value: "mother" },
  { emoji: "🤝", label: "Partner", value: "partner" },
  { emoji: "👨\u200d💼", label: "Manager", value: "manager" },
  { emoji: "📊", label: "CA / Accountant", value: "ca" },
  { emoji: "🌾", label: "Farm Hand", value: "farmhand" },
  { emoji: "👤", label: "Other", value: "other" },
];

const AVATAR_EMOJIS = [
  "👨\u200d🌾",
  "👩\u200d🌾",
  "👴",
  "👵",
  "👨\u200d💼",
  "👩\u200d💼",
  "🧑",
  "👦",
  "👧",
  "🤝",
  "🌾",
  "🧑\u200d🌾",
  "👨",
  "👩",
  "🧔",
  "👱",
  "👲",
  "🧕",
  "🧑\u200d💻",
  "📊",
];

const MODULES: { key: keyof ModuleToggles; labelHi: string; icon: string }[] = [
  { key: "crops", labelHi: "Fasal", icon: "🌾" },
  { key: "dairy", labelHi: "Dairy", icon: "🐄" },
  { key: "horticulture", labelHi: "Bagwani", icon: "🌳" },
  { key: "greenhouse", labelHi: "Polyhouse", icon: "🏡" },
  { key: "fisheries", labelHi: "Machli", icon: "🐟" },
  { key: "poultry", labelHi: "Murgi", icon: "🐔" },
  { key: "solar", labelHi: "Solar", icon: "☀️" },
  { key: "finance", labelHi: "Vittiya", icon: "📈" },
  { key: "machinery", labelHi: "Machine", icon: "🚜" },
  { key: "labour", labelHi: "Mazdoor", icon: "👷" },
];

const DEFAULT_TOGGLES: ModuleToggles = {
  crops: true,
  dairy: true,
  horticulture: true,
  greenhouse: true,
  fisheries: true,
  poultry: true,
  solar: true,
  finance: true,
  machinery: true,
  labour: true,
};

function getAutoAvatar(relation: string): string {
  const femaleRelations = ["wife", "daughter", "mother"];
  if (!relation) return "👨\u200d🌾";
  return femaleRelations.includes(relation) ? "👩\u200d🌾" : "👨\u200d🌾";
}

interface AddMemberWizardProps {
  onClose: () => void;
}

export function AddMemberWizard({ onClose }: AddMemberWizardProps) {
  const { actor } = useActor();
  const { farm } = useFarm();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("👨\u200d🌾");
  const [role, setRole] = useState<MemberRole>(MemberRole.Member);
  const [toggles, setToggles] = useState<ModuleToggles>({ ...DEFAULT_TOGGLES });
  const [inviteToken, setInviteToken] = useState<{
    code: string;
    token: string;
  } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [generating, setGenerating] = useState(false);

  // Auto-suggest avatar when relation changes
  useEffect(() => {
    if (relation) setAvatar(getAutoAvatar(relation));
  }, [relation]);

  // When ViewOnly role selected, lock all toggles ON
  useEffect(() => {
    if (role === MemberRole.ViewOnly) {
      setToggles({ ...DEFAULT_TOGGLES });
    }
  }, [role]);

  // Step 5: auto-generate invite on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only when step changes to 5; other deps are guards
  useEffect(() => {
    if (step !== 5 || !actor || !farm || inviteToken || generating) return;
    const effectiveToggles =
      role === MemberRole.ViewOnly ? DEFAULT_TOGGLES : toggles;
    setGenerating(true);
    setInviteError("");
    actor
      .generateInvite(farm.id, role, effectiveToggles)
      .then((res) => {
        if (res.__kind__ === "ok") {
          setInviteToken({ code: res.ok.code, token: res.ok.token });
        } else {
          setInviteError(res.err);
        }
      })
      .catch(() => setInviteError("Network error. Dobara try karein."))
      .finally(() => setGenerating(false));
  }, [step]);

  const inviteLink = inviteToken
    ? `${window.location.origin}/join/${inviteToken.code}`
    : "";

  const canGoNext = () => {
    if (step === 1) return name.trim().length >= 2 && relation !== "";
    return true;
  };

  const STEP_LABELS = ["Jaankari", "Avatar", "Role", "Modules", "Invite"];

  return (
    <div
      data-ocid="add_member.dialog"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/30 backdrop-blur-sm"
      role="presentation"
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
          <h2 className="font-display text-xl text-foreground">
            Sadasya Jodein
          </h2>
          <Button
            data-ocid="add_member.close_button"
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
            aria-label="Band karein"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  i + 1 < step
                    ? "bg-primary text-primary-foreground"
                    : i + 1 === step
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`h-0.5 w-4 rounded ${i + 1 < step ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {STEP_LABELS[step - 1]}
          </span>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {step === 1 && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="member-name" className="text-sm font-medium">
                  Naam *
                </Label>
                <Input
                  data-ocid="add_member.name_input"
                  id="member-name"
                  placeholder="Naam likhein"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Rishta *</Label>
                <Select value={relation} onValueChange={setRelation}>
                  <SelectTrigger
                    data-ocid="add_member.relation_select"
                    className="w-full"
                  >
                    <SelectValue placeholder="Rishta chunein" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <span className="mr-2">{r.emoji}</span>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-phone" className="text-sm font-medium">
                  Phone{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  data-ocid="add_member.phone_input"
                  id="member-phone"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  inputMode="tel"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                Avatar chunein (ya khud rakha rahega)
              </p>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    data-ocid="add_member.avatar_option"
                    onClick={() => setAvatar(emoji)}
                    className={`aspect-square text-2xl flex items-center justify-center rounded-xl border-2 transition-all ${
                      avatar === emoji
                        ? "border-primary bg-primary/10 scale-110"
                        : "border-border bg-muted/30 hover:border-primary/40"
                    }`}
                    aria-label={`Avatar ${emoji} chunein`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="text-center py-2">
                <span className="text-5xl">{avatar}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Chunaa hua avatar
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground mb-1">
                Is sadasya ko kya access milega?
              </p>
              {[
                {
                  role: MemberRole.Admin,
                  icon: <Shield className="w-6 h-6 text-primary" />,
                  hindi: "Malik",
                  english: "Admin",
                  desc: "Full access: padh, likho, parivaar manage karo",
                },
                {
                  role: MemberRole.Member,
                  icon: <Pencil className="w-6 h-6 text-blue-600" />,
                  hindi: "Sadasya",
                  english: "Member",
                  desc: "Padh aur likho: fasal, kharcha jodo",
                },
                {
                  role: MemberRole.ViewOnly,
                  icon: <Eye className="w-6 h-6 text-muted-foreground" />,
                  hindi: "Dekhne Wala",
                  english: "View Only",
                  desc: "Sirf padho: reports aur data dekho",
                },
              ].map((card) => (
                <button
                  key={card.role}
                  type="button"
                  data-ocid={`add_member.role_card.${card.english.toLowerCase().replace(" ", "_")}`}
                  onClick={() => setRole(card.role)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    role === card.role
                      ? "border-primary bg-primary/8"
                      : "border-border bg-muted/20 hover:border-primary/30"
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{card.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {card.hindi}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({card.english})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {card.desc}
                    </p>
                  </div>
                  {role === card.role && (
                    <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="py-2 space-y-3">
              <p className="text-sm font-medium text-foreground">
                Kaunse modules dekhein?
              </p>
              {role === MemberRole.ViewOnly && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  Dekhne Wala ko sab modules dikhenge — badal nahi sakte.
                </p>
              )}
              <div className="space-y-2">
                {MODULES.map((mod) => (
                  <div
                    key={mod.key}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{mod.icon}</span>
                      <span className="text-sm text-foreground">
                        {mod.labelHi}
                      </span>
                    </div>
                    <Switch
                      data-ocid={`add_member.module_toggle.${mod.key}`}
                      checked={
                        role === MemberRole.ViewOnly ? true : toggles[mod.key]
                      }
                      disabled={role === MemberRole.ViewOnly}
                      onCheckedChange={(checked) =>
                        setToggles((prev) => ({ ...prev, [mod.key]: checked }))
                      }
                      aria-label={`${mod.labelHi} module toggle`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="py-4 space-y-4">
              {generating && (
                <div
                  data-ocid="add_member.loading_state"
                  className="flex flex-col items-center gap-3 py-6"
                >
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Invite Generate Ho Rahi Hai...
                  </p>
                </div>
              )}
              {!generating && inviteError && (
                <div
                  data-ocid="add_member.error_state"
                  className="text-center space-y-3 py-4"
                >
                  <p className="text-sm text-destructive">{inviteError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInviteToken(null);
                      setInviteError("");
                      setGenerating(false);
                    }}
                  >
                    Dobara Try Karein
                  </Button>
                </div>
              )}
              {!generating && inviteToken && (
                <div data-ocid="add_member.success_state" className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Check className="w-5 h-5" />
                    <p className="text-sm font-medium">Invite Bhej Di Gayi ✓</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg px-3 py-2 text-sm">
                    <p>
                      <span className="text-xl mr-2">{avatar}</span>
                      <span className="font-medium">{name}</span> ko{" "}
                      <span className="text-muted-foreground">
                        {RELATIONS.find((r) => r.value === relation)?.emoji}{" "}
                        {relation}
                      </span>{" "}
                      ke roop mein invite kiya gaya
                    </p>
                  </div>
                  <InviteShareCard
                    code={inviteToken.code}
                    link={inviteLink}
                    memberName={name}
                    farmName={farm?.name ?? "Aapka Farm"}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-shrink-0">
          <Button
            data-ocid="add_member.prev_button"
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => (step === 1 ? onClose() : setStep((s) => s - 1))}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />{" "}
            {step === 1 ? "Cancel" : "Peeche"}
          </Button>
          {step < 5 ? (
            <Button
              data-ocid="add_member.next_button"
              type="button"
              size="sm"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="gap-1"
            >
              Aage <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              data-ocid="add_member.done_button"
              type="button"
              size="sm"
              onClick={onClose}
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
