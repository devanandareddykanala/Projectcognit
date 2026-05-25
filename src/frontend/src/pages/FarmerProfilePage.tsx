import type { FarmerProfile } from "@/backend.d.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActor } from "@/hooks/useActor";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, HelpCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function ifscError(val: string): string | null {
  if (!val) return null;
  if (val.length !== 11) return "IFSC 11 characters ka hona chahiye";
  if (!IFSC_REGEX.test(val.toUpperCase()))
    return "IFSC format galat hai (e.g. SBIN0001234)";
  return null;
}

export default function FarmerProfilePage() {
  const { actor } = useActor();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["farmerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getFarmerProfile();
      return result.__kind__ === "ok" ? result.ok : null;
    },
    enabled: !!actor,
  });

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [fpoMember, setFpoMember] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [agristackId, setAgristackId] = useState("");
  const [showGstAlert, setShowGstAlert] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setMobile(profile.mobile ?? "");
    setBankBranch(profile.bankBranch ?? "");
    setBankIfsc(profile.bankIfsc ?? "");
    setFpoMember(profile.fpoMember ?? false);
    setGstNumber(profile.gstNumber ?? "");
    setFssaiNumber(profile.fssaiNumber ?? "");
    setAgristackId(profile.agristackId ?? "");
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const ifscErr = ifscError(bankIfsc);
      if (ifscErr) throw new Error(ifscErr);
      const payload: FarmerProfile = {
        principal: profile!.principal,
        name,
        mobile: mobile || undefined,
        aadhaarBankLinked: profile?.aadhaarBankLinked ?? false,
        bankBranch: bankBranch || undefined,
        bankIfsc: bankIfsc || undefined,
        bankLast4: profile?.bankLast4,
        fpoMember,
        gstNumber: gstNumber || undefined,
        fssaiNumber: fssaiNumber || undefined,
        agristackId: agristackId || undefined,
      };
      const result = await actor.saveFarmerProfile(payload);
      if (result.__kind__ !== "ok") throw new Error("Save failed");
      return result.ok;
    },
    onSuccess: () => {
      toast.success("Profile save ho gaya!");
      setDirty(false);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Save nahi ho saka");
    },
  });

  function markDirty() {
    setDirty(true);
  }

  const ifscErr = ifscError(bankIfsc);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" data-ocid="farmer_profile.loading_state">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background pb-28"
      data-ocid="farmer_profile.page"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 pt-4 pb-3 shadow-sm">
        <h1
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Mera Profile
        </h1>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
        {/* Personal Info Card */}
        <Card
          className="border-l-4 shadow-sm"
          style={{ borderLeftColor: "oklch(0.38 0.11 148)" }}
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              Vyaktigat Jaankari
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div>
              <Label
                htmlFor="farmer-name"
                className="text-xs text-muted-foreground"
              >
                Kisan ka Naam
              </Label>
              <Input
                id="farmer-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  markDirty();
                }}
                className="mt-1 border-input focus:border-primary"
                placeholder="Apna naam likhein"
                data-ocid="farmer_profile.name_input"
              />
            </div>
            <div>
              <Label
                htmlFor="farmer-mobile"
                className="text-xs text-muted-foreground"
              >
                Mobile Number (optional)
              </Label>
              <div className="flex mt-1">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                  +91
                </span>
                <Input
                  id="farmer-mobile"
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, ""));
                    markDirty();
                  }}
                  className="rounded-l-none border-input focus:border-primary"
                  placeholder="9876543210"
                  data-ocid="farmer_profile.mobile_input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank & Finance Card */}
        <Card
          className="border-l-4 shadow-sm"
          style={{ borderLeftColor: "oklch(0.68 0.18 72)" }}
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
              Bank & Finance
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Aadhaar-bank link status */}
            <div
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                profile?.aadhaarBankLinked
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-amber-50 border border-amber-300"
              }`}
              data-ocid="farmer_profile.aadhaar_status"
            >
              {profile?.aadhaarBankLinked ? (
                <>
                  <CheckCircle2
                    className="h-5 w-5 flex-shrink-0"
                    style={{ color: "oklch(0.38 0.11 148)" }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "oklch(0.38 0.11 148)" }}
                  >
                    Bank aur Aadhaar linked hai
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Linked nahi hai — PM-KISAN DBT ke liye zaroori
                  </span>
                </>
              )}
            </div>

            {/* Bank Branch */}
            <div>
              <Label
                htmlFor="bank-branch"
                className="text-xs text-muted-foreground"
              >
                Bank Branch
              </Label>
              <Input
                id="bank-branch"
                value={bankBranch}
                onChange={(e) => {
                  setBankBranch(e.target.value);
                  markDirty();
                }}
                className="mt-1 border-input focus:border-primary"
                placeholder="Branch ka naam"
                data-ocid="farmer_profile.bank_branch_input"
              />
            </div>

            {/* IFSC */}
            <div>
              <Label
                htmlFor="bank-ifsc"
                className="text-xs text-muted-foreground"
              >
                Bank IFSC
              </Label>
              <Input
                id="bank-ifsc"
                value={bankIfsc}
                onChange={(e) => {
                  setBankIfsc(e.target.value.toUpperCase());
                  markDirty();
                }}
                className={`mt-1 font-mono uppercase ${
                  ifscErr
                    ? "border-destructive"
                    : "border-input focus:border-primary"
                }`}
                placeholder="SBIN0001234"
                maxLength={11}
                data-ocid="farmer_profile.ifsc_input"
              />
              {ifscErr && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="farmer_profile.ifsc_field_error"
                >
                  {ifscErr}
                </p>
              )}
            </div>

            {/* Account last 4 */}
            {profile?.bankLast4 && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Account Number
                </Label>
                <p className="mt-1 text-sm font-mono text-foreground">
                  ••••{profile.bankLast4}
                </p>
              </div>
            )}

            {/* FPO/SHG */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  FPO / SHG Member
                </p>
                <p className="text-xs text-muted-foreground">
                  Farmer Producer Organization ya Self Help Group
                </p>
              </div>
              <Switch
                checked={fpoMember}
                onCheckedChange={(v) => {
                  setFpoMember(v);
                  markDirty();
                }}
                aria-label="FPO member toggle"
                data-ocid="farmer_profile.fpo_toggle"
              />
            </div>
            {fpoMember && (
              <div className="flex justify-end">
                <span
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: "oklch(0.38 0.11 148)", color: "#fff" }}
                >
                  FPO Member ✓
                </span>
              </div>
            )}

            {/* GST Number */}
            <div>
              <Label
                htmlFor="gst-number"
                className="text-xs text-muted-foreground"
              >
                GST Number (optional)
              </Label>
              <Input
                id="gst-number"
                value={gstNumber}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setGstNumber(v);
                  setShowGstAlert(v.length > 0);
                  markDirty();
                }}
                className="mt-1 font-mono uppercase border-input focus:border-primary"
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                data-ocid="farmer_profile.gst_input"
              />
              {showGstAlert && (
                <p
                  className="text-xs text-amber-700 mt-1 flex items-start gap-1"
                  data-ocid="farmer_profile.gst_alert"
                >
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  ₹20 lakh se zyada taxable income hone par GST registration
                  zaroor karein
                </p>
              )}
            </div>

            {/* FSSAI Number */}
            <div>
              <Label
                htmlFor="fssai-number"
                className="text-xs text-muted-foreground"
              >
                FSSAI Number (optional)
              </Label>
              <Input
                id="fssai-number"
                value={fssaiNumber}
                onChange={(e) => {
                  setFssaiNumber(e.target.value);
                  markDirty();
                }}
                className="mt-1 font-mono border-input focus:border-primary"
                placeholder="12345678901234"
                maxLength={14}
                data-ocid="farmer_profile.fssai_input"
              />
            </div>

            {/* AgriStack ID */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label
                  htmlFor="agristack-id"
                  className="text-xs text-muted-foreground"
                >
                  AgriStack ID (optional)
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="AgriStack ID kya hai?"
                      data-ocid="farmer_profile.agristack_info_button"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] text-xs">
                    AgriStack India ka national farmer database hai. Yeh ID
                    sarkari schemes ke liye use hoti hai.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="agristack-id"
                value={agristackId}
                onChange={(e) => {
                  setAgristackId(e.target.value);
                  markDirty();
                }}
                className="border-input focus:border-primary"
                placeholder="AGRI-XXXXXXXXXX"
                data-ocid="farmer_profile.agristack_input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !dirty}
            data-ocid="farmer_profile.submit_button"
          >
            <Save className="h-4 w-4 mr-2" />
            {mutation.isPending ? "Save ho raha hai..." : "Profile Save Karein"}
          </Button>
        </div>
      </div>
    </div>
  );
}
