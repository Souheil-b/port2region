import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileText, Loader2, CheckCircle2, Zap, AlertTriangle, TrendingUp } from "lucide-react"
import toast from "react-hot-toast"
import PropTypes from "prop-types"
import { needsApi, matchingApi, smeApi } from "../api/client"
import DemoFillButton from "../components/DemoFillButton"

const DEMO_NEEDS = [
  {
    title: "Transport conteneurs zone franche — flotte 3 camions min",
    raw_description: "Besoin de transport de conteneurs entre le terminal et la zone franche de Nador West Med. Minimum 3 camions disponibles, permis transport matières dangereuses souhaité. Disponibilité 5j/7, intervention possible le week-end sur demande.",
    location_zone: "nador",
    deadline_days: 30,
    min_score: 60,
    published_by: "Nador West Med — Direction Logistique",
  },
  {
    title: "Restauration collective chantier — 200 repas/jour",
    raw_description: "Prestataire de restauration collective pour les équipes de construction et d'exploitation. Capacité 200 repas/jour, midi et soir, 6j/7. Cuisine équipée normes ONSSA, véhicule frigorifique, 5 agents minimum. Expérience restauration industrielle exigée.",
    location_zone: "nador",
    deadline_days: 45,
    min_score: 55,
    published_by: "Nador West Med — Direction RH",
  },
  {
    title: "Maintenance préventive équipements portuaires",
    raw_description: "Contrat de maintenance préventive et curative pour grues portuaires, convoyeurs et équipements électromécaniques. Intervention H24, techniciens certifiés, stock de pièces de rechange. Expérience en milieu industriel portuaire requise.",
    location_zone: "nador",
    deadline_days: 60,
    min_score: 65,
    published_by: "Nador West Med — Direction Technique",
  },
]
import TagBadge from "../components/TagBadge"
import ScoreCard from "../components/ScoreCard"

const ZONES = ["nador", "oujda", "berkane", "taourirt", "oriental"]

const INITIAL_FORM = {
  title: "",
  raw_description: "",
  location_zone: "",
  deadline_days: 30,
  min_score: 60,
  published_by: "",
}

