import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Building2, MapPin, Star, Briefcase, Loader2, ArrowLeft, FileText } from "lucide-react"
import { smeApi } from "../api/client"
import TagBadge from "../components/TagBadge"

const SECTOR_LABELS = {
  transport:   "Transport & Logistique",
  agroalim:    "Agroalimentaire",
  it:          "IT & Numérique",
  hospitality: "Hôtellerie & Restauration",
  btp:         "BTP & Construction",
  maintenance: "Maintenance Industrielle",
}

function StarRating({ score }) {
  const full = Math.floor(score)
  const half = score % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={14}
          className={i <= full ? "text-amber-400 fill-amber-400" : i === full + 1 && half ? "text-amber-400 fill-amber-200" : "text-gray-200 fill-gray-200"}
        />
      ))}
      <span className="text-xs font-bold text-slate-700 ml-1">{score.toFixed(1)}/5</span>
    </div>
  )
}

export default function SMEProfile() {
  const { sme_id } = useParams()
  const navigate = useNavigate()
  const [sme, setSme] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    smeApi.get(sme_id)
      .then(r => setSme(r.data.data))
      .catch(() => setError("PME introuvable"))
      .finally(() => setLoading(false))
  }, [sme_id])

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-muted gap-2">
      <Loader2 size={20} className="animate-spin" /> Chargement…
    </div>
  )

  if (error || !sme) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-sm text-danger font-medium mb-4">{error || "PME introuvable"}</p>
      <button onClick={() => navigate(-1)} className="btn-primary text-xs">← Retour</button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-muted hover:text-brand mb-6 transition-colors">
        <ArrowLeft size={13} /> Retour
      </button>

      {/* Hero card */}
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
            <Building2 size={22} className="text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{sme.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-muted">
                <MapPin size={11} /> {sme.city}
              </span>
              <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                {SECTOR_LABELS[sme.sector] || sme.sector}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-muted mb-1 flex items-center justify-center gap-1"><Briefcase size={11} /> Missions réalisées</p>
            <p className="text-2xl font-bold text-slate-900">{sme.missions_count ?? 0}</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-muted mb-2 flex items-center justify-center gap-1"><Star size={11} /> Réputation</p>
            <StarRating score={sme.reputation_score ?? 0} />
          </div>
        </div>
      </div>

      {/* Description */}
      {sme.raw_description && (
        <div className="card p-5 mb-4">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
            <FileText size={13} /> Présentation
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">{sme.raw_description}</p>
        </div>
      )}

      {/* Capacity summary */}
      {sme.capacity_summary && (
        <div className="card p-5 mb-4">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3">⚙️ Capacités opérationnelles</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{sme.capacity_summary}</p>
        </div>
      )}

      {/* Tags */}
      {sme.tags?.length > 0 && (
        <div className="card p-5 mb-4">
          <h2 className="text-xs font-bold text-muted uppercase tracking-wide mb-3">🏷️ Compétences clés</h2>
          <div className="flex flex-wrap gap-2">
            {sme.tags.map(t => <TagBadge key={t} tag={t} sector={sme.sector} size="md" />)}
          </div>
        </div>
      )}

      {/* CTA for Port */}
      {localStorage.getItem("port2region_role") === "port" && (
        <div className="card p-4 border-brand/20 border-2 bg-brand/5">
          <p className="text-xs text-brand font-semibold mb-2">Voir les besoins disponibles pour cette PME</p>
          <Link to="/needs" className="btn-primary text-xs py-1.5 inline-flex">
            <FileText size={12} /> Aller aux besoins
          </Link>
        </div>
      )}
    </div>
  )
}
