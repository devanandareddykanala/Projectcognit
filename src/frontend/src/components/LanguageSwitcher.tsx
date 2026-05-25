import { cn } from "@/lib/utils";
import i18n from "../lib/i18n";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "hi", label: "\u0939\u093f\u0902" },
  { code: "te", label: "\u0c24\u0c46" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
  const current = i18n.language?.split("-")[0] ?? "en";

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      data-ocid="language_switcher.panel"
    >
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => i18n.changeLanguage(code)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-150",
            current === code
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-pressed={current === code}
          data-ocid={`language_switcher.${code}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