function MatchingResults({ need, matches, gap, smes }) {
  if (!need) return null

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={16} className="text-brand" />
        <h2 className="text-base font-bold text-slate-900">
          Résultats du Matching Automatique
        </h2>
        <span className="badge bg-slate-100 text-slate-600 border border-slate-200 text-xs ml-auto">
          {matches.length} résultat{matches.length !== 1 ? "s" : ""}
        </span>
      </div>

      {matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map(m => {
            const sme = smes.find(s => s.id === m.sme_id) || { name: m.sme_id, city: "—", sector: "transport", tags: [] }
            return <ScoreCard key={m.sme_id} sme={sme} matchResult={m} />
          })}
        </div>
      ) : (
        <div className="card p-5 border-l-4 border-l-amber-400">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-1">
                Aucune PME qualifiée — Gap détecté
              </p>
              <p className="text-xs text-muted mb-3">
                Aucune PME n'atteint le score minimum de {need.min_score}/100 pour ce besoin.
                Une opportunité d'investissement a été générée.
              </p>
              {gap && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={13} className="text-warning" />
                    <span className="text-xs font-bold text-amber-800">{gap.title}</span>
                  </div>
                  <p className="text-xs text-amber-700 mb-2">{gap.description}</p>
                  <span className="text-sm font-bold text-success">{gap.estimated_potential}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

MatchingResults.propTypes = {
  need: PropTypes.object,
  matches: PropTypes.array.isRequired,
  gap: PropTypes.object,
  smes: PropTypes.array.isRequired,
}

export default function NeedPublish() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [step, setStep] = useState("form") // form | publishing | matching | done
  const [publishedNeed, setPublishedNeed] = useState(null)
  const [matchResults, setMatchResults] = useState([])
  const [matchGap, setMatchGap] = useState(null)
  const [allSmes, setAllSmes] = useState([])

  function handleChange(e) {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.raw_description || !form.location_zone || !form.published_by) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    // Step 1 — Publish need + extract tags
    setStep("publishing")
    let need
    try {
      const res = await needsApi.publish(form)
      need = res.data.data
      setPublishedNeed(need)
      setForm(INITIAL_FORM)
      toast.success("Besoin publié — lancement du matching...")
    } catch (err) {
      toast.error(err?.response?.data?.error || "Erreur lors de la publication.")
      setStep("form")
      return
    }

    // Step 2 — Auto-run matching for this need
    setStep("matching")
    try {
      const [matchRes, smesRes] = await Promise.all([
        matchingApi.runForNeed(need.id),
        smeApi.list(),
      ])
      const data = matchRes.data.data
      setMatchResults(data.matches || [])
      setMatchGap(data.gap || null)
      setAllSmes(smesRes.data.data || [])

      if (data.is_gap) {
        toast("Gap détecté — opportunité investisseur générée", { icon: "⚠️" })
      } else {
        toast.success(`${data.total_matches} PME${data.total_matches !== 1 ? "s" : ""} qualifiée${data.total_matches !== 1 ? "s" : ""} trouvée${data.total_matches !== 1 ? "s" : ""}`)
      }
    } catch {
      toast.error("Matching automatique échoué — accédez manuellement à l'onglet Matching.")
    } finally {
      setStep("done")
    }
  }

  const isPublishing = step === "publishing"
  const isMatching = step === "matching"
  const isDone = step === "done"

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgb(37 99 235 / 0.1)" }}>
            <FileText size={18} className="text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Publier un Besoin</h1>
        </div>
        <p className="text-sm text-muted ml-12">
          Le matching se lance automatiquement après publication.
        </p>
      </div>

      {/* Form */}
      {(step === "form" || isPublishing) && (
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Demo fill */}
            <div className="flex flex-wrap gap-2 p-3 bg-violet-50 border border-violet-100 rounded-lg">
              <span className="text-xs text-violet-600 font-medium w-full mb-1">✏️ Exemples de démo :</span>
              {DEMO_NEEDS.map((demo, i) => (
                <DemoFillButton
                  key={i}
                  label={demo.title.split("—")[0].trim()}
                  onFill={() => setForm(demo)}
                />
              ))}
            </div>
            <div>
              <label className="label">Titre du besoin</label>
              <input className="input" name="title" value={form.title} onChange={handleChange}
                placeholder="Transport conteneurs zone franche" />
            </div>

            <div>
              <label className="label">Publié par</label>
              <input className="input" name="published_by" value={form.published_by} onChange={handleChange}
                placeholder="Nador West Med — Direction Logistique" />
            </div>

            <div>
              <label className="label">Zone géographique</label>
              <select className="input" name="location_zone" value={form.location_zone} onChange={handleChange}>
                <option value="">Sélectionner une zone…</option>
                {ZONES.map(z => (
                  <option key={z} value={z}>{z.charAt(0).toUpperCase() + z.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Délai (jours)</label>
                <input className="input" type="number" name="deadline_days" value={form.deadline_days}
                  onChange={handleChange} min={1} max={365} />
              </div>
              <div>
                <label className="label">
                  Score minimum — <span className="font-bold text-brand">{form.min_score}</span>/100
                </label>
                <input className="w-full mt-1 accent-brand" type="range" name="min_score"
                  value={form.min_score} onChange={handleChange} min={40} max={80} step={5} />
                <div className="flex justify-between text-[10px] text-muted mt-0.5">
                  <span>40</span><span>80</span>
                </div>
              </div>
            </div>

            <div>
              <label className="label">Description du besoin</label>
              <textarea className="input resize-none" name="raw_description" value={form.raw_description}
                onChange={handleChange} rows={5}
                placeholder="Décrivez le besoin en détail — secteur, volume, exigences techniques…" />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={isPublishing || isMatching}>
              {isPublishing
                ? <><Loader2 size={15} className="animate-spin" /> Publication & extraction des tags...</>
                : "Publier & Lancer le Matching"}
            </button>
          </form>
        </div>
      )}

      {/* Matching in progress */}
      {isMatching && (
        <div className="card p-8 text-center mt-4">
          <Loader2 size={32} className="animate-spin text-brand mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900 mb-1">Matching en cours...</p>
          <p className="text-xs text-muted">L'IA analyse {allSmes.length || "toutes les"} PMEs de la région Orientale</p>
        </div>
      )}

      {/* Published need summary */}
      {publishedNeed && (isMatching || isDone) && (
        <div className="card p-4 mt-4 border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={15} className="text-success" />
            <span className="text-sm font-semibold text-success">Besoin publié avec succès</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {publishedNeed.tags?.map(t => <TagBadge key={t} tag={t} sector="transport" />)}
          </div>
        </div>
      )}

      {/* Matching results */}
      {isDone && (
        <>
          <MatchingResults
            need={publishedNeed}
            matches={matchResults}
            gap={matchGap}
            smes={allSmes}
          />
          <div className="flex gap-3 mt-6">
            <button className="btn-secondary" onClick={() => { setStep("form"); setPublishedNeed(null); setMatchResults([]); setMatchGap(null) }}>
              Publier un autre besoin
            </button>
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>
              Dashboard Investisseur
            </button>
          </div>
        </>
      )}
    </div>
  )
}
