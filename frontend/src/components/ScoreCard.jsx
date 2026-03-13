import { useState } from "react"
import PropTypes from "prop-types"
import { MapPin, ChevronDown, ChevronUp, Bell } from "lucide-react"
import toast from "react-hot-toast"
import TagBadge from "./TagBadge"
import ScoreBreakdown from "./ScoreBreakdown"

function ScoreBar({ score }) {
  const color = score >= 70 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-danger"
  const textColor = score >= 70 ? "text-success" : score >= 50 ? "text-warning" : "text-danger"
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums ${textColor}`}>{score}/100</span>
    </div>
  )
}

export default function ScoreCard({ sme, matchResult, onNotify }) {
  const [open, setOpen] = useState(false)
  const handleNotify = (e) => {
    e.stopPropagation()
    onNotify?.()
    toast.success(`Notification envoyée à ${sme.name}`)
  }
  return (
    <div className="card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-slate-900">{sme.name}</span>
              <span className="badge bg-gray-50 text-gray-600 border border-gray-200 text-[11px]">{sme.sector}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted">
              <MapPin size={11} /> {sme.city}
            </div>
          </div>
          <button
            onClick={handleNotify}
            className="flex-shrink-0 p-1.5 rounded-lg text-muted hover:text-brand hover:bg-blue-50 transition-colors"
          >
            <Bell size={14} />
          </button>
        </div>
        <ScoreBar score={matchResult.total_score} />
        {sme.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {sme.tags.slice(0, 4).map(t => <TagBadge key={t} tag={t} sector={sme.sector} />)}
          </div>
        )}
      </div>
      <div className="border-t border-gray-100">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted hover:text-slate-800 hover:bg-gray-50 transition-colors"
        >
          <span>{open ? "Masquer le détail" : "Voir le détail du score"}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {open && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <ScoreBreakdown
              breakdown={matchResult.score_breakdown}
              justification={matchResult.justification}
            />
          </div>
        )}
      </div>
    </div>
  )
}

ScoreCard.propTypes = {
  sme: PropTypes.object.isRequired,
  matchResult: PropTypes.object.isRequired,
  onNotify: PropTypes.func,
}

ScoreBar.propTypes = { score: PropTypes.number.isRequired }
