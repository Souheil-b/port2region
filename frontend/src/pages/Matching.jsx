import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Zap, Loader2, AlertTriangle, TrendingUp, ChevronLeft } from "lucide-react"
import toast from "react-hot-toast"
import { needsApi, matchingApi, smeApi } from "../api/client"
import ScoreCard from "../components/ScoreCard"
import TagBadge from "../components/TagBadge"

const STATUS_STYLES = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  matched: "bg-green-50 text-green-700 border-green-200",
  gap: "bg-red-50 text-red-700 border-red-200",
}
const STATUS_LABELS = { open: "Ouvert", matched: "Matché", gap: "Gap" }

export default function Matching() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [needs, setNeeds] = useState([])
  const [smes, setSmes] = useState([])
  const [selectedNeedId, setSelectedNeedId] = useState(searchParams.get("need") || "")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [hasRun, setHasRun] = useState(false)
  const [showAll, setShowAll] = useState(true)

  useEffect(() => {
    Promise.all([needsApi.list(), smeApi.list()]).then(([nr, sr]) => {
      setNeeds(nr.data.data || [])
      setSmes(sr.data.data || [])
    })
  }, [])

  useEffect(() => {
    const id = searchParams.get("need")
    if (id && !hasRun) {
      setSelectedNeedId(id)
      runMatching(id)
    }
  }, [searchParams, needs])

  const selectedNeed = needs.find((n) => n.id === selectedNeedId)

  async function runMatching(needId) {
    const id = needId || selectedNeedId
    if (!id) {
      toast.error("Sélectionnez un besoin d'abord.")
      return
    }
    setLoading(true)
    setResults(null)
    try {
      const res = await matchingApi.runForNeed(id)
      setResults(res.data.data)
      setHasRun(true)
      const data = res.data.data
      if (data.is_gap) {
        toast("Aucun prestataire qualifié — gap détecté", { icon: "⚠️" })
      } else {
        toast.success(`${data.total_matches} PME${data.total_matches !== 1 ? "s" : ""} qualifiée${data.total_matches !== 1 ? "s" : ""} trouvée${data.total_matches !== 1 ? "s" : ""}`)
      }
    } catch {
      toast.error("Erreur lors du matching.")
    } finally {
      setLoading(false)
    }
  }

  function handleNeedChange(e) {
    setSelectedNeedId(e.target.value)
    setResults(null)
    setHasRun(false)
  }

  const minScore = selectedNeed?.min_score ?? 60
  const allResults = results?.all_results || results?.matches || []
  const displayedResults = showAll ? allResults : allResults.filter((r) => r.total_score >= minScore)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-muted hover:text-slate-900 hover:bg-gray-100 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <Zap size={18} className="text-brand" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Moteur de Matching</h1>
          <p className="text-xs text-muted">Sélectionnez un besoin pour trouver les PMEs correspondantes</p>
        </div>
      </div>

      {/* Step 1 — Select a need */}
      <div className="card p-5 mb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">1 — Choisir un besoin</p>
        <select
          className="input mb-4"
          value={selectedNeedId}
          onChange={handleNeedChange}
        >
          <option value="">Sélectionner un besoin…</option>
          {needs.map((n) => (
            <option key={n.id} value={n.id}>
              {n.title} — {n.location_zone} ({STATUS_LABELS[n.status] || n.status})
            </option>
          ))}
        </select>

        {selectedNeed?.status === "matched" && (
          <div className="flex items-center gap-2 p-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            Ce besoin a déjà une PME acceptée — vous pouvez relancer l&apos;analyse
          </div>
        )}
        {selectedNeed?.status === "gap" && (
          <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            Ce besoin a été identifié comme un gap — aucun prestataire local qualifié
          </div>
        )}

        {selectedNeed && (
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-slate-900">{selectedNeed.title}</span>
              <span className={`badge border text-[11px] ${STATUS_STYLES[selectedNeed.status] || STATUS_STYLES.open}`}>
                {STATUS_LABELS[selectedNeed.status] || selectedNeed.status}
              </span>
            </div>
            <p className="text-xs text-muted mb-2">{selectedNeed.raw_description}</p>
            <div className="flex items-center gap-4 text-xs text-muted mb-2">
              <span>Zone : <b className="text-slate-700">{selectedNeed.location_zone}</b></span>
              <span>Délai : <b className="text-slate-700">{selectedNeed.deadline_days}j</b></span>
              <span>Score min : <b className="text-slate-700">{selectedNeed.min_score}/100</b></span>
            </div>
            {selectedNeed.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedNeed.tags.map((t) => <TagBadge key={t} tag={t} sector="transport" />)}
              </div>
            )}
          </div>
        )}

        <button
          className="btn-primary w-full justify-center py-2.5"
          onClick={() => runMatching()}
          disabled={!selectedNeedId || loading}
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Matching en cours…</>
            : <><Zap size={15} /> Lancer le Matching</>
          }
        </button>
      </div>

      {/* Step 2 — Results */}
      {(loading || results) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              2 — Résultats
            </p>
            {results && allResults.length > 0 && (
              <button
                className="text-xs text-brand hover:underline"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Qualifiés seulement" : "Afficher tous les résultats"}
              </button>
            )}
          </div>

          {loading && (
            <div className="card p-8 text-center">
              <Loader2 size={28} className="animate-spin text-brand mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">Analyse de {smes.length} PMEs en cours…</p>
              <p className="text-xs text-muted mt-1">L&apos;IA calcule les scores secteur, capacité, localisation et réputation</p>
            </div>
          )}

          {!loading && results && (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-muted">
                  <b className="text-slate-900">{results.total_matches}</b> PME{results.total_matches !== 1 ? "s" : ""} qualifiée{results.total_matches !== 1 ? "s" : ""}
                  {" · "}
                  <b className="text-slate-900">{allResults.length}</b> scorée{allResults.length !== 1 ? "s" : ""} au total
                </span>
                {results.is_gap && (
                  <span className="flex items-center gap-1 text-xs text-warning font-medium ml-auto">
                    <AlertTriangle size={12} /> Gap détecté
                  </span>
                )}
                {!results.is_gap && results.matches?.[0] && (
                  <span className="text-xs text-muted ml-auto">
                    Meilleur score : <b className="text-success">{results.matches[0].total_score}/100</b>
                  </span>
                )}
              </div>

              {/* All scored results */}
              {displayedResults.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {displayedResults.map((m) => {
                    const sme = smes.find((s) => s.id === m.sme_id) || {
                      id: m.sme_id,
                      name: m.sme_id,
                      city: "—",
                      sector: "transport",
                      tags: [],
                    }
                    const isQualified = m.total_score >= minScore
                    return (
                      <div
                        key={`${m.sme_id}-${m.need_id}`}
                        className={`rounded-xl border-2 overflow-hidden ${
                          isQualified ? "border-green-400" : "border-gray-200 opacity-75"
                        }`}
                      >
                        <ScoreCard sme={sme} matchResult={m} />
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Gap state — no qualified SMEs */
                <div className="card p-5 border-l-4 border-l-amber-400 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        Aucune PME locale qualifiée
                      </p>
                      <p className="text-xs text-muted mb-3">
                        Aucune PME n&apos;atteint le score minimum de {selectedNeed?.min_score}/100. Ce secteur représente une opportunité d&apos;investissement.
                      </p>
                      {results.gap && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={13} className="text-warning" />
                            <span className="text-xs font-bold text-amber-800">{results.gap.title}</span>
                          </div>
                          <p className="text-xs text-amber-700 mb-2">{results.gap.description}</p>
                          <span className="text-sm font-bold text-success">{results.gap.estimated_potential}</span>
                        </div>
                      )}
                      <button
                        className="btn-primary mt-3 text-xs py-1.5 px-3"
                        onClick={() => navigate("/dashboard")}
                      >
                        <TrendingUp size={13} /> Voir le Dashboard Investisseur
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                className="btn-secondary text-xs py-1.5"
                onClick={() => { setResults(null); setHasRun(false); setSelectedNeedId("") }}
              >
                ← Choisir un autre besoin
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
