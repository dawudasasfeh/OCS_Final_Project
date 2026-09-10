import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPendingHouses } from "../../api/houses";
import { getPendingTestimonials } from "../../api/testimonials";
import { getPendingPayments } from "../../api/payments";

const SECTIONS = [
  { to: "listings", labelKey: "admin.tabListings", countKey: "listings" },
  { to: "testimonials", labelKey: "admin.tabTestimonials", countKey: "testimonials" },
  { to: "subscriptions", labelKey: "admin.tabPayments", countKey: "payments" },
  // No badge: the user directory is a reference table, not a queue. A count
  // here would say "13" forever and teach people to ignore the badges.
  { to: "users", labelKey: "admin.tabUsers" },
];

/**
 * The shell for the admin area.
 *
 * Four routes rather than four tabs in one component. Each screen now has its
 * own URL, so an administrator can bookmark the payments queue, open the user
 * list in a second tab, and use the back button — none of which worked when the
 * section was a piece of component state.
 *
 * The counts live here because a badge has to show what is waiting on the
 * screens you are NOT looking at; that is the entire point of it.
 */
export default function AdminLayout() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({});

  // A failed count is left absent rather than shown as zero — "no idea" and
  // "nothing waiting" are different, and only one of them is reassuring.
  const refreshCounts = useCallback(async () => {
    const [listings, testimonials, payments] = await Promise.all([
      getPendingHouses().then((r) => r.length).catch(() => null),
      getPendingTestimonials().then((r) => r.length).catch(() => null),
      getPendingPayments().then((r) => r.length).catch(() => null),
    ]);
    setCounts({ listings, testimonials, payments });
  }, []);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  return (
    <div className="container section">
      <h1 className="page-title">{t("admin.title")}</h1>
      <p className="muted page-sub">{t("admin.sub")}</p>

      <div className="admin-shell">
        <nav className="admin-side" aria-label={t("admin.title")}>
          {SECTIONS.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) => (isActive ? "admin-side-link active" : "admin-side-link")}
            >
              <span>{t(s.labelKey)}</span>
              {s.countKey && counts[s.countKey] > 0 && (
                <span className="admin-side-count">{counts[s.countKey]}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <section className="admin-main">
          {/* Each screen refetches on mount, so acting on a row in one place
              cannot leave a stale queue behind in another. */}
          <Outlet context={{ refreshCounts }} />
        </section>
      </div>
    </div>
  );
}
