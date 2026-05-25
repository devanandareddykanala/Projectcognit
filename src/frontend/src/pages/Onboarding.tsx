import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useFarm } from "../context/FarmContext";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Rajasthan",
  "Gujarat",
  "Punjab",
  "Haryana",
  "Bihar",
  "West Bengal",
  "Odisha",
  "Jharkhand",
  "Chhattisgarh",
  "Assam",
  "Kerala",
  "Uttarakhand",
  "Himachal Pradesh",
  "Manipur",
  "Meghalaya",
  "Nagaland",
  "Tripura",
  "Mizoram",
  "Arunachal Pradesh",
  "Sikkim",
  "Goa",
  "Jammu & Kashmir",
  "Ladakh",
  "Delhi",
  "Chandigarh",
  "Puducherry",
  "Andaman & Nicobar",
  "Lakshadweep",
  "Dadra & NH",
  "Daman & Diu",
];

const AREA_UNITS = [
  { value: "Acres", label: "Acres" },
  { value: "Guntha", label: "Guntha" },
  { value: "Cents", label: "Cents" },
  { value: "Bigha", label: "Bigha" },
  { value: "Hectares", label: "Hectares" },
] as const;
type AreaUnit = (typeof AREA_UNITS)[number]["value"];

const OWNERSHIP_TYPES = ["Own", "Leased", "Shared", "Assigned"] as const;

const FARM_PURPOSES = [
  { key: "Crop", label: "Crops", emoji: "🌾" },
  { key: "Dairy", label: "Dairy", emoji: "🐄" },
  { key: "Horticulture", label: "Horticulture", emoji: "🍋" },
  { key: "Greenhouse", label: "Greenhouse", emoji: "🏠" },
  { key: "Fisheries", label: "Fisheries", emoji: "🐟" },
  { key: "Poultry", label: "Poultry", emoji: "🐓" },
  { key: "Solar", label: "Solar", emoji: "☀️" },
] as const;

const BIGHA_BY_STATE: Record<string, number> = {
  "Uttar Pradesh": 2529,
  Bihar: 2529,
  Jharkhand: 2529,
  "West Bengal": 1333,
  Rajasthan: 2529,
  "Madhya Pradesh": 1333,
  Assam: 1337,
  "Himachal Pradesh": 1008,
  Uttarakhand: 2529,
};

