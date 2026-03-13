import PropTypes from "prop-types"
import { MapPin, Clock, ChevronRight } from "lucide-react"
import TagBadge from "./TagBadge"

const STATUS_STYLES = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  matched: "bg-green-50 text-green-700 border-green-200",
  gap: "bg-red-50 text-red-700 border-red-200",
}
const STATUS_LABELS = { open: "Ouvert", matched: "Matché", gap: "Gap" }

export default function NeedCard({ need, onClick }) {
  return (
    <div
      className={`card p-4 ${onClick ? "cursor-pointer hover:border-brand/30" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-semibold text-slate-900 pr-4 leading-snug">{need.title}</span>
        <span className={`badge border flex-shrink-0 ${STATUS_STYLES[need.status] || STATUS_STYLES.open}`}>
          {STATUS_LABELS[need.status] || need.status}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted mb-2">
        <span className="flex items-center gap-1"><MapPin size={11} /> {need.location_zone}</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {need.deadline_days}j</span>
        {onClick && <ChevronRight size={11} className="ml-auto text-brand" />}
      </div>
      {need.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {need.tags.slice(0, 3).map(t => <TagBadge key={t} tag={t} sector="transport" />)}
        </div>
      )}
    </div>
  )
}

NeedCard.propTypes = { need: PropTypes.object.isRequired, onClick: PropTypes.func }
