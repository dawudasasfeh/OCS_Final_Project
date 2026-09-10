import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Which page numbers to draw.
 *
 * Seven or fewer are all shown. Past that the ends are pinned and the current
 * page keeps a neighbour either side, with a gap marking what was left out —
 * so the control is a fixed width whether there are eight pages or eight
 * hundred, and page 1 is always one click away.
 */
function window_(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const out = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) out.push("gap-start");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("gap-end");

  out.push(total);
  return out;
}

/**
 * Slices a list the browser already holds.
 *
 * For lists that are bounded by what one person owns — their listings, their
 * bookings, their saved properties — where the request was always going to
 * return the lot and paging is about the screen, not the wire. The public
 * search does NOT use this: it is paged at the database.
 *
 * The clamp is the part that matters. Rejecting the last booking on page 3
 * leaves three pages' worth of state pointing at a page that no longer exists,
 * and the honest result of that is an empty screen with no way back.
 */
export function usePaged(items, pageSize) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safe = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safe) setPage(safe);
  }, [page, safe]);

  const slice = useMemo(
    () => items.slice((safe - 1) * pageSize, safe * pageSize),
    [items, safe, pageSize]
  );

  return { items: slice, page: safe, totalPages, setPage, total: items.length };
}

/** A chevron drawn rather than typed, so it flips with the reading direction. */
function Chevron({ back }) {
  return (
    <svg
      className={back ? "pager-chevron back" : "pager-chevron"}
      viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"
    >
      <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor"
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * One pager for the whole site, whether the pages come from the server or from
 * a slice in the browser.
 *
 * It renders nothing at one page. A control whose every button is disabled is
 * not information, it is furniture — and on a site that will often have one
 * page of saved properties, it would be furniture on most screens.
 */
export default function Pagination({ page, totalPages, onChange, label }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const go = (n) => {
    const next = Math.min(Math.max(1, n), totalPages);
    if (next !== page) onChange(next);
  };

  return (
    <nav className="pager" aria-label={label || t("pager.label")}>
      <button
        type="button" className="pager-btn pager-step"
        onClick={() => go(page - 1)} disabled={page === 1}
        aria-label={t("pager.previousPage")}
      >
        <Chevron back />
        <span className="pager-step-text">{t("pager.prev")}</span>
      </button>

      {/* Numbers on a laptop, "3 / 9" on a phone. Nine tap targets do not fit
          across 320px without becoming too small to hit. */}
      <ul className="pager-list">
        {window_(page, totalPages).map((p) =>
          typeof p === "string" ? (
            <li key={p} className="pager-gap" aria-hidden="true">…</li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={p === page ? "pager-btn pager-num active" : "pager-btn pager-num"}
                onClick={() => go(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={t("pager.goTo", { n: p })}
              >
                {p}
              </button>
            </li>
          )
        )}
      </ul>

      <span className="pager-compact" aria-hidden="true">
        {t("pager.of", { page, total: totalPages })}
      </span>

      <button
        type="button" className="pager-btn pager-step"
        onClick={() => go(page + 1)} disabled={page === totalPages}
        aria-label={t("pager.nextPage")}
      >
        <span className="pager-step-text">{t("pager.next")}</span>
        <Chevron />
      </button>
    </nav>
  );
}
