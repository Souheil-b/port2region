import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import PropTypes from "prop-types"
import {
  ChevronLeft, FileText, MapPin, Clock, Loader2, Send,
  Zap, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Lock,
} from "lucide-react"
import toast from "react-hot-toast"
import { needsApi, applicationsApi, matchingApi, smeApi } from "../api/client"
import TagBadge from "../components/TagBadge"
import ScoreCard from "../components/ScoreCard"
import ScoreBreakdown from "../components/ScoreBreakdown"
import PremiumToggle, { usePremium } from "../components/PremiumToggle"

const STATUS_STYLES = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  matched: "bg-green-50 text-green-700 border-green-200",
  gap: "bg-red-50 text-red-700 border-red-200",
}
const STATUS_LABELS = { open: "Ouvert", matched: "Matché", gap: "Gap" }

const APP_STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
}
const APP_STATUS_LABELS = { pending: "En attente", accepted: "Accepté", rejected: "Refusé" }

function ScoreBar({ score }) {
  const color = score >= 70 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-danger"
  const textColor = score >= 70 ? "text-success" : score >= 50 ? "text-warning" : "text-danger"
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums ${textColor}`}>{score}/100</span>
    </div>
  )
}

ScoreBar.propTypes = { score: PropTypes.number.isRequired }

const TABS = [
  { key: "details", label: "Détails" },
  { key: "applications", label: "Candidatures" },
  { key: "matching", label: "Matching IA" },
]

export default function NeedDetail() {
  const { need_id } = useParams()
  const navigate = useNavigate()
  const isPremium = usePremium()
  const role = localStorage.getItem("port2region_role")
  const backLabel =
    role === "port" ? "← Mes Besoins" :
    role === "investisseur" ? "← Besoins Publiés" :
    "← Besoins du Port"

  const [activeTab, setActiveTab] = useState("details")
  const [need, setNeed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [matchResults, setMatchResults] = useState(null)
  const [smes, setSmes] = useState([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [showAll, setShowAll] = useState(true)

  // PME apply state
  const currentPme = (() => { try { return JSON.parse(localStorage.getItem("port2region_current_pme") || "null") } catch { return null } })()
  const [applyMessage, setApplyMessage] = useState("")
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [needRes, appRes, smeRes] = await Promise.all([
        needsApi.get(need_id),
        applicationsApi.list({ need_id }),
        smeApi.list(),
      ])
      setNeed(needRes.data.data)
      setApplications(appRes.data.data || [])
      setSmes(smeRes.data.data || [])
    } catch {
      toast.error("Erreur lors du chargement du besoin.")
    } finally {
      setLoading(false)
    }
  }, [need_id])

  useEffect(() => { loadData() }, [loadData])

  async function runMatching() {
    setMatchLoading(true)
    setMatchResults(null)
    try {
      const res = await matchingApi.runForNeed(need_id)
      const data = res.data.data
      setMatchResults(data)
      if (data.is_gap) {
        toast("Aucun prestataire qualifié — gap détecté", { icon: "⚠️" })
      } else {
        toast.success(`${data.total_matches} PME${data.total_matches !== 1 ? "s" : ""} qualifiée${data.total_matches !== 1 ? "s" : ""} trouvée${data.total_matches !== 1 ? "s" : ""}`)
      }
    } catch {
      toast.error("Erreur lors du matching.")
    } finally {
      setMatchLoading(false)
    }
  }

  async function handleAccept(appId) {
    const app = applications.find((a) => a.id === appId)
    try {
      const res = await applicationsApi.accept(appId)
      setApplications((prev) => prev.map((a) => a.id === appId ? res.data.data : a))
      toast.success(`Notification envoyée à ${app?.sme_name || "la PME"}`)
    } catch {
      toast.error("Erreur lors de l'acceptation.")
    }
  }

  async function handleReject(appId) {
    const app = applications.find((a) => a.id === appId)
    try {
      const res = await applicationsApi.reject(appId)
      setApplications((prev) => prev.map((a) => a.id === appId ? res.data.data : a))
      toast(`Candidature de ${app?.sme_name || "la PME"} refusée.`, { icon: "❌" })
    } catch {
      toast.error("Erreur lors du refus.")
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center gap-3 text-muted">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Chargement…</span>
      </div>
    )
  }

  if (!need) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-muted">Besoin introuvable.</p>
        <button className="btn-secondary mt-4 text-xs" onClick={() => navigate("/needs")}>
          ← Retour aux besoins
        </button>
      </div>
    )
  }

  const minScore = need.min_score ?? 60
  const allResults = matchResults?.all_results || []
  const displayedResults = showAll ? allResults : allResults.filter((r) => r.total_score >= minScore)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/needs")}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted hover:text-slate-900 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={15} />
          {backLabel}
        </button>
        <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{need.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`badge border text-[11px] ${STATUS_STYLES[need.status] || STATUS_STYLES.open}`}>
              {STATUS_LABELS[need.status] || need.status}
            </span>
            <span className="text-xs text-muted flex items-center gap-1">
              <MapPin size={10} /> {need.location_zone}
            </span>
            <span className="text-xs text-muted flex items-center gap-1">
              <Clock size={10} /> {need.deadline_days} jours
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              // Reload applications when switching to that tab
              if (tab.key === "applications") {
                applicationsApi.list({ need_id }).then(r => setApplications(r.data.data || []))
              }
            }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-slate-700"
            }`}
          >
            {tab.label}
            {tab.key === "applications" && applications.length > 0 && (
              <span className="ml-1.5 bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {applications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: Détails */}
      {activeTab === "details" && (
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed">{need.raw_description}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="card p-4">
              <p className="text-[11px] text-muted uppercase tracking-wide mb-1">Score minimum</p>
              <p className="text-xl font-bold text-slate-900">{need.min_score}/100</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-muted uppercase tracking-wide mb-1">Délai</p>
              <p className="text-xl font-bold text-slate-900">{need.deadline_days} j</p>
            </div>
            <div className="card p-4">
              <p className="text-[11px] text-muted uppercase tracking-wide mb-1">Capacité requise</p>
              <p className="text-sm font-semibold text-slate-900 leading-snug">{need.required_capacity || "—"}</p>
            </div>
          </div>
          {need.tags?.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tags requis</p>
              <div className="flex flex-wrap gap-1.5">
                {need.tags.map((t) => <TagBadge key={t} tag={t} sector="transport" />)}
              </div>
            </div>
          )}

          {/* PME: Postuler block */}
          {role === "pme" && currentPme && need.status === "open" && (
            <div className="card p-5 border-brand/30 border-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Postuler à ce besoin</p>
                  <p className="text-xs text-muted mt-0.5">En tant que <strong>{currentPme.name}</strong></p>
                </div>
                {applied ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-success bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 size={13} /> Candidature envoyée
                  </span>
                ) : (
                  <button
                    className="btn-primary text-xs py-1.5 px-3"
                    onClick={() => setApplyOpen((v) => !v)}
                  >
                    <Send size={12} /> {applyOpen ? "Annuler" : "Postuler"}
                  </button>
                )}
              </div>
              {applyOpen && !applied && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setApplying(true)
                    try {
                      const res = await applicationsApi.create({ sme_id: currentPme.id, need_id, message: applyMessage })
                      if (res.data.success) {
                        setApplied(true)
                        setApplyOpen(false)
                        toast.success("Candidature envoyée !")
                      } else {
                        toast.error(res.data.error || "Erreur")
                      }
                    } catch (err) {
                      toast.error(err.response?.data?.error || "Erreur lors de la candidature")
                    } finally {
                      setApplying(false)
                    }
                  }}
                  className="space-y-3 pt-3 border-t border-gray-100"
                >
                  <div>
                    <label className="label">Message de motivation (optionnel)</label>
                    <textarea
                      className="input resize-none text-sm"
                      rows={3}
                      placeholder="Décrivez brièvement pourquoi votre PME est la mieux placée…"
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary text-xs py-2 px-4" disabled={applying}>
                    {applying ? <><Loader2 size={12} className="animate-spin" /> Envoi…</> : <><Send size={12} /> Envoyer</>}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Candidatures */}
      {activeTab === "applications" && (
        <div>
          {applications.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-sm font-medium text-slate-800 mb-1">Aucune candidature reçue</p>
              <p className="text-xs text-muted">Les PMEs peuvent postuler depuis leur espace personnel.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{app.sme_name}</p>
                      {app.message && (
                        <p className="text-xs text-muted mt-1 italic">&quot;{app.message}&quot;</p>
                      )}
                    </div>
                    <span className={`badge border text-[11px] flex-shrink-0 ${APP_STATUS_STYLES[app.status] || APP_STATUS_STYLES.pending}`}>
                      {APP_STATUS_LABELS[app.status] || app.status}
                    </span>
                  </div>
                  <ScoreBar score={app.score} />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted">
                      {new Date(app.applied_at).toLocaleDateString("fr-FR")}
                    </p>
                    {app.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          className="flex items-center gap-1 text-xs font-semibold text-success bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors"
                          onClick={() => handleAccept(app.id)}
                        >
                          <CheckCircle2 size={12} /> Accepter
                        </button>
                        <button
                          className="flex items-center gap-1 text-xs font-semibold text-danger bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                          onClick={() => handleReject(app.id)}
                        >
                          <XCircle size={12} /> Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Matching IA */}
      {activeTab === "matching" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                className="btn-primary py-2 px-4"
                onClick={runMatching}
                disabled={matchLoading}
              >
                {matchLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Analyse en cours…</>
                  : <><Zap size={14} /> Lancer l&apos;analyse automatique</>
                }
              </button>
            </div>
            {matchResults && allResults.length > 0 && (
              <button
                className="text-xs text-brand hover:underline"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Résultats qualifiés seulement" : "Afficher tous les résultats"}
              </button>
            )}
          </div>

          {!matchResults && !matchLoading && (
            <div className="card p-10 text-center">
              <Zap size={28} className="text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-800 mb-1">Matching non lancé</p>
              <p className="text-xs text-muted">Cliquez sur &quot;Lancer l&apos;analyse automatique&quot; pour scorer toutes les PMEs.</p>
            </div>
          )}

          {matchLoading && (
            <div className="card p-8 text-center">
              <Loader2 size={28} className="animate-spin text-brand mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">Analyse de {smes.length} PMEs…</p>
              <p className="text-xs text-muted mt-1">Calcul des scores secteur, capacité, localisation et réputation</p>
            </div>
          )}

          {matchResults && !matchLoading && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-muted">
                  <b className="text-slate-900">{matchResults.total_matches}</b> PME{matchResults.total_matches !== 1 ? "s" : ""} qualifiée{matchResults.total_matches !== 1 ? "s" : ""}
                  {!showAll && " (filtrées)"}
                </span>
                {matchResults.is_gap && (
                  <span className="flex items-center gap-1 text-xs text-warning font-medium ml-auto">
                    <AlertTriangle size={12} /> Gap détecté
                  </span>
                )}
                {matchResults.is_gap && matchResults.gap && (
                  <div className="card p-3 border-l-4 border-l-amber-400 mb-4 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={13} className="text-warning" />
                      <span className="text-xs font-bold text-amber-800">{matchResults.gap.title}</span>
                    </div>
                    <p className="text-xs text-amber-700">{matchResults.gap.description}</p>
                  </div>
                )}
              </div>

              {/* All results */}
              {displayedResults.length === 0 ? (
                <div className="card p-6 text-center text-sm text-muted">
                  Aucun résultat à afficher.
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedResults.map((result) => {
                    const sme = smes.find((s) => s.id === result.sme_id) || {
                      id: result.sme_id,
                      name: result.sme_id,
                      city: "—",
                      sector: "transport",
                      tags: [],
                    }
                    const isQualified = result.total_score >= minScore

                    if (isPremium) {
                      return (
                        <div
                          key={`${result.sme_id}-${result.need_id}`}
                          className={`rounded-xl border-2 overflow-hidden ${
                            isQualified ? "border-green-400" : "border-gray-200 opacity-75"
                          }`}
                        >
                          <ScoreCard sme={sme} matchResult={result} />
                        </div>
                      )
                    }

                    // Non-premium: name + score only, no breakdown
                    return (
                      <div
                        key={`${result.sme_id}-${result.need_id}`}
                        className={`card p-4 flex items-center justify-between gap-4 ${
                          isQualified ? "border-l-4 border-l-green-400" : "border-l-4 border-l-gray-200 opacity-70"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{sme.name}</p>
                          <p className="text-xs text-muted">{sme.city} · {sme.sector}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  result.total_score >= 70 ? "bg-success" :
                                  result.total_score >= 50 ? "bg-warning" : "bg-danger"
                                }`}
                                style={{ width: `${result.total_score}%` }}
                              />
                            </div>
                          </div>
                          <span className={`text-sm font-bold tabular-nums ${
                            result.total_score >= 70 ? "text-success" :
                            result.total_score >= 50 ? "text-warning" : "text-danger"
                          }`}>
                            {result.total_score}/100
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Premium gate for breakdown */}
              {!isPremium && displayedResults.length > 0 && (
                <div className="mt-4 card p-4 border border-amber-200 bg-amber-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Détail des scores disponible en Premium</p>
                      <p className="text-xs text-amber-700">Activez Premium pour voir la décomposition sector / capacité / localisation / réputation.</p>
                    </div>
                  </div>
                  <PremiumToggle inline />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Silence unused import warning — ScoreBreakdown used conditionally
void ScoreBreakdown
