import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPendingPayments, confirmPayment, rejectPayment } from "../../api/payments";
import { formatDay } from "../../utils/date";
import { useQueue, QueueSection } from "./useQueue";

/**
 * A table, unlike listings and testimonials.
 *
 * Confirming a subscription payment is a lookup, not a judgement: you are
 * checking an amount and a reference against something you already have. That
 * is comparison across rows, and a table is the shape for it — one glance down
 * the amount column tells you more than five cards ever would.
 *
 * The reference note is the exception, since it is free text an owner typed,
 * so it gets its own row under the payment rather than a cramped cell.
 */
export default function AdminPayments() {
  const { t } = useTranslation();
  const { refreshCounts } = useOutletContext();
  const queue = useQueue(getPendingPayments, refreshCounts);

  return (
    <QueueSection queue={queue} empty={t("admin.noPayments")} layout="table">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t("admin.payer")}</th>
            <th>{t("admin.amount")}</th>
            <th>{t("admin.method")}</th>
            <th>{t("admin.recorded")}</th>
            <th className="admin-table-actions">{t("admin.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {queue.items.map((p) => (
            <tr key={p.id}>
              <td>
                <span className="admin-table-strong">{p.payerName}</span>
                {p.referenceNote && (
                  <span className="admin-table-note" dir="auto">{p.referenceNote}</span>
                )}
              </td>
              <td className="admin-table-strong">{p.amount} {t("common.jod")}</td>
              <td>{t(`paymentMethod.${p.method}`, { defaultValue: p.method })}</td>
              <td className="admin-table-muted">{formatDay(p.createdAt.slice(0, 10))}</td>
              <td className="admin-table-actions">
                <div className="admin-row-actions">
                  <button
                    type="button" className="btn btn-primary btn-sm"
                    disabled={queue.busyId === p.id}
                    onClick={() => queue.decide(p.id, confirmPayment, t("admin.couldNotConfirmPayment"), t("admin.paymentConfirmed"))}
                  >
                    {t("admin.approve")}
                  </button>
                  <button
                    type="button" className="btn btn-outline btn-sm"
                    disabled={queue.busyId === p.id}
                    onClick={() => queue.decide(p.id, rejectPayment, t("admin.couldNotRejectPayment"), t("admin.paymentRejected"))}
                  >
                    {t("admin.reject")}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Confirming does two things at once, and an admin should know that
          before clicking rather than discover it afterwards. */}
      <p className="field-hint admin-note">{t("admin.confirmingGrantsAny")}</p>
    </QueueSection>
  );
}
