import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./en.json";
import ar from "./ar.json";

/**
 * Two languages, English and Arabic.
 *
 * Only the interface is translated. A listing's title and description stay
 * exactly as the owner typed them — an owner writes in one language and there
 * is nothing honest to do about that on the client. Server messages are still
 * English too; they arrive as free text from the API and translating them
 * would mean matching on their wording, which breaks the moment a message
 * is reworded.
 */
export const LANGUAGES = {
  en: { label: "English", native: "English", dir: "ltr" },
  ar: { label: "Arabic", native: "العربية", dir: "rtl" },
};

/**
 * Direction and lang belong on <html>, not on a wrapper div: `dir` inherits,
 * and putting it at the root is what makes the logical CSS properties, form
 * controls and text selection all flip together.
 */
export function applyDocumentLanguage(lng) {
  const code = LANGUAGES[lng] ? lng : "en";
  const root = document.documentElement;
  root.lang = code;
  root.dir = LANGUAGES[code].dir;
  // A hook for the few rules that cannot be expressed logically, and for
  // switching the body face to the Arabic one.
  root.classList.toggle("rtl", LANGUAGES[code].dir === "rtl");
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    fallbackLng: "en",
    supportedLngs: Object.keys(LANGUAGES),
    // A missing Arabic string shows the English one rather than the raw key,
    // so a half-finished translation degrades into a readable page.
    returnEmptyString: false,
    interpolation: { escapeValue: false }, // React escapes already
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "beytak.lang",
      caches: ["localStorage"],
    },
  });

applyDocumentLanguage(i18n.resolvedLanguage);
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
