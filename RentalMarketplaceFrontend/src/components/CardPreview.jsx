import "./CardPreview.css";

/**
 * Splits card number into groups of 4 digits, padding un-typed groups
 * or remaining digits in a group with placeholder bullets ("•").
 */
function formatCardGroups(number) {
  const digits = (number || "").replace(/\D/g, "");
  const groups = [];
  const count = Math.max(4, Math.ceil(digits.length / 4));
  for (let i = 0; i < count; i++) {
    const chunk = digits.slice(i * 4, (i + 1) * 4);
    if (i < 4) {
      groups.push(chunk ? chunk.padEnd(4, "•") : "••••");
    } else if (chunk) {
      groups.push(chunk);
    }
  }
  return groups;
}

/**
 * Formats expiry date to "MM/YY", padding partial entries with bullets ("•")
 * and falling back to "••/••" when empty.
 */
function formatExpiry(expiry) {
  if (!expiry || !expiry.trim()) return "••/••";
  const clean = expiry.replace(/\s/g, "");
  const [mPart = "", yPart = ""] = clean.split("/");
  const mm = mPart.slice(0, 2);
  const yy = yPart.slice(0, 2);
  const paddedMm = mm ? mm.padEnd(2, "•") : "••";
  const paddedYy = yy ? yy.padEnd(2, "•") : "••";
  return `${paddedMm}/${paddedYy}`;
}

/**
 * Formats CVC digits, padding up to 3 places with bullets (e.g. "12•"),
 * falling back to "•••" when empty.
 */
function formatCvc(cvc) {
  const digits = (cvc || "").replace(/\D/g, "");
  if (!digits) return "•••";
  if (digits.length < 3) {
    return digits.padEnd(3, "•");
  }
  return digits;
}

/**
 * Optional polish: identifies generic network style by leading digit
 * using only Beytak's brand palette.
 */
function getCardBrand(number) {
  const digits = (number || "").replace(/\D/g, "");
  if (digits.startsWith("4")) return "visa";
  if (digits.startsWith("5")) return "mastercard";
  if (digits.startsWith("3")) return "amex";
  return "generic";
}

/**
 * Pure presentational credit card preview component.
 */
export default function CardPreview({
  number = "",
  name = "",
  expiry = "",
  cvc = "",
  flipped = false,
}) {
  const groups = formatCardGroups(number);
  const displayExpiry = formatExpiry(expiry);
  const displayCvc = formatCvc(cvc);
  const brand = getCardBrand(number);
  const displayName = name && name.trim() ? name.trim().toUpperCase() : "YOUR NAME";
  const isPlaceholderName = !name || !name.trim();

  return (
    <div className="card-preview-wrapper" aria-hidden="true">
      <div className={`card-preview ${flipped ? "is-flipped" : ""}`}>
        {/* Front Face */}
        <div className="card-preview-face card-preview-front">
          <div className="card-preview-top">
            <div className="card-preview-chip">
              <span className="card-preview-chip-inner" />
              <span className="card-preview-chip-line horizontal" />
              <span className="card-preview-chip-line vertical" />
            </div>
          </div>

          <div className="card-preview-number ltr">
            {groups.map((group, gIdx) => (
              <span key={gIdx} className="card-preview-group">
                {group.split("").map((ch, cIdx) => (
                  <span
                    key={cIdx}
                    className={ch === "•" ? "card-preview-bullet" : "card-preview-digit"}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </div>

          <div className="card-preview-footer">
            <div className="card-preview-col-name">
              <span className="card-preview-label">CARDHOLDER</span>
              <span className={`card-preview-name ${isPlaceholderName ? "is-muted" : ""}`}>
                {displayName}
              </span>
            </div>

            <div className="card-preview-col-end">
              <div className="card-preview-col-expiry">
                <span className="card-preview-label">VALID</span>
                <span className="card-preview-expiry ltr">{displayExpiry}</span>
              </div>

              <div className="card-preview-brand" data-brand={brand}>
                <span className="card-preview-circle circle-1" />
                <span className="card-preview-circle circle-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div className="card-preview-face card-preview-back">
          <div className="card-preview-magstripe" />
          <div className="card-preview-back-body">
            <div className="card-preview-signature-row">
              <div className="card-preview-signature-strip">
                <div className="card-preview-cvc-box ltr">
                  {displayCvc.split("").map((ch, idx) => (
                    <span
                      key={idx}
                      className={ch === "•" ? "card-preview-bullet-cvc" : "card-preview-digit-cvc"}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card-preview-back-footer">
              <div className="card-preview-back-holo" />
              <span className="card-preview-back-hint">AUTHORIZED SIGNATURE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
