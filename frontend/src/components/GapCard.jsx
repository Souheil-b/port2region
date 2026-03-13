import PropTypes from "prop-types"
import { TrendingUp, MapPin, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { usePremium } from "./PremiumToggle"

const SECTOR_LABELS = {
  transport:   "Transport",
  agroalim:    "Agroalim",
  it:          "IT",
  hospitality: "Hôtellerie",
  btp:         "BTP",
  maintenance: "Maintenance",
}

export default function GapCard({ gap }) {
  const navigate = useNavigate()
  const isPremium = usePremium()
  const role = localStorage.getItem("port2region_role")
  const canAccessNeed = isPremium && role === "investisseur" && gap.need_id

  return (
    <div
      className={`card p-5 border-l-4 border-l-warning ${canAccessNeed ? "cursor-pointer hover:shadow-md hover:border-brand/30 transition-all" : ""}`}
      onClick={canAccessNeed ? () => navigate(`/needs/${gap.need_id}`) : undefined}
    >
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-success" />
            <span className="text-sm font-bold text-success">{gap.estimated_potential}</span>
          </div>
          {canAccessNeed && (
            <span className="flex items-center gap-1 text-xs text-brand font-semibold ml-2">
              Voir le besoin <ArrowRight size={12} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

GapCard.propTypes = { gap: PropTypes.object.isRequired }
