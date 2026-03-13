import PropTypes from "prop-types"
import { TrendingUp, MapPin } from "lucide-react"

const SECTOR_LABELS = {
  transport: "Transport",
  agroalim: "Agroalim",
  it: "IT",
  hospitality: "Hôtellerie",
  btp: "BTP",
  maintenance: "Maintenance",
}

export default function GapCard({ gap }) {
  return (
    <div className="card p-5 border-l-4 border-l-warning">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-bold text-slate-900 leading-snug">{gap.title}</span>
        <span className="badge bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0 ml-2">
          {SECTOR_LABELS[gap.sector] || gap.sector}
        </span>
      </div>
      <p className="text-xs text-muted leading-relaxed mb-4">{gap.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted">
          <MapPin size={11} /> {gap.target_region}
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-success" />
          <span className="text-sm font-bold text-success">{gap.estimated_potential}</span>
        </div>
      </div>
    </div>
  )
}

GapCard.propTypes = { gap: PropTypes.object.isRequired }
