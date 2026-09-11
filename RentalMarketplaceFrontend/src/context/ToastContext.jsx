import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const ToastContext = createContext(null);

const LIFETIME = 4500;

// Window in which an identical message is treated as a repeat rather than a
// second event worth showing.
const DEDUPE_MS = 800;

export function ToastProvider({ children }) {
  // Named tr, not t: the toast map below already binds t to each toast, and a
  // translation function called t would be shadowed inside that block.
  const { t: tr } = useTranslation();
  const [toasts, setToasts] = useState([]);
  // Timers are kept so a manually dismissed toast does not leave one running,
  // and so they can all be dropped if the provider unmounts.
  const timers = useRef(new Map());
  // Last time each tone|message pair was raised, for the dedupe check below.
  const recent = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((tone, message) => {
    if (!message) return;

    // Collapse an identical message raised again within a moment. React's
    // StrictMode replays parts of the render path in development, and a
    // double-clicked button would stack copies in production — neither is
    // worth showing twice.
    //
    // The check lives here rather than inside the setToasts updater because an
    // updater must stay pure: StrictMode invokes it twice, so creating ids and
    // timers in there would leak one of each.
    const key = `${tone}|${message}`;
    const last = recent.current.get(key);
    if (last && Date.now() - last < DEDUPE_MS) return;
    recent.current.set(key, Date.now());

    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, tone, message }]);
    timers.current.set(id, setTimeout(() => dismiss(id), LIFETIME));
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* aria-live so a screen reader announces the message without the focus
          moving; errors are assertive because they usually mean something the
          user just tried did not happen. */}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.tone}`}
            role={t.tone === "error" ? "alert" : "status"}
          >
            <span className="toast-text">{t.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(t.id)}
              aria-label={tr("common.dismiss")}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a ToastProvider");
  return ctx;
}
