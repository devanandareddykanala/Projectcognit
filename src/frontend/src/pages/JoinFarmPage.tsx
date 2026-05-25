import type { Farm } from "@/backend.d.ts";
import { Button } from "@/components/ui/button";
import { useFarm } from "@/context/FarmContext";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Leaf, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type JoinState = "looking" | "needs_login" | "joining" | "success" | "error";

export default function JoinFarmPage() {
  const { t } = useTranslation();
  const { code } = useParams({ from: "/join/$code" });
  const navigate = useNavigate();
  const { actor } = useActor();
  const { loginStatus, login } = useInternetIdentity();
  const { refetch, isDemo } = useFarm();

  const [state, setState] = useState<JoinState>("looking");
  const [joinedFarm, setJoinedFarm] = useState<Farm | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [manualCode, setManualCode] = useState("");

  const isLoggedIn = loginStatus === "success";

  // biome-ignore lint/correctness/useExhaustiveDependencies: code and refetch are stable refs; effect guards against re-running on actor/login changes
  useEffect(() => {
    if (!code || code.trim() === "" || code === "welcome") {
      // No valid invite code in URL — show manual entry
      return;
    }
    if (!actor) {
      // Still waiting for actor — keep looking state
      return;
    }
    if (isDemo) {
      // Demo mode — anonymous principal, cannot accept invite
      setState("needs_login");
      return;
    }
    if (!isLoggedIn) {
      setState("needs_login");
      return;
    }
    // Logged in — accept the invite
    setState("joining");
    actor
      .acceptInvite(code)
      .then((res) => {
        if (res.__kind__ === "ok") {
          setJoinedFarm(res.ok);
          setState("success");
          refetch();
        } else {
          setErrorMsg(res.err);
          setState("error");
        }
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : "Network error");
        setState("error");
      });
    // intentionally only re-run on actor/login/demo changes — code and refetch are stable
  }, [actor, isLoggedIn, isDemo]);

  return (
    <div
      data-ocid="join_farm.page"
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
    >
      {/* Manual invite code entry when no code in URL */}
      {(!code || code.trim() === "" || code === "welcome") && (
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="font-display text-lg text-foreground">
              {t("invite.title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("joinFarm.invite_code_hint")}
            </p>
          </div>
          <div className="space-y-2">
            <input
              data-ocid="join_farm.manual_code_input"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-center font-mono text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground text-center">
              {t("joinFarm.invite_code_hint")}
            </p>
          </div>
          <Button
            data-ocid="join_farm.manual_submit_button"
            type="button"
            className="w-full gap-2"
            disabled={manualCode.length < 6 || !actor || !isLoggedIn}
            onClick={() => {
              if (!actor || !isLoggedIn || manualCode.length < 6) return;
              setState("joining");
              actor
                .acceptInvite(manualCode)
                .then((res) => {
                  if (res.__kind__ === "ok") {
                    setJoinedFarm(res.ok);
                    setState("success");
                    refetch();
                  } else {
                    setErrorMsg(res.err);
                    setState("error");
                  }
                })
                .catch((err: unknown) => {
                  setErrorMsg(
                    err instanceof Error ? err.message : "Network error",
                  );
                  setState("error");
                });
            }}
          >
            {t("invite.title")}
          </Button>
          {!isLoggedIn && (
            <Button
              data-ocid="join_farm.login_button"
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => login()}
            >
              Internet Identity se Login Karein
            </Button>
          )}
        </div>
      )}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-8 h-8 text-primary" />
          <span className="font-display text-3xl text-foreground">
            Kisan Seva
          </span>
        </div>
        <p className="text-sm text-muted-foreground">India Grows Here.</p>
      </div>

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg p-6 space-y-6">
        {/* Looking */}
        {(state === "looking" || (state === "joining" && !actor)) && (
          <div
            data-ocid="join_farm.loading_state"
            className="text-center space-y-3 py-4"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">
              Farm dhund rahe hain...
            </p>
            <p className="font-mono text-xs text-primary bg-primary/10 inline-block px-3 py-1 rounded-full">
              {code}
            </p>
          </div>
        )}

        {/* Joining in progress */}
        {state === "joining" && actor && (
          <div
            data-ocid="join_farm.loading_state"
            className="text-center space-y-3 py-4"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">
              Farm mein join ho rahe hain...
            </p>
          </div>
        )}

        {/* Needs login */}
        {state === "needs_login" && (
          <div
            data-ocid="join_farm.needs_login"
            className="text-center space-y-4 py-2"
          >
            <div className="text-5xl">🔐</div>
            <div>
              <p className="font-display text-lg text-foreground">
                Login Karein
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Farm join karne ke liye pehle Internet Identity se login karein.
              </p>
              <p className="font-mono text-xs text-primary bg-primary/10 inline-block px-3 py-1 rounded-full mt-2">
                Invite Code: {code}
              </p>
            </div>
            {!isDemo && (
              <Button
                data-ocid="join_farm.login_button"
                type="button"
                onClick={() => login()}
                className="w-full gap-2"
              >
                Internet Identity se Login Karein
              </Button>
            )}
            {isDemo && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                Demo mode mein invite accept nahi hoti. Apne account se login
                karein.
              </p>
            )}
          </div>
        )}

        {/* Success */}
        {state === "success" && joinedFarm && (
          <div
            data-ocid="join_farm.success_state"
            className="text-center space-y-4 py-2"
          >
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
            <div>
              <p className="font-display text-xl text-foreground">
                Aap <span className="text-primary">{joinedFarm.name}</span> mein
                join ho gaye!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Aapka parivaar mein swagat hai. 🌾
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-left space-y-1">
              <p className="text-xs text-muted-foreground">Farm</p>
              <p className="text-sm font-semibold text-foreground">
                {joinedFarm.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {joinedFarm.mandal}, {joinedFarm.district}, {joinedFarm.state}
              </p>
              <p className="text-xs text-primary font-mono">
                {joinedFarm.ksId}
              </p>
            </div>
            <Button
              data-ocid="join_farm.open_farm_button"
              type="button"
              className="w-full gap-2"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              🌱 Farm Kholein
            </Button>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div
            data-ocid="join_farm.error_state"
            className="text-center space-y-4 py-2"
          >
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <p className="font-display text-lg text-foreground">
                Invite Invalid Hai
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Invite expired ya invalid hai. Nayi invite maangein.
              </p>
              {errorMsg && (
                <p className="text-xs text-destructive mt-2 bg-destructive/10 rounded px-2 py-1">
                  {errorMsg}
                </p>
              )}
            </div>
            <Button
              data-ocid="join_farm.go_home_button"
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: "/" })}
            >
              Ghar Wapas Jaayein
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </p>
    </div>
  );
}
