import PropTypes from "prop-types"
import { MapPin, Star } from "lucide-react"
import TagBadge from "./TagBadge"
import { formatSector } from "../utils/formatters"

const SECTOR_DOT = {
  transport: "bg-blue-500",
  agroalim: "bg-green-500",
  it: "bg-violet-500",
  hospitality: "bg-amber-500",
  btp: "bg-gray-500",
  maintenance: "bg-cyan-500",
}

export default function SMECard({ sme }) {
  const isAvailable = sme.is_available !== false

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full mt-0.5 ${SECTOR_DOT[sme.sector] || "bg-gray-400"}`} />
          <span className="text-sm font-semibold text-slate-900">{sme.name}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isAvailable ? (
            <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              Disponible
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full inline-block" />
              Indisponible
            </span>
          )}
          <span className="badge bg-gray-50 text-gray-600 border border-gray-200">{formatSector(sme.sector)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted mb-3">
        <span className="flex items-center gap-1"><MapPin size={11} /> {sme.city}</span>
        <span className="flex items-center gap-1"><Star size={11} className="text-warning" /> {sme.reputation_score}/5</span>
      </div>
      {sme.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sme.tags.slice(0, 3).map(t => <TagBadge key={t} tag={t} sector={sme.sector} />)}
          {sme.tags.length > 3 && <span className="text-xs text-muted">+{sme.tags.length - 3}</span>}
        </div>
      )}
    </div>
  )
}

SMECard.propTypes = { sme: PropTypes.object.isRequired }
