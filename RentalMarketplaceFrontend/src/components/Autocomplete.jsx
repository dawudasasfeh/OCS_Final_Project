import { useEffect, useMemo, useRef, useState } from "react";
import { IconClose } from "./icons";

/**
 * A text box you type into, with suggestions under it.
 *
 * Different control from FilterSelect: that one is a button that opens a list,
 * and any searching happens inside the popup. Here the field itself is the
 * input, so typing starts immediately and the list narrows as you go — which is
 * what a search bar should do.
 *
 * The typed text and the committed value are kept apart on purpose. Half a word
 * is a filter, not an answer, so `onChange` only fires for a real option. If
 * the box is left holding text that matches nothing, it reverts to whatever was
 * last chosen rather than sitting there implying a selection that was never
 * made.
 */
import { useTranslation } from "react-i18next";

export default function Autocomplete({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "",
  // Was hardcoded to "no matching city" inside a component that is now also
  // the neighbourhood picker. A shared control must not know what it is
  // listing.
  emptyText,
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const root = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  // Follow the committed value when it changes from outside — clearing a
  // filter elsewhere has to empty the box too.
  useEffect(() => { setText(selected ? selected.label : ""); }, [selected]);

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, text]);

  function close({ revert = true } = {}) {
    setOpen(false);
    // Leaving "Amm" in the box would imply a selection that was never made.
    if (revert) setText(selected ? selected.label : "");
  }

  function pick(option) {
    onChange(option.value);
    setText(option.label);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (root.current && !root.current.contains(e.target)) close();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  });

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(0); return; }
      setActive((i) => Math.min(i + 1, matches.length - 1));
    }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") {
      // Only swallow the Enter if it is choosing a suggestion; otherwise let it
      // submit the search form it sits in.
      if (open && matches[active]) { e.preventDefault(); pick(matches[active]); }
    }
    if (e.key === "Escape") { e.stopPropagation(); close(); }
  }

  return (
    <div className="ac" ref={root}>
      <input
        id={id}
        className="input ac-input"
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={open}
        role="combobox"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(0);
          // Typing over a chosen city drops it until another is picked, so the
          // box and the search can never disagree.
          if (value) onChange("");
        }}
        onFocus={() => { setOpen(true); setActive(0); }}
        onKeyDown={onKeyDown}
      />

      {value && (
        <button
          type="button"
          className="ac-clear"
          aria-label={t("common.clearField", { label })}
          onClick={() => { onChange(""); setText(""); setOpen(false); }}
        >
          <IconClose size={15} />
        </button>
      )}

      {open && (
        <div className="fs-pop ac-pop">
          <ul className="fs-list" role="listbox" ref={listRef} aria-label={label}>
            {matches.length === 0 && <li className="fs-empty">{emptyText ?? t("select.noMatch")}</li>}

            {matches.map((o, i) => (
              <li key={o.value}>
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
                  // mousedown, because the input's blur would otherwise close
                  // the list before the click landed.
                  onMouseDown={(e) => { e.preventDefault(); pick(o); }}
                >
                  <span>{o.label}</span>
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
