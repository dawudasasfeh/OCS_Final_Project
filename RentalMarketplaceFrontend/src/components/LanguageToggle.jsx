import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n";
import { IconGlobe } from "./icons";

/**
 * Two languages, so this is a switch rather than a menu — a dropdown holding
 * one alternative is a menu with nothing to choose from.
 *
 * The button shows the language it will switch you *to*, never the one you are
 * already reading. Showing the current language is the commoner pattern and the
 * more confusing one: it looks like a label until you click it.
 *
 * The globe is what makes it findable without reading either language — it is
 * the one symbol people look for when a page is in a script they cannot read.
 */
export default function LanguageToggle({ className = "" }) {
  const { i18n, t } = useTranslation();

  const current = LANGUAGES[i18n.resolvedLanguage] ? i18n.resolvedLanguage : "en";
  const next = current === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      className={`lang-toggle ${className}`}
      onClick={() => i18n.changeLanguage(next)}
      // The label is always in the target language, so a reader who cannot read
      // the current one can still find their way out.
      aria-label={t("lang.switchTo", { language: LANGUAGES[next].native })}
    >
      <IconGlobe size={16} />
      <span lang={next}>{LANGUAGES[next].native}</span>
    </button>
  );
}
