import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getPendingTestimonials,
  approveTestimonial,
  rejectTestimonial,
} from "../../api/testimonials";
import { formatDay } from "../../utils/date";
import { useQueue, QueueSection } from "./useQueue";

/**
 * Cards, not a table — you are reading prose to decide whether it is genuine.
 * A testimonial squeezed into a table cell would be truncated, and truncated is
 * exactly the state in which you cannot judge it.
 */
export default function AdminTestimonials() {
  const { t } = useTranslation();
  const { refreshCounts } = useOutletContext();
  const queue = useQueue(getPendingTestimonials, refreshCounts);

  return (
    <QueueSection queue={queue} empty={t("admin.noTestimonials")}>
      {/* Named item, not t — a map parameter called t would shadow the
          translation function for the whole block. */}
      {queue.items.map((item) => (
        <article className="admin-card" key={item.id}>
          <div className="booking-card-head">
            <span className="booking-title">{item.userName}</span>
            <span className="badge badge-pending">
              {t(`status.${item.status.toLowerCase()}`, { defaultValue: item.status })}
            </span>
          </div>
          <p className="booking-sub">
            {t("admin.written", { date: formatDay(item.createdAt.slice(0, 10)) })}
          </p>

          <blockquote className="admin-quote" dir="auto">{item.content}</blockquote>

          <div className="booking-actions">
            <button
              type="button" className="btn btn-primary"
              disabled={queue.busyId === item.id}
              onClick={() => queue.decide(item.id, approveTestimonial, t("admin.couldNotApproveTestimonial"), t("admin.testimonialPublished"))}
            >
              {t("admin.approve")}
            </button>
            <button
              type="button" className="btn btn-outline"
              disabled={queue.busyId === item.id}
              onClick={() => queue.decide(item.id, rejectTestimonial, t("admin.couldNotRejectTestimonial"), t("admin.testimonialRejected"))}
            >
              {t("admin.reject")}
            </button>
          </div>
        </article>
      ))}
    </QueueSection>
  );
}
