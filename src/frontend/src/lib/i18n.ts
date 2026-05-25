import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enTranslation from "../locales/en/translation.json";
import hiTranslation from "../locales/hi/translation.json";
import teTranslation from "../locales/te/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      hi: { translation: hiTranslation },
      te: { translation: teTranslation },
    },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "kisanSeva_language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

// Dynamic font loading per locale
export function loadLocaleFont(lang: string) {
  const existing = document.getElementById("locale-font-link");
  if (existing) existing.remove();
  if (lang === "te") {
    const link = document.createElement("link");
    link.id = "locale-font-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  } else if (lang === "hi") {
    const link = document.createElement("link");
    link.id = "locale-font-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }
}

i18n.on("languageChanged", loadLocaleFont);

export default i18n;
