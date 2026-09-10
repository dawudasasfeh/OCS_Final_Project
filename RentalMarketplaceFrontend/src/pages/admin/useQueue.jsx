import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../../api/errors";
import { useToast } from "../../context/ToastContext";
import Pagination, { usePaged } from "../../components/Pagination";

/**
 * Three of the four admin screens are the same shape: fetch a pending list, act
 * on one row, drop that row. Only the loader, the actions and the body differ,
 * so they are passed in rather than written three times.
 */
export function useQueue(load, onChanged, pageSize = 8) {
  const toast = useToast();
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await load());
    } catch (err) {
      setError(getErrorMessage(err, t("admin.couldNotLoadQueue")));
    } finally {
      setLoading(false);
    }
  }, [load, t]);

  useEffect(() => { refresh(); }, [refresh]);

  // Acting on a row always removes it from a pending queue, whichever way the
  // decision went — it is no longer pending.
  async function decide(id, action, failure, success) {
    setError("");
    setBusyId(id);
    try {
      await action(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      // The row vanishing is the only other feedback, and on a queue of one
      // that just looks like the list emptied for no reason.
      toast.success(success);
      onChanged?.();
    } catch (err) {
      const message = getErrorMessage(err, failure);
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  // Paged here rather than in each screen, so the three queues cannot drift
  // apart. The clamp inside usePaged is what makes this safe on a queue:
  // approving the last listing on page 3 removes page 3, and without the
  // clamp the admin would be left staring at an empty screen with a full
  // backlog behind it.
  const paged = usePaged(items, pageSize);

  return { items, paged, loading, error, busyId, decide, refresh };
}

/** Loading, error and empty states, so each screen only writes its rows. */
export function QueueSection({ queue, empty, children, layout = "list", label, note }) {
  const { t } = useTranslation();
  if (queue.loading) return <p className="muted">{t("admin.loading")}</p>;

  return (
    <>
      {queue.error && <p className="error-text">{queue.error}</p>}
      {queue.items.length === 0
        ? <div className="empty-state"><p>{empty}</p></div>
        : (
          <>
            <div className={layout === "table" ? "admin-table-wrap" : "booking-list"}>{children}</div>

            {/* Its own slot rather than another child, because children go
                inside the wrapper — and .admin-table-wrap is a bordered box
                that scrolls sideways. A hint placed in there sits under the
                last row inside the table frame and slides off with it. */}
            {note && <p className="field-hint admin-note">{note}</p>}
            <Pagination
              page={queue.paged.page}
              totalPages={queue.paged.totalPages}
              onChange={queue.paged.setPage}
              label={label}
            />
          </>
        )}
    </>
  );
}
