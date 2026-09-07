import { useCallback, useState } from "react";

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
// giving up on "This field".
const labelFor = (el) => {
  const label = el.id && el.form?.querySelector(`label[for="${CSS.escape(el.id)}"]`);
  return (
    label?.textContent?.replace(/\s*\*$/, "").trim() ||
    el.getAttribute("aria-label") ||
    el.placeholder ||
    "This field"
  );
};

export function messageFor(el) {
  const v = el.validity;
  const name = labelFor(el);

  if (v.valueMissing) return `${name} is required.`;

  // A custom title is written for the human; prefer it over anything generic.
  if (v.patternMismatch) return el.title || `${name} is not in the expected format.`;

  if (v.typeMismatch) {
    if (el.type === "email") return "Enter a valid email address, like name@example.com.";
    if (el.type === "url") return "Enter a valid web address.";
    return `${name} is not valid.`;
  }

  if (v.tooShort) return `${name} must be at least ${el.minLength} characters.`;
  if (v.tooLong) return `${name} must be ${el.maxLength} characters or fewer.`;
  if (v.rangeUnderflow) return `${name} must be ${el.min} or more.`;
  if (v.rangeOverflow) return `${name} must be ${el.max} or less.`;
  if (v.stepMismatch) return `${name} must be a whole number.`;
  if (v.badInput) return `${name} is not a valid number.`;

  return `${name} is not valid.`;
}

/**
 * Keyed by id rather than name, because only the register form gives its
 * inputs names and every input already needs an id to pair with its label.
 */
export function useFieldErrors() {
  const [errors, setErrors] = useState({});

  const validate = useCallback((form) => {
    const found = {};

    for (const el of form.elements) {
      if (!el.id || el.disabled || el.type === "submit" || el.type === "button") continue;
      if (!el.checkValidity()) found[el.id] = messageFor(el);
    }

    setErrors(found);

    // Put the caret in the first problem field, so a long form does not leave
    // the user hunting for what it objected to.
    const first = Object.keys(found)[0];
    if (first) form.querySelector(`#${CSS.escape(first)}`)?.focus();

    return Object.keys(found).length === 0;
  }, []);

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
