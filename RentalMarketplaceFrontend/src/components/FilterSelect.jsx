import { useEffect, useMemo, useRef, useState } from "react";

/**
 * A dropdown that is actually ours.
 *
 * Native <select> and <datalist> popups are drawn by the browser, not by CSS —
 * they ignore the design, they render differently in every browser, and Chrome
 * was drawing the datalist dark while the selects beside it were light. Two
 * controls doing the same job cannot be made to match while either is native.
 *
 * So the list is a plain element we style: one line per option, a max height,
 * and an optional search box for the long ones. The trade is that the keyboard
 * and screen-reader behaviour a native select gives free has to be written —
 * which is what the roles, aria-* attributes and key handling below are for.
 */
import { useTranslation } from "react-i18next";

export default function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Any",
  searchable = false,
  // The hero search has no room for a caption above each control, but the
  // control still has to be named for anyone not reading the screen.
  hideLabel = false,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);

  const root = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const all = useMemo(
    () => [{ value: "", label: placeholder }, ...options],
    [options, placeholder]
  );

  const shown = useMemo(() => {
    if (!searchable || !query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter((o) => o.label.toLowerCase().includes(q));
  }, [all, query, searchable]);

  const selected = all.find((o) => o.value === value);

  // Close on an outside click or Escape, the two things a native popup does
  // that people expect without thinking about it.
  useEffect(() => {
    if (!open) return;

    function onDown(e) {
      if (root.current && !root.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") { setOpen(false); root.current?.querySelector(".fs-btn")?.focus(); }
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(Math.max(0, shown.findIndex((o) => o.value === value)));

    // Open upwards when there is not enough room below. A dropdown near the
    // bottom of a short window would otherwise run off the screen, and its
    // last options would be unreachable.
    const box = root.current?.getBoundingClientRect();
    if (box) {
      const below = window.innerHeight - box.bottom;
      setUp(below < 300 && box.top > below);
    }

    if (searchable) searchRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function pick(option) {
    onChange(option.value);
    setOpen(false);
    root.current?.querySelector(".fs-btn")?.focus();
  }

  function onKeyDown(e) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, shown.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); if (shown[active]) pick(shown[active]); }
  }

  return (
    <div className="fs" ref={root} onKeyDown={onKeyDown}>
      {!hideLabel && <label className="filter-label" htmlFor={id}>{label}</label>}

      <button
        id={id}
        type="button"
        className={value ? "fs-btn has-value" : "fs-btn"}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={hideLabel ? label : undefined}
      >
        <span className="fs-value">{selected ? selected.label : placeholder}</span>
        <span className="fs-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className={up ? "fs-pop up" : "fs-pop"}>
          {searchable && (
            <input
              ref={searchRef}
              className="fs-search"
              type="text"
              placeholder={`Search ${label.toLowerCase()}…`}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              aria-label={`Search ${label}`}
            />
          )}

          <ul className="fs-list" role="listbox" ref={listRef} aria-label={label}>
            {shown.length === 0 && <li className="fs-empty">{t("select.noMatch")}</li>}

            {shown.map((o, i) => (
              <li key={o.value || "any"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === value}
                  className={
                    "fs-opt" +
                    (o.value === value ? " selected" : "") +
                    (i === active ? " active" : "")
                  }
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o)}
                >
                  <span>{o.label}</span>
                  {/* The hint sits on the same line, not under it — the native
                      datalist put it on a second row and made a 12-item list
                      taller than the window. */}
                  {o.hint && <span className="fs-hint">{o.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
