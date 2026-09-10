import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAdminUsers, grantSubscription, revokeSubscription } from "../../api/subscription";
import { getErrorMessage } from "../../api/errors";
import { formatDay } from "../../utils/date";
import { useToast } from "../../context/ToastContext";
import Pagination, { usePaged } from "../../components/Pagination";

/**
 * FR-9.1.1 — every registered account with its subscription state.
 *
 * A table, and the clearest case for one: thirteen rows of the same five facts,
 * where the whole task is scanning a column. It is also the only admin screen
 * that is not a queue — rows are not consumed, so it keeps a search box and
 * updates in place rather than dropping what you acted on.
 *
 * Three states, not two. "Active" and "none" are obvious; "lapsed" is the one
 * that matters, because a lapsed owner still has listings on the site and is
 * the account most likely to need attention.
 */
export default function AdminUsers() {
  const { t } = useTranslation();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await getAdminUsers());
    } catch (err) {
      setError(getErrorMessage(err, t("admin.couldNotLoadUsers")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  async function act(user, action, failure, success) {
    setBusyId(user.id);
    setError("");
    try {
      await action(user.id);
      // Refetched rather than patched locally: granting changes the expiry the
      // server computed, and guessing it here would drift from what it stored.
      await load();
      toast.success(success);
    } catch (err) {
      const message = getErrorMessage(err, failure);
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  const term = query.trim().toLowerCase();
  const shown = term
    ? users.filter((u) =>
        u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
    : users;

  const state = (u) => (u.isActive ? "active" : u.expiresAt ? "lapsed" : "none");

  // Paged over the filtered list, not the raw one, so searching narrows the
  // pages rather than searching within page one. The count beside the search
  // box stays the count of matches — that is what tells you whether the term
  // found anything.
  const paged = usePaged(shown, 12);

  if (loading) return <p className="muted">{t("admin.loading")}</p>;

  return (
    <>
      {error && <p className="error-text">{error}</p>}

      <div className="admin-toolbar">
        <input
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.searchUsers")}
          aria-label={t("admin.searchUsers")}
        />
        <span className="muted">{t("admin.userCount", { count: shown.length })}</span>
      </div>

      {shown.length === 0 ? (
        <div className="empty-state"><p>{t("admin.noUsersMatch")}</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.user")}</th>
                <th>{t("admin.role")}</th>
                <th>{t("admin.subscription")}</th>
                <th>{t("admin.expires")}</th>
                <th>{t("admin.listings")}</th>
                <th className="admin-table-actions">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paged.items.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="admin-table-strong">{u.fullName}</span>
                    <span className="admin-table-note ltr">{u.email}</span>
                  </td>
                  <td>
                    <span className={u.role === "Admin" ? "badge badge-pending" : "admin-table-muted"}>
                      {u.role === "Admin" ? t("admin.roleAdmin") : t("admin.roleUser")}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${state(u) === "active" ? "approved" : state(u) === "lapsed" ? "rejected" : "completed"}`}>
                      {t(`admin.state_${state(u)}`)}
                    </span>
                  </td>
                  <td className="admin-table-muted">
                    {u.expiresAt ? formatDay(u.expiresAt) : "—"}
                  </td>
                  <td className="admin-table-muted">{u.listingCount}</td>
                  <td className="admin-table-actions">
                    {/* An administrator has no subscription to manage — they
                        cannot publish, so granting one would mean nothing. */}
                    {u.role === "Admin" ? (
                      <span className="admin-table-muted">—</span>
                    ) : (
                      <div className="admin-row-actions">
                        <button
                          type="button" className="btn btn-outline btn-sm"
                          disabled={busyId === u.id}
                          onClick={() => act(u, grantSubscription, t("admin.couldNotGrant"), t("admin.granted", { name: u.fullName }))}
                        >
                          {u.isActive ? t("admin.extend") : t("admin.grant")}
                        </button>
                        {u.isActive && (
                          <button
                            type="button" className="btn btn-outline btn-sm"
                            disabled={busyId === u.id}
                            onClick={() => act(u, revokeSubscription, t("admin.couldNotRevoke"), t("admin.revoked", { name: u.fullName }))}
                          >
                            {t("admin.revoke")}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={paged.page}
        totalPages={paged.totalPages}
        onChange={paged.setPage}
        label={t("admin.tabUsers")}
      />

      <p className="field-hint admin-note">{t("admin.usersNote")}</p>
    </>
  );
}
