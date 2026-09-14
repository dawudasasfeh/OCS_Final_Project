import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Inline field validation built on the constraints already declared in the
 * markup — required, type, pattern, min, max, maxLength.
 *
 * The browser knows perfectly well what is wrong with a field; what it is bad
 * at is saying so. "Please match the requested format" tells nobody anything.
 * So the forms keep noValidate to suppress the native bubbles, and this reads
 * the same validity state to render a message under the field instead.
 *
 * Nothing here re-implements a rule. If a constraint is not in the markup it is
 * not enforced, which keeps one source of truth per field.
 */

// Not every field has a visible label — the payment row is laid out with
// placeholders — so fall back through the other things that name a field before
// giving up on the generic "This field".
const labelFor = (el, t) => {
  const label = el.id && el.form?.querySelector(`label[for="${CSS.escape(el.id)}"]`);
  return (
    label?.textContent?.replace(/\s*\*$/, "").trim() ||
    el.getAttribute("aria-label") ||
    el.placeholder ||
    t("validation.thisField")
  );
};

export function messageFor(el, t) {
  const v = el.validity;
  const name = labelFor(el, t);

  if (v.valueMissing) return t("validation.fieldRequired", { field: name });

  // A custom title is written for the human; prefer it over anything generic.
  if (v.patternMismatch) return el.title || t("validation.patternMismatch", { field: name });

  if (v.typeMismatch) {
    if (el.type === "email") return t("validation.emailInvalid");
    if (el.type === "url") return t("validation.urlInvalid");
    return t("validation.fieldInvalid", { field: name });
  }

  if (v.tooShort) return t("validation.tooShort", { field: name, min: el.minLength });
  if (v.tooLong) return t("validation.tooLong", { field: name, max: el.maxLength });
  if (v.rangeUnderflow) return t("validation.rangeUnderflow", { field: name, min: el.min });
  if (v.rangeOverflow) return t("validation.rangeOverflow", { field: name, max: el.max });
  if (v.stepMismatch) return t("validation.stepMismatch", { field: name });
  if (v.badInput) return t("validation.badInput", { field: name });

  return t("validation.fieldInvalid", { field: name });
}

/**
 * Keyed by id rather than name, because only the register form gives its
 * inputs names and every input already needs an id to pair with its label.
 */
export function useFieldErrors() {
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});

  const validate = useCallback((form) => {
    const found = {};

    for (const el of form.elements) {
      if (!el.id || el.disabled || el.type === "submit" || el.type === "button") continue;
      if (!el.checkValidity()) found[el.id] = messageFor(el, t);
    }

    setErrors(found);

    // Put the caret in the first problem field, so a long form does not leave
    // the user hunting for what it objected to.
    const first = Object.keys(found)[0];
    if (first) form.querySelector(`#${CSS.escape(first)}`)?.focus();

    return Object.keys(found).length === 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  // Clear one field's message as soon as it is edited; re-reporting on every
  // keystroke would flag a field as wrong while it is still being typed.
  const clearError = useCallback((id) => {
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const reset = useCallback(() => setErrors({}), []);

  /**
   * For rules the markup cannot express, because they involve more than one
   * field — "the two passwords do not match" belongs on the second password
   * box, not in a banner at the top of the form.
   */
  const setFieldError = useCallback((id, message) => {
    setErrors((prev) => ({ ...prev, [id]: message }));
    document.querySelector(`#${CSS.escape(id)}`)?.focus();
  }, []);

  return { errors, validate, clearError, reset, setFieldError };
}
