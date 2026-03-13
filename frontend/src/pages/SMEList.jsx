import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Search, MapPin, Star, ChevronRight } from "lucide-react"
import { smeApi } from "../api/client"
import TagBadge from "../components/TagBadge"
import Pagination from "../components/Pagination"

const PER_PAGE = 9

const SECTORS = ["Tous", "transport", "agroalim", "it", "hospitality", "btp", "maintenance"]
const SECTOR_LABELS = {
  transport: "Transport", agroalim: "Agroalim", it: "IT",
  hospitality: "Hôtellerie", btp: "BTP", maintenance: "Maintenance"
}
const SECTOR_DOT = {
  transport: "bg-blue-500", agroalim: "bg-green-500", it: "bg-violet-500",
  hospitality: "bg-amber-500", btp: "bg-gray-500", maintenance: "bg-cyan-500",
}

export default function SMEList() {
  const navigate = useNavigate()
  const [smes, setSmes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sector, setSector] = useState("Tous")
  const [page, setPage] = useState(1)

  useEffect(() => {
    smeApi.list().then(r => setSmes(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  const filtered = smes.filter(s => {
    const matchSector = sector === "Tous" || s.sector === sector
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase())
    return matchSector && matchSearch
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Users size={18} className="text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">PMEs Inscrites</h1>
          <p className="text-xs text-muted">{smes.length} entreprise{smes.length !== 1 ? "s" : ""} dans la région Orientale</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            placeholder="Rechercher par nom ou ville…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {SECTORS.map(s => (
            <button
              key={s}
              onClick={() => { setSector(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                sector === s
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-slate-600 border-gray-200 hover:border-brand hover:text-brand"
              }`}
            >
              {s === "Tous" ? "Tous" : SECTOR_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-muted text-sm">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">Aucune PME trouvée.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(sme => (
            <div key={sme.id} className="card p-4 cursor-pointer hover:border-brand hover:shadow-md transition-all group" onClick={() => navigate(`/smes/${sme.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${SECTOR_DOT[sme.sector] || "bg-gray-400"}`} />
                  <span className="text-sm font-semibold text-slate-900 leading-tight">{sme.name}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
                    {SECTOR_LABELS[sme.sector] || sme.sector}
                  </span>
                  <ChevronRight size={13} className="text-muted group-hover:text-brand transition-colors" />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted mb-3">
                <span className="flex items-center gap-1"><MapPin size={11} />{sme.city}</span>
                <span className="flex items-center gap-1">
                  <Star size={11} className="text-amber-400" />
                  {sme.reputation_score}/5
                </span>
                <span>{sme.missions_count} mission{sme.missions_count !== 1 ? "s" : ""}</span>
              </div>

              {sme.capacity_summary && (
                <p className="text-xs text-muted mb-3 leading-relaxed">{sme.capacity_summary}</p>
              )}

              {sme.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sme.tags.slice(0, 3).map(t => <TagBadge key={t} tag={t} sector={sme.sector} />)}
                  {sme.tags.length > 3 && <span className="text-[11px] text-muted">+{sme.tags.length - 3}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onPageChange={setPage} />
    </div>
  )
}
