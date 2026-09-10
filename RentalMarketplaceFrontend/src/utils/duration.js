// These integers are Domain/Enums/DurationType.cs. If that enum is ever
// renumbered, this map has to change with it.
export const DURATION_TYPE = { Weekly: 1, Monthly: 2, Yearly: 3 };

// The i18n key stem for each unit. English needs two plural forms and Arabic
// needs six, so the counting is left to i18next rather than an "s" on the end.
export const UNIT_KEY = { Weekly: "week", Monthly: "month", Yearly: "year" };

// Alias UNIT_NOUN to match what BookingForm.jsx expects
export const UNIT_NOUN = UNIT_KEY; 
/**
 * Takes t rather than calling useTranslation itself: this module is imported by
 * plain functions as well as components, and a hook cannot be called from those.
 */
export function periodLabel(t, count, durationType) {
  const unit = UNIT_KEY[durationType] ?? "period";
  return t(`duration.${unit}`, { count });
}
