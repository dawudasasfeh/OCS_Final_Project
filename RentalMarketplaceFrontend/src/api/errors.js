/**
 * Turns an axios error into a single readable message.
 *
 * The API replies in three different shapes:
 *   - a plain string from our own AuthService  ("Email is already registered.")
 *   - a ValidationProblemDetails object from [ApiController] model validation
 *   - nothing at all, when the request never reached the server
 */
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err?.code === "ERR_NETWORK") {
    return "Cannot reach the server. Is the API running?";
  }

  const data = err?.response?.data;
  if (!data) return fallback;

  if (typeof data === "string") return data;

  // { errors: { Email: ["The Email field is not a valid e-mail address."] } }
  if (data.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors).flat();
    if (messages.length) return messages.join(" ");
  }

  return data.title || fallback;
}
