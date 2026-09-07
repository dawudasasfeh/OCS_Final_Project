/**
 * The validation message under a field. Renders nothing when the field is
 * fine, so it can be dropped in unconditionally.
 *
 * role="alert" so a screen reader announces it when it appears — the message
 * arrives after the user has already left the field, so nothing else would
 * draw attention to it.
 */
export default function FieldError({ children }) {
  if (!children) return null;
  return <p className="field-error" role="alert">{children}</p>;
}
