import { useNavigate } from "@tanstack/react-router";
import { Leaf, Shield, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useFarm } from "../context/FarmContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loadDemoFarm } = useFarm();

  const handleTryDemo = async () => {
    await loadDemoFarm();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-white sticky top-0 z-10">
        <span className="font-display text-xl font-bold text-primary">
          Kisan Seva
        </span>
        <LanguageSwitcher />
      </header>

      {/* Hero */}
      <section className="bg-primary text-white px-6 py-12 text-center flex flex-col items-center gap-4">
        <div className="text-5xl" aria-hidden="true">
          🌾
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight">
          {t("app.name", "Kisan Seva")}
        </h1>
        <p className="text-lg font-sans opacity-90">
          {t("app.tagline", "India Grows Here.")}
        </p>
      </section>

      {/* Features */}
      <section className="px-4 py-8 flex flex-col gap-4">
        <div className="bg-white rounded-xl border-l-4 border-primary p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Leaf className="text-primary mt-1 shrink-0" size={20} />
            <div>
              <h3 className="font-sans font-semibold text-foreground">
                Apna Kheta Manage Karein
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                KS Farm ID ke saath apne kheto, faslon aur amdani ka hisaab
                rakhein
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-primary p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className="text-primary mt-1 shrink-0" size={20} />
            <div>
              <h3 className="font-sans font-semibold text-foreground">
                Parivaar Ke Saath
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Parivaar ko invite karein — Admin, Sadasya ya Dekhne Wala role
                ke saath
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-primary p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Wifi className="text-primary mt-1 shrink-0" size={20} />
            <div>
              <h3 className="font-sans font-semibold text-foreground">
                Offline Bhi Kaam Karo
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pehli baar load hone ke baad internet ke bina bhi kaam karta hai
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="px-4 pb-8 flex flex-col gap-3 mt-auto">
        <button
          type="button"
          data-ocid="landing.create_farm"
          onClick={() => navigate({ to: "/onboarding" })}
          className="w-full bg-primary text-white font-sans font-semibold py-4 rounded-xl text-base"
        >
          Apna Kheta Banayein
        </button>
        <button
          type="button"
          data-ocid="landing.join_farm"
          onClick={() => navigate({ to: "/onboarding" })}
          className="w-full border-2 border-primary text-primary font-sans font-semibold py-4 rounded-xl text-base bg-transparent"
        >
          Kisi Ke Kheta Mein Jodein
        </button>
        <div className="text-center mt-2">
          <button
            type="button"
            data-ocid="landing.try_demo"
            onClick={handleTryDemo}
            className="text-accent font-sans text-sm underline"
          >
            Try Demo — Develvyn Farm dekho
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        Kisan Seva v1.0.0 · India Grows Here.
      </footer>
    </div>
  );
}