function toSqm(area: number, unit: AreaUnit, state: string): number {
  switch (unit) {
    case "Acres":
      return area * 4046.86;
    case "Guntha":
      return area * 101.17;
    case "Cents":
      return area * 40.47;
    case "Bigha":
      return area * (BIGHA_BY_STATE[state] ?? 2529);
    case "Hectares":
      return area * 10000;
    default:
      return area * 4046.86;
  }
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div
      className="flex items-center justify-center gap-2 mb-8"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      tabIndex={0}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static progress dots — index is the identity
          key={`dot-${i}`}
          className="rounded-full transition-all duration-200"
          style={{
            width: i === current ? "1.75rem" : "0.5rem",
            height: "0.5rem",
            background: i <= current ? "#1B5E20" : "oklch(0.85 0.02 148)",
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm mx-auto bg-card rounded-2xl shadow-xl overflow-hidden">
      {children}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createFarmFromOnboarding, loadDemoFarm, updateFarm } = useFarm();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [village, setVillage] = useState("");
  const [farmName, setFarmName] = useState("");
  const [areaValue, setAreaValue] = useState("");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("Acres");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [ownershipType, setOwnershipType] = useState<string>("Own");
  const [purposes, setPurposes] = useState<string[]>(["Crop"]);
  const [saving, setSaving] = useState(false);
  const [ksId, setKsId] = useState("");
  const [createError, setCreateError] = useState("");

  const TOTAL_STEPS = 7;

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleTryDemo = async () => {
    await loadDemoFarm();
    navigate({ to: "/dashboard" });
  };

  const handleCreateFarm = async () => {
    setSaving(true);
    setCreateError("");
    try {
      const sqm = Math.round(toSqm(Number(areaValue) || 0, areaUnit, state));
      const createdFarm = await createFarmFromOnboarding(
        farmName,
        state,
        district,
        mandal,
        village,
        sqm,
      );
      if (createdFarm) {
        if (purposes.length > 0) await updateFarm({ purposes });
        if (surveyNumber.trim())
          await updateFarm({
            surveyNumber: surveyNumber.trim(),
            ownershipType,
          });
        else await updateFarm({ ownershipType });
        setKsId(createdFarm.ksId);
      } else {
        setCreateError(t("common.error"));
      }
    } catch {
      setCreateError(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleStep5Continue = () => {
    setDirection(1);
    setStep(6);
    setSaving(true);
    setCreateError("");
    const sqm = Math.round(toSqm(Number(areaValue) || 0, areaUnit, state));
    createFarmFromOnboarding(farmName, state, district, mandal, village, sqm)
      .then(async (createdFarm) => {
        if (createdFarm) {
          if (purposes.length > 0) await updateFarm({ purposes });
          if (surveyNumber.trim())
            await updateFarm({
              surveyNumber: surveyNumber.trim(),
              ownershipType,
            });
          else await updateFarm({ ownershipType });
          setKsId(createdFarm.ksId);
        } else {
          setCreateError(t("common.error"));
        }
      })
      .catch(() => setCreateError(t("common.error")))
      .finally(() => setSaving(false));
  };

  const togglePurpose = (key: string) =>
    setPurposes((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const variants = prefersReducedMotion
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
      };

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-start px-4 py-8"
      style={{ background: "#1B5E20" }}
      data-ocid="onboarding.page"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 self-start">
        <span className="text-2xl" aria-hidden="true">
          🌾
        </span>
        <span
          className="font-display text-xl font-bold"
          style={{ color: "#fff" }}
        >
          {t("app.name")}
        </span>
      </div>

      <AnimatePresence custom={direction} mode="wait">
        {/* ── STEP 0: Choose action ───────────────────────────────────── */}
        {step === 0 && (
          <motion.div
            key="step-0"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            <StepCard>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3" aria-hidden="true">
                    🌱
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                    {t("onboarding.title")}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t("onboarding.your_land_identity")}
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-95 min-h-[52px]"
                    style={{ background: "#1B5E20", color: "#fff" }}
                    onClick={goNext}
                    data-ocid="onboarding.create_farm.button"
                  >
                    {t("onboarding.createFarm")}
                  </button>
                  <button
                    type="button"
                    className="w-full py-4 rounded-xl font-semibold text-base border-2 transition-all active:scale-95 min-h-[52px]"
                    style={{ borderColor: "#1B5E20", color: "#1B5E20" }}
                    onClick={() =>
                      navigate({
                        to: "/join/$code",
                        params: { code: "welcome" },
                      })
                    }
                    data-ocid="onboarding.join_farm.button"
                  >
                    {t("onboarding.joinFarm")}
                  </button>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleTryDemo}
                      className="text-sm font-medium underline underline-offset-2 min-h-[44px] px-4 py-2 transition-opacity hover:opacity-75"
                      style={{ color: "#F9A825" }}
                      data-ocid="onboarding.try_demo.button"
                    >
                      {t("onboarding.tryDemo")}
                    </button>
                  </div>
                </div>
              </div>
            </StepCard>
          </motion.div>
        )}

        {/* ── STEP 1: State ──────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step-1"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            <StepCard>
              <div className="p-6">
                <StepDots total={TOTAL_STEPS} current={0} />
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  {t("farm.state")}
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {t("onboarding.choose_your_state")}
                </p>
                <Label htmlFor="state-select" className="sr-only">
                  {t("farm.state")}
                </Label>
                <select
                  id="state-select"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-input rounded-lg px-3 py-3 text-base bg-background text-foreground min-h-[48px] mb-6 focus:outline-none focus:ring-2 focus:ring-primary"
                  data-ocid="onboarding.state.select"
                >
                  <option value="">-- Select State --</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    className="flex-1 min-h-[48px]"
                    data-ocid="onboarding.step1.back_button"
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1 min-h-[48px]"
                    style={{ background: "#1B5E20", color: "#fff" }}
                    disabled={!state}
                    onClick={goNext}
                    data-ocid="onboarding.step1.next_button"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </StepCard>
          </motion.div>
        )}

        {/* ── STEP 2: District / Mandal / Village ───────────────────── */}
        {step === 2 && (
          <motion.div
            key="step-2"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            <StepCard>
              <div className="p-6">
                <StepDots total={TOTAL_STEPS} current={1} />
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  {t("onboarding.your_home_location")}
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {t("onboarding.district_mandal_village")}
                </p>
                <div className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="district">{t("farm.district")} *</Label>
                    <Input
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder={
                        state === "Andhra Pradesh"
                          ? "e.g. Kadapa"
                          : state === "Telangana"
                            ? "e.g. Hyderabad"
                            : "Your district"
                      }
                      className="mt-1 min-h-[48px]"
                      data-ocid="onboarding.district.input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mandal">{t("farm.mandal")}</Label>
                    <Input
                      id="mandal"
                      value={mandal}
                      onChange={(e) => setMandal(e.target.value)}
                      placeholder="e.g. Galiveedu"
                      className="mt-1 min-h-[48px]"
                      data-ocid="onboarding.mandal.input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="village">{t("farm.village")}</Label>
                    <Input
                      id="village"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Develvyn Palli"
                      className="mt-1 min-h-[48px]"
                      data-ocid="onboarding.village.input"
                    />
                  </div>
                </div>
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 mb-5 text-xs text-muted-foreground"
                  style={{ background: "oklch(0.96 0.02 148)" }}
                >
                  <span aria-hidden="true">🔒</span>
                  <span>Aapka data sirf aapke paas rahega</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    className="flex-1 min-h-[48px]"
                    data-ocid="onboarding.step2.back_button"
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1 min-h-[48px]"
                    style={{ background: "#1B5E20", color: "#fff" }}
                    disabled={!district.trim()}
                    onClick={goNext}
                    data-ocid="onboarding.step2.next_button"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </StepCard>
          </motion.div>
        )}

        {/* ── STEP 3: Farm name + Area ───────────────────────────────── */}
        {step === 3 && (
          <motion.div
            key="step-3"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            <StepCard>
              <div className="p-6">
                <StepDots total={TOTAL_STEPS} current={2} />
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  {t("onboarding.field_identity_heading")}
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {t("onboarding.name_and_area")}
                </p>
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="farmName">{t("farm.name")} *</Label>
                    <Input
                      id="farmName"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="e.g. Develvyn Farm"
                      className="mt-1 min-h-[48px]"
                      data-ocid="onboarding.farm_name.input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="areaValue">{t("farm.area")} *</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="areaValue"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={areaValue}
                        onChange={(e) => setAreaValue(e.target.value)}
                        placeholder="1.5"
                        className="flex-1 min-h-[48px]"
                        data-ocid="onboarding.area_value.input"
                      />
                      <select
                        value={areaUnit}
                        onChange={(e) =>
                          setAreaUnit(e.target.value as AreaUnit)
                        }
                        className="border border-input rounded-lg px-2 py-2 text-sm bg-background text-foreground min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary"
                        data-ocid="onboarding.area_unit.select"
                      >
                        {AREA_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    className="flex-1 min-h-[48px]"
                    data-ocid="onboarding.step3.back_button"
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1 min-h-[48px]"
                    style={{ background: "#1B5E20", color: "#fff" }}
                    disabled={!farmName.trim() || !areaValue}
                    onClick={goNext}
                    data-ocid="onboarding.step3.next_button"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </StepCard>
          </motion.div>
        )}

        {/* ── STEP 4: Survey Number (optional) ──────────────────────── */}
        {step === 4 && (
          <motion.div
            key="step-4"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            <StepCard>
              <div className="p-6">
                <StepDots total={TOTAL_STEPS} current={3} />
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  {t("farm.surveyNumber")}
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {t("farm.surveyOptional")}
                </p>
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="surveyNumber">
                      {t("farm.surveyNumber")}{" "}
                      <span className="text-muted-foreground text-xs">
                        ({t("common.optional")})
                      </span>
                    </Label>
                    <Input
                      id="surveyNumber"
                      value={surveyNumber}
                      onChange={(e) => setSurveyNumber(e.target.value)}
                      placeholder="e.g. 123/A"
                      className="mt-1 min-h-[48px]"
                      data-ocid="onboarding.survey_number.input"
                    />
                  </div>
                  <div>
                    <Label>{t("farm.ownership")}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {OWNERSHIP_TYPES.map((ot) => (
                        <button
                          key={ot}
                          type="button"
                          onClick={() => setOwnershipType(ot)}
                          className="py-3 rounded-lg border-2 text-sm font-medium transition-all min-h-[48px]"
                          style={{
                            borderColor:
                              ownershipType === ot
                                ? "#1B5E20"
                                : "var(--border)",
                            background:
                              ownershipType === ot
                                ? "oklch(0.96 0.03 148)"
                                : "transparent",
                            color:
                              ownershipType === ot
                                ? "#1B5E20"
                                : "var(--foreground)",
                          }}
                          data-ocid={`onboarding.ownership.${ot.toLowerCase()}.button`}
                        >
                          {ot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    className="flex-1 min-h-[48px]"
                    data-ocid="onboarding.step4.back_button"
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1 min-h-[48px]"
                    style={{ background: "#1B5E20", color: "#fff" }}
                    onClick={goNext}
                    data-ocid="onboarding.step4.skip_button"
                  >
                    {surveyNumber.trim() ? "Next →" : "Skip →"}
                  </Button>
                </div>
              </div>
            </StepCard>
          </motion.div>
        )}

        {/* ── STEP 5: Farm type ──────────────────────────────────────── */}
        {step === 5 && (
          <motion.div
            key="step-5"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            <StepCard>
              <div className="p-6">
                <StepDots total={TOTAL_STEPS} current={4} />
                <h2 className="font-display text-xl font-bold text-foreground mb-1">
                  {t("farm.purposes")}
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {t("onboarding.select_all_applicable")}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {FARM_PURPOSES.map(({ key, label, emoji }) => {
                    const isSelected = purposes.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => togglePurpose(key)}
                        className="py-3 px-3 rounded-xl border-2 flex items-center gap-2 text-sm font-medium transition-all min-h-[52px]"
                        style={{
                          borderColor: isSelected ? "#1B5E20" : "var(--border)",
                          background: isSelected
                            ? "oklch(0.96 0.03 148)"
                            : "transparent",
                          color: isSelected ? "#1B5E20" : "var(--foreground)",
                        }}
                        data-ocid={`onboarding.purpose.${key.toLowerCase()}.checkbox`}
                        aria-pressed={isSelected}
                      >
                        <span aria-hidden="true">{emoji}</span>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    className="flex-1 min-h-[48px]"
                    data-ocid="onboarding.step5.back_button"
                  >
                    ← Back
                  </Button>
                  <Button
                    className="flex-1 min-h-[48px]"
                    style={{ background: "#1B5E20", color: "#fff" }}
                    disabled={purposes.length === 0}
                    onClick={handleStep5Continue}
                    data-ocid="onboarding.step5.next_button"
                  >
                    Create Farm
                  </Button>
                </div>
              </div>
            </StepCard>
          </motion.div>
        )}

        {/* ── STEP 6: KS Farm ID generation ─────────────────────────── */}
        {step === 6 && (
          <motion.div
            key="step-6"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            <StepCard>
              <div className="p-6 text-center">
                <StepDots total={TOTAL_STEPS} current={6} />

                {saving && (
                  <div
                    className="py-8"
                    data-ocid="onboarding.creation.loading_state"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
                      style={{ background: "oklch(0.92 0.04 148)" }}
                      aria-hidden="true"
                    >
                      <span className="text-3xl">🌱</span>
                    </div>
                    <p className="font-semibold text-foreground mb-1">
                      Aapka khet bana rahe hain...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ek pal ruken
                    </p>
                  </div>
                )}

                {!saving && createError && (
                  <div
                    className="py-6"
                    data-ocid="onboarding.creation.error_state"
                  >
                    <div className="text-4xl mb-3" aria-hidden="true">
                      ⚠️
                    </div>
                    <p className="font-semibold text-foreground mb-4">
                      {createError}
                    </p>
                    <Button
                      onClick={handleCreateFarm}
                      className="min-h-[48px] px-6"
                      style={{ background: "#1B5E20", color: "#fff" }}
                      data-ocid="onboarding.creation.retry_button"
                    >
                      Dobara Try Karein
                    </Button>
                  </div>
                )}

                {!saving && !createError && ksId && (
                  <div
                    className="py-4"
                    data-ocid="onboarding.creation.success_state"
                  >
                    <div className="text-5xl mb-4" aria-hidden="true">
                      🎉
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                      Mubarak ho!
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Aapka Kisan Seva khet taiyaar hai
                    </p>
                    <div
                      className="rounded-xl px-4 py-4 mb-4"
                      style={{ background: "#1B5E20" }}
                    >
                      <p
                        className="text-xs font-medium mb-1"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        {t("farm.ksId")}
                      </p>
                      <p
                        className="font-mono text-lg font-bold tracking-widest"
                        style={{ color: "#F9A825" }}
                        data-ocid="onboarding.ks_farm_id.display"
                      >
                        {ksId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ksId).then(() => {
                          import("sonner").then(({ toast }) =>
                            toast.success("KS Farm ID copied!"),
                          );
                        });
                      }}
                      className="w-full py-2.5 rounded-lg border text-sm font-medium mb-4 min-h-[44px] transition-opacity hover:opacity-75"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--muted-foreground)",
                      }}
                      data-ocid="onboarding.ks_farm_id.copy_button"
                    >
                      📋 {t("invite.copy")} ID
                    </button>
                    <Button
                      className="w-full min-h-[52px] text-base font-semibold"
                      style={{ background: "#1B5E20", color: "#fff" }}
                      onClick={() => {
                        try {
                          navigate({ to: "/dashboard" });
                        } catch {
                          import("sonner").then(({ toast }) => {
                            toast.error(t("common.error"));
                          });
                          window.location.href = "/dashboard";
                        }
                      }}
                      data-ocid="onboarding.start.primary_button"
                    >
                      {t("onboarding.start_kisan_seva")} 🌾
                    </Button>
                  </div>
                )}
              </div>
            </StepCard>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-8" aria-hidden="true" />
    </div>
  );
}
