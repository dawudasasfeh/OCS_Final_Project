import { useEffect, useMemo, useState } from "react";
import { IconPrev, IconNext } from "./icons";
import { addDays, parseDay, toIso, todayIso } from "../utils/date";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

// Monday-first, which is the working week in Jordan; the keys are resolved in
// the component so the row relabels when the language changes.
const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const MONTH_LABEL = (d) =>
  d.toLocaleDateString(i18n.resolvedLanguage === "ar" ? "ar-JO-u-nu-latn" : "en-GB", { month: "long", year: "numeric" });

/**
 * Builds a lookup of iso day -> why it is unavailable.
 *
 * Intervals are half-open, exactly as they are stored: `from` is the first
 * night, `to` is the checkout day and is NOT occupied. The turnover gap is
 * drawn on both sides because BookingService pads the *requested* range before
 * checking for an overlap, so a start date inside that gap is refused even
 * though nobody is in the property.
 *
 * Occupancy wins over turnover where two intervals are close enough to collide.
 */
export function buildDayMap(booked, turnoverDays) {
  const map = new Map();

  for (const interval of booked) {
    const from = parseDay(interval.from);
    const to = parseDay(interval.to);
    const state = interval.status === "Pending" ? "pending" : "confirmed";

    for (let d = addDays(from, -turnoverDays); d < from; d = addDays(d, 1)) {
      if (!map.has(toIso(d))) map.set(toIso(d), "turnover");
    }
    for (let d = addDays(to, 0); d < addDays(to, turnoverDays); d = addDays(d, 1)) {
      if (!map.has(toIso(d))) map.set(toIso(d), "turnover");
    }
    for (let d = from; d < to; d = addDays(d, 1)) {
      map.set(toIso(d), state);
    }
  }

  return map;
}

/**
 * The first day from `fromIso` that is neither occupied nor inside a turnover
 * gap. The booking form defaults to today, which on a busy listing is often
 * unbookable — landing on a red error before the renter has touched anything
 * reads as the app being broken rather than the date being taken.
 *
 * Falls back to `fromIso` if the listing is solidly booked for a year, in which
 * case the clash message is the honest answer.
 */
export function firstFreeDay(booked, turnoverDays, fromIso, horizonDays = 365) {
  const blocked = buildDayMap(booked, turnoverDays);
  let d = parseDay(fromIso);

  for (let i = 0; i < horizonDays; i++) {
    const iso = toIso(d);
    if (!blocked.has(iso)) return iso;
    d = addDays(d, 1);
  }
  return fromIso;
}

export default function AvailabilityCalendar({
  booked = [],
  turnoverDays = 0,
  value,
  onChange,
}) {
  const { t } = useTranslation();
  const today = todayIso();
  const [cursor, setCursor] = useState(() => {
    const d = value ? parseDay(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // The cursor is seeded once, so when the selected date is moved from outside
  // — the form skipping forward to the first date a stay actually fits — the
  // grid would stay on the old month with nothing highlighted. Follow it.
  useEffect(() => {
    if (!value) return;
    const d = parseDay(value);
    setCursor((c) =>
      c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
        ? c
        : new Date(d.getFullYear(), d.getMonth(), 1)
    );
  }, [value]);

  const dayMap = useMemo(
    () => buildDayMap(booked, turnoverDays),
    [booked, turnoverDays]
  );

  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

    // getDay() is Sunday-first; shift so Monday is column 0.
    const lead = (first.getDay() + 6) % 7;

    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const out = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cursor]);

  const shift = (n) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));

  // Never let the user page back past the current month — those dates are
  // unbookable anyway.
  const atFloor =
    cursor.getFullYear() === new Date().getFullYear() &&
    cursor.getMonth() === new Date().getMonth();

  return (
    <div className="cal">
      <div className="cal-head">
        <button
          type="button"
          className="cal-nav"
          onClick={() => shift(-1)}
          disabled={atFloor}
          aria-label={t("calendar.prevMonth")}
        >
          <IconPrev size={17} />
        </button>
        <span className="cal-month">{MONTH_LABEL(cursor)}</span>
        <button
          type="button"
          className="cal-nav"
          onClick={() => shift(1)}
          aria-label={t("calendar.nextMonth")}
        >
          <IconNext size={17} />
        </button>
      </div>

      <div className="cal-grid cal-weekdays">
        {WEEKDAY_KEYS.map((w) => (
          <span key={w} className="cal-weekday">{t(`calendar.${w}`)}</span>
        ))}
      </div>

      <div className="cal-grid">
        {weeks.flat().map((date, i) => {
          if (!date) return <span key={i} className="cal-day cal-blank" />;

          const iso = toIso(date);
          const state = dayMap.get(iso);
          const isPast = iso < today;
          const isSelected = iso === value;
          const blocked = isPast || !!state;

          const classes = ["cal-day"];
          if (state) classes.push(`cal-${state}`);
          if (isPast) classes.push("cal-past");
          if (isSelected) classes.push("cal-selected");

          return (
            <button
              key={iso}
              type="button"
              className={classes.join(" ")}
              disabled={blocked}
              aria-pressed={isSelected}
              title={
                state === "turnover"
                  ? t("calendar.turnoverGap", { count: turnoverDays })
                  : state
                    ? state === "pending" ? t("calendar.requestedBySomeoneElse") : t("calendar.booked")
                    : undefined
              }
              onClick={() => onChange?.(iso)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span><i className="cal-key cal-confirmed" /> {t("calendar.booked")}</span>
        <span><i className="cal-key cal-pending" /> {t("calendar.legendRequested")}</span>
        {turnoverDays > 0 && <span><i className="cal-key cal-turnover" /> {t("calendar.legendTurnover")}</span>}
      </div>
    </div>
  );
}
