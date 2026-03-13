import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import PropTypes from "prop-types"
import {
  Star, MapPin, Briefcase, Loader2, X, Send, CheckCircle2,
  Lock, ChevronRight, Zap, TrendingUp,
} from "lucide-react"
import toast from "react-hot-toast"
import { needsApi, applicationsApi, matchingApi } from "../api/client"
import TagBadge from "../components/TagBadge"
import PremiumToggle, { usePremium } from "../components/PremiumToggle"

const LS_CURRENT = "port2region_current_pme"

const APP_STATUS_STYLES = {
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  invited:  "bg-blue-50 text-blue-700 border-blue-300",
}
const APP_STATUS_LABELS = { pending: "En attente", accepted: "Accepté", rejected: "Refusé", invited: "🔔 Invitation port" }

const SECTOR_LABELS = {
  transport:   "Transport & Logistique",
  agroalim:    "Agroalimentaire",
  it:          "IT & Numérique",
  hospitality: "Hôtellerie & Restauration",
  btp:         "BTP & Construction",
  maintenance: "Maintenance Industrielle",
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ReputationStars({ score }) {
  const filled = Math.round(score)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= filled ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
      <span className="ml-1 text-xs text-muted">{score}/5</span>
    </div>
  )
}
ReputationStars.propTypes = { score: PropTypes.number.isRequired }

function ScoreBar({ score, max = 100 }) {
  const pct = Math.round((score / max) * 100)
  const color = score >= 70 ? "bg-green-500" : score >= 50 ? "bg-amber-400" : "bg-red-400"
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold ${score >= 70 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-500"}`}>
        {score}/100
      </span>
    </div>
  )
}
ScoreBar.propTypes = { score: PropTypes.number.isRequired, max: PropTypes.number }

// ─── Apply Modal ───────────────────────────────────────────────────────────────

