/**
 * The backend has no i18n of its own — every Result.Fail(...) message is a
 * plain English literal. Rather than localize forty-odd call sites across
 * seven services, this maps the known set of them to translation keys here,
 * at the one place every one of those messages already passes through.
 *
 * A message not in this map (a typo, a future addition on the backend) falls
 * back to the raw English string rather than breaking, so this degrades
 * gracefully instead of hiding an error the user needs to see.
 */
const STATIC_MESSAGES = {
  "Account not found.": "apiError.accountNotFound",
  "Administrators cannot make bookings.": "apiError.adminsCannotBook",
  "Property not found.": "apiError.propertyNotFound",
  "This property is not available for booking.": "apiError.propertyNotAvailable",
  "You cannot book your own property.": "apiError.cannotBookOwn",
  "Start date cannot be in the past.": "apiError.startInPast",
  "Invalid rental period.": "apiError.invalidPeriod",
  "Those dates are not available.": "apiError.datesUnavailable",
  "Listing not found.": "apiError.listingNotFound",
  "Booking not found.": "apiError.bookingNotFound",
  "You do not own this property.": "apiError.notYourProperty",
  "This is not your booking.": "apiError.notYourBooking",
  "Administrators cannot publish listings.": "apiError.adminsCannotPublish",
  "An active subscription is required to publish a listing.": "apiError.subscriptionRequired",
  "You do not own this listing.": "apiError.notYourListing",
  "This listing is already available.": "apiError.listingAlreadyAvailable",
  "This listing is already delisted.": "apiError.listingAlreadyDelisted",
  "This listing is not available.": "apiError.listingNotAvailable",
  "This listing is not in your wishlist.": "apiError.notInWishlist",
  "You cannot save your own listing.": "apiError.cannotSaveOwn",
  "You cannot decide on this payment.": "apiError.cannotDecidePayment",
  "Payment not found.": "apiError.paymentNotFound",
  "You can only record a payment once the owner has confirmed the booking.":
    "apiError.paymentNeedsConfirmedBooking",
  "Testimonial not found.": "apiError.testimonialNotFound",
  "Email is already registered.": "apiError.emailRegistered",
  "Invalid Email or Password.": "apiError.invalidLogin",
  "Too many failed sign-in attempts. Try again in 15 minutes.": "apiError.lockedOut",
  "That booking is longer than allowed.": "apiError.bookingTooLong",
  "You already have a pending request for this property.": "apiError.duplicatePending",
  "You have too many pending requests. Wait for an owner to answer one first.":
    "apiError.tooManyPending",
  "This booking is already fully paid.": "apiError.fullyPaid",
  "That is more than the outstanding balance on this booking.": "apiError.overpayment",
  "This listing already has the maximum number of photos.": "apiError.tooManyPhotos",
};

// "This property is rented Weekly only." — the enum name comes through
// exactly as C# renders it (PascalCase), which is also how period.* is keyed.
const RENTED_PERIOD = /^This property is rented (\w+) only\.$/;

// "This booking is already Confirmed." / "This listing is already approved."
// — casing is inconsistent on the backend (booking's is PascalCase, the rest
// are lowercased), so this matches either and lowercases before lookup.
const ALREADY_STATUS = /^This (booking|listing|payment|testimonial) is already (\w+)\.$/i;

const NOUN_KEYS = {
  booking: "apiError.nounBooking",
  listing: "apiError.nounListing",
  payment: "apiError.nounPayment",
  testimonial: "apiError.nounTestimonial",
};

function translate(message, t) {
  const staticKey = STATIC_MESSAGES[message];
  if (staticKey) return t(staticKey);

  const rented = message.match(RENTED_PERIOD);
  if (rented) {
    const period = rented[1].charAt(0).toLowerCase() + rented[1].slice(1);
    return t("apiError.rentedPeriodOnly", { period: t(`period.${period}`, { defaultValue: rented[1] }) });
  }

  const already = message.match(ALREADY_STATUS);
  if (already) {
    const [, noun, status] = already;
    const statusKey = status.charAt(0).toLowerCase() + status.slice(1);
    return t("apiError.alreadyStatus", {
      noun: t(NOUN_KEYS[noun.toLowerCase()]),
      status: t(`status.${statusKey}`, { defaultValue: status }),
    });
  }

  return message;
}

/**
 * Turns an axios error into a single readable message.
 *
 * The API replies in three different shapes:
 *   - a plain string from our own AuthService  ("Email is already registered.")
 *   - a ValidationProblemDetails object from [ApiController] model validation
 *   - nothing at all, when the request never reached the server
 *
 * `t` is optional so call sites that genuinely have no translation function in
 * scope still get something back, but every real call site should pass one —
 * without it, a matched message is returned in English regardless of the
 * page's language.
 */
export function getErrorMessage(err, fallback, t) {
  const translateOrRaw = (msg) => (t ? translate(msg, t) : msg);

  if (err?.code === "ERR_NETWORK") {
    return t ? t("apiError.networkUnreachable") : "Cannot reach the server. Is the API running?";
  }

  const status = err?.response?.status;

  // The rate limiter answers with an empty body, so there is no message to map.
  if (status === 429) {
    return t ? t("apiError.rateLimited") : "Too many attempts. Wait a minute and try again.";
  }

  // A 500 carries the exception handler's generic English ProblemDetails
  // title, which is no more use to a reader than the translated generic line.
  if (status >= 500) {
    return fallback ?? (t ? t("apiError.generic") : "Something went wrong. Please try again.");
  }

  const data = err?.response?.data;
  if (!data) return fallback ?? (t ? t("apiError.generic") : "Something went wrong. Please try again.");

  if (typeof data === "string") return translateOrRaw(data);

  // { errors: { Email: ["The Email field is not a valid e-mail address."] } }
  // These come from ASP.NET's own model validation and aren't in the map
  // above — the server's own wording, not ours to translate here.
  if (data.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors).flat();
    if (messages.length) return messages.join(" ");
  }

  return data.title || (fallback ?? (t ? t("apiError.generic") : "Something went wrong. Please try again."));
}
