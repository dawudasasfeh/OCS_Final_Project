import { useTranslation } from "react-i18next";
import { IconSearch } from "./icons";

/**
 * Tabs and a search box, for the two pages that list bookings.
 *
 * The tabs answer "what needs me?" — browsing, with no target in mind. The box
 * answers "where is that one?" — you have a target and scrolling is the slow
 * way to reach it. Different questions, so both, and the search narrows
 * whichever tab is open rather than replacing it.
 *
 * The counts are the half of a tab that carries information when nobody clicks
 * it: "Awaiting reply 0" says there is nothing outstanding without opening
 * anything. They are counted after the search, not before — a tab reading
 * "Confirmed 4" over a search that matched one of them would be counting rows
 * the reader cannot see.
 */
export default function ListToolbar({
  tabs, tab, onTab, counts, query, onQuery, placeholder, label,
}) {
  const { t } = useTranslation();

  return (
    <div className="list-toolbar">
      <div className="filter-tabs" role="tablist" aria-label={label}>
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={tab === x.id}
            className={tab === x.id ? "filter-tab active" : "filter-tab"}
            onClick={() => onTab(x.id)}
          >
            {t(x.key)}
            <span className="filter-tab-count">{counts[x.id]}</span>
          </button>
        ))}
      </div>

      <div className="list-search">
        <IconSearch size={16} className="list-search-icon" />
        <input
          type="search"
          className="input"
          value={query}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