function ApplyModal({ need, onClose, onSuccess }) {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const sme = JSON.parse(localStorage.getItem(LS_CURRENT) || "{}")

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await applicationsApi.create({ sme_id: sme.id, need_id: need.id, message })
      if (res.data.success) {
        toast.success("Candidature envoyée !")
        onSuccess(res.data.data)
      } else {
        toast.error(res.data.error || "Erreur")
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la candidature")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-slate-900">Postuler</p>
            <p className="text-xs text-muted mt-0.5 max-w-xs truncate">{need.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-slate-900 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Message de motivation (optionnel)</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Décrivez brièvement pourquoi votre PME est la mieux placée pour ce besoin…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Envoi…</>
              : <><Send size={14} /> Envoyer ma candidature</>}
          </button>
        </form>
      </div>
    </div>
  )
}
ApplyModal.propTypes = {
  need: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SMEDashboard() {
  const navigate = useNavigate()
  const isPremium = usePremium()

  const [sme, setSme] = useState(null)
  const [myApplications, setMyApplications] = useState([])
  const [loading, setLoading] = useState(true)

  // Premium matching state
  const [matchScores, setMatchScores] = useState([])  // [{ need, score, is_gap }]
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchDone, setMatchDone] = useState(false)

  // Apply modal
  const [applyModal, setApplyModal] = useState(null)
  const [appliedNeeds, setAppliedNeeds] = useState(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_CURRENT)
      if (!stored) { navigate("/pme-auth"); return }
      const smeData = JSON.parse(stored)
      setSme(smeData)
      applicationsApi.listMy(smeData.id).then((ar) => {
        const apps = ar.data.data || []
        setMyApplications(apps)
        setAppliedNeeds(new Set(apps.map((a) => a.need_id)))
      }).finally(() => setLoading(false))
    } catch {
      navigate("/pme-auth")
    }
  }, [navigate])

  const runPersonalMatching = useCallback(async () => {
    if (!sme) return
    setMatchLoading(true)
    setMatchDone(false)
    try {
      const needsRes = await needsApi.list()
      const needs = needsRes.data.data || []
      const openNeeds = needs.filter((n) => n.status === "open")

      // Run matching for each open need and extract this SME's score
      const results = await Promise.all(
        openNeeds.map(async (need) => {
          try {
            const res = await matchingApi.runForNeed(need.id)
            const data = res.data.data
            const allResults = data.all_results || []
            const myResult = allResults.find((r) => r.sme_id === sme.id)
            return { need, score: myResult?.score ?? 0, qualified: (myResult?.score ?? 0) >= need.min_score }
          } catch {
            return { need, score: 0, qualified: false }
          }
        })
      )
      // Sort by score desc
      results.sort((a, b) => b.score - a.score)
      setMatchScores(results)
      setMatchDone(true)
      const qualified = results.filter((r) => r.qualified).length
      toast.success(`Analyse terminée — ${qualified} besoin${qualified !== 1 ? "s" : ""} pour lequel vous êtes qualifié${qualified !== 1 ? "s" : ""}`)
    } catch {
      toast.error("Erreur lors de l'analyse")
    } finally {
      setMatchLoading(false)
    }
  }, [sme])

  if (loading || !sme) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center gap-3 text-muted">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Chargement de votre espace…</span>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-xs font-medium mb-1">Bienvenue,</p>
        <h1 className="text-2xl font-extrabold mb-2">{sme.name}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 text-sm text-blue-100">
            <MapPin size={13} /> {sme.city}
          </span>
          <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Briefcase size={11} /> {SECTOR_LABELS[sme.sector] || sme.sector}
          </span>
        </div>
      </div>

      {/* ── Section 1 : Mon Profil ── */}
      <section>
        <h2 className="section-title mb-4">Mon Profil</h2>
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-base font-bold text-slate-900 mb-1">{sme.name}</p>
              <p className="text-xs text-muted flex items-center gap-1">
                <MapPin size={11} /> {sme.city} — {SECTOR_LABELS[sme.sector] || sme.sector}
              </p>
            </div>
            <div className="text-right">
              <ReputationStars score={sme.reputation_score ?? 0} />
              <p className="text-xs text-muted mt-1">{sme.missions_count ?? 0} missions</p>
            </div>
          </div>
          {sme.tags?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {sme.tags.map((t) => <TagBadge key={t} tag={t} sector={sme.sector} />)}
            </div>
          ) : (
            <p className="text-xs text-muted mb-4">Aucun tag de compétence — inscrivez votre PME pour enrichir votre profil.</p>
          )}
          {/* CTA: consulter les besoins */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-xs text-muted">Vous cherchez des opportunités ?</p>
            <button
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
              onClick={() => navigate("/needs")}
            >
              Consulter les besoins <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2 : Mes Candidatures ── */}
      <section>
        <h2 className="section-title mb-4">
          Mes Candidatures
          <span className="ml-2 text-muted font-normal text-sm">({myApplications.length})</span>
        </h2>
        {myApplications.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-muted mb-3">Vous n&apos;avez pas encore postulé.</p>
            <button className="btn-primary text-xs py-1.5 px-3" onClick={() => navigate("/needs")}>
              Voir les besoins du port
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {myApplications.map((app) => (
              <div key={app.id} className="card p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{app.need_title}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(app.applied_at).toLocaleDateString("fr-FR")} · Score : <strong>{app.score}/100</strong>
                  </p>
                </div>
                <span className={`badge border text-[11px] flex-shrink-0 ${APP_STATUS_STYLES[app.status] || APP_STATUS_STYLES.pending}`}>
                  {APP_STATUS_LABELS[app.status] || app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 3 : Matching IA Personnalisé (PREMIUM) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            Mon Score Face aux Besoins
            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">PREMIUM</span>
          </h2>
        </div>

        {!isPremium ? (
          /* Locked preview */
          <div className="relative">
            <div className="blur-sm pointer-events-none select-none">
              <div className="space-y-2">
                {[
                  { need: { title: "Transport de conteneurs — zone franche Nador West Med" }, score: 87, qualified: true },
                  { need: { title: "Maintenance industrielle des équipements de manutention" }, score: 42, qualified: false },
                  { need: { title: "Restauration collective industrielle — 200 repas/jour" }, score: 61, qualified: true },
                ].map((r, i) => (
                  <div key={i} className="card p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-900 mb-2">{r.need.title}</p>
                      <ScoreBar score={r.score} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 rounded-xl">
              <Lock size={22} className="text-slate-400 mb-2" />
              <p className="font-semibold text-slate-900 mb-1">Fonctionnalité Premium</p>
              <p className="text-xs text-muted mb-3 text-center max-w-xs px-4">
                Lancez l&apos;IA pour connaître votre score exact face à chaque besoin du port
              </p>
              <PremiumToggle inline />
            </div>
          </div>
        ) : (
          /* Unlocked */
          <div className="card p-5">
            {!matchDone ? (
              <div className="text-center py-6">
                <TrendingUp size={32} className="text-brand mx-auto mb-3 opacity-60" />
                <p className="text-sm text-slate-700 font-medium mb-1">Analyse de compatibilité personnalisée</p>
                <p className="text-xs text-muted mb-4 max-w-xs mx-auto">
                  L&apos;IA calcule votre score exact face à tous les besoins ouverts du port et identifie vos meilleures opportunités.
                </p>
                <button
                  className="btn-primary py-2 px-5"
                  onClick={runPersonalMatching}
                  disabled={matchLoading}
                >
                  {matchLoading
                    ? <><Loader2 size={14} className="animate-spin" /> Analyse en cours…</>
                    : <><Zap size={14} /> Lancer mon analyse</>}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-muted">
                    {matchScores.filter((r) => r.qualified).length} besoin{matchScores.filter((r) => r.qualified).length !== 1 ? "s" : ""} pour lequel vous êtes qualifié
                  </p>
                  <button
                    className="text-xs text-brand hover:underline flex items-center gap-1"
                    onClick={runPersonalMatching}
                    disabled={matchLoading}
                  >
                    {matchLoading ? <Loader2 size={11} className="animate-spin" /> : "↺"} Relancer
                  </button>
                </div>
                <div className="space-y-3">
                  {matchScores.map((r) => {
                    const isApplied = appliedNeeds.has(r.need.id)
                    return (
                      <div key={r.need.id} className="rounded-xl border border-gray-100 p-3.5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-xs font-semibold text-slate-900 flex-1 leading-snug">{r.need.title}</p>
                          {r.qualified ? (
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">Qualifié ✓</span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex-shrink-0">Non qualifié</span>
                          )}
                        </div>
                        <ScoreBar score={r.score} />
                        {r.qualified && !isApplied && (
                          <button
                            className="mt-2.5 text-xs text-brand font-semibold hover:underline flex items-center gap-1"
                            onClick={() => setApplyModal(r.need)}
                          >
                            <Send size={11} /> Postuler à ce besoin
                          </button>
                        )}
                        {isApplied && (
                          <p className="mt-2.5 text-xs text-success font-semibold flex items-center gap-1">
                            <CheckCircle2 size={11} /> Candidature envoyée
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Apply Modal */}
      {applyModal && (
        <ApplyModal
          need={applyModal}
          onClose={() => setApplyModal(null)}
          onSuccess={(app) => {
            setAppliedNeeds((prev) => new Set([...prev, applyModal.id]))
            setMyApplications((prev) => [app, ...prev])
            setApplyModal(null)
          }}
        />
      )}
    </div>
  )
}
