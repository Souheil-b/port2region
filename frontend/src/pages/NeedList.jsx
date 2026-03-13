import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import PropTypes from "prop-types"
import { FileText, MapPin, Clock, ChevronRight, Users } from "lucide-react"
import { needsApi, applicationsApi } from "../api/client"
import TagBadge from "../components/TagBadge"
import Pagination from "../components/Pagination"

const PER_PAGE = 8

const STATUS_STYLES = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  matched: "bg-green-50 text-green-700 border-green-200",
  gap: "bg-red-50 text-red-700 border-red-200",
}
const STATUS_LABELS = { open: "Ouvert", matched: "Matché", gap: "Gap" }
const STATUSES = ["Tous", "open", "matched", "gap"]
const STATUS_FILTER_LABELS = { Tous: "Tous", open: "Ouverts", matched: "Matchés", gap: "Gaps" }

function ApplicationsBadge({ count }) {
  if (!count) return null
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-brand bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
      <Users size={10} /> {count} candidature{count !== 1 ? "s" : ""}
    </span>
  )
}

ApplicationsBadge.propTypes = { count: PropTypes.number }

export default function NeedList() {
  const [needs, setNeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("Tous")
  const [applicationCounts, setApplicationCounts] = useState({})
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      needsApi.list(),
      applicationsApi.list(),
    ]).then(([nr, ar]) => {
      setNeeds(nr.data.data || [])
      const appList = ar.data.data || []
      const counts = {}
      appList.forEach((a) => {
        counts[a.need_id] = (counts[a.need_id] || 0) + 1
      })
      setApplicationCounts(counts)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = filter === "Tous" ? needs : needs.filter((n) => n.status === filter)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center">
          <FileText size={18} className="text-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Besoins Publiés</h1>
          <p className="text-xs text-muted">{needs.length} besoin{needs.length !== 1 ? "s" : ""} — port Nador West Med</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === s
                ? "bg-brand text-white border-brand"
                : "bg-white text-slate-600 border-gray-200 hover:border-brand hover:text-brand"
            }`}
          >
            {STATUS_FILTER_LABELS[s]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-muted text-sm">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">Aucun besoin trouvé.</div>
      ) : (
        <div className="space-y-3">
          {paginated.map((need) => (
            <div
              key={need.id}
              className="card p-4 cursor-pointer hover:border-brand/30 transition-colors"
              onClick={() => navigate(`/needs/${need.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-900">{need.title}</span>
                    <span className={`badge border flex-shrink-0 ${STATUS_STYLES[need.status] || STATUS_STYLES.open}`}>
                      {STATUS_LABELS[need.status] || need.status}
                    </span>
                    <ApplicationsBadge count={applicationCounts[need.id]} />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted mb-3">
                    <span className="flex items-center gap-1"><MapPin size={11} />{need.location_zone}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{need.deadline_days} jours</span>
                    <span>Score min : {need.min_score}/100</span>
                    <span className="text-slate-400">par {need.published_by}</span>
                  </div>

                  {need.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {need.tags.slice(0, 4).map((t) => <TagBadge key={t} tag={t} sector="transport" />)}
                      {need.tags.length > 4 && <span className="text-[11px] text-muted">+{need.tags.length - 4}</span>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end justify-between self-stretch">
                  <ChevronRight size={16} className="text-brand" />
                  <span className="text-[11px] text-muted mt-auto">Voir le détail →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onPageChange={setPage} />
    </div>
  )
}
