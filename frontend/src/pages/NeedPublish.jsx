import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FileText, Loader2, CheckCircle2, Zap, AlertTriangle, TrendingUp, MoreHorizontal, RotateCcw } from "lucide-react"
import toast from "react-hot-toast"
import PropTypes from "prop-types"
import { needsApi, matchingApi, smeApi, demoApi } from "../api/client"
import DemoFillButton from "../components/DemoFillButton"

const DEMO_NEEDS = [
  {
    title: "Transport conteneurs zone franche — flotte 3 camions min",
    raw_description: "Besoin de transport de conteneurs entre le terminal et la zone franche de Nador West Med. Minimum 3 camions disponibles, permis transport matières dangereuses souhaité. Disponibilité 5j/7, intervention possible le week-end sur demande.",
    location_zones: ["nador"],
    deadline_days: 30,
    min_score: 60,
    published_by: "TMSA — Nador West Med",
  },
  {
    title: "Restauration collective chantier — 200 repas/jour",
    raw_description: "Prestataire de restauration collective pour les équipes de construction et d'exploitation. Capacité 200 repas/jour, midi et soir, 6j/7. Cuisine équipée normes ONSSA, véhicule frigorifique, 5 agents minimum. Expérience restauration industrielle exigée.",
    location_zones: ["nador", "berkane"],
    deadline_days: 45,
    min_score: 55,
    published_by: "ANP — Agence Nationale des Ports",
  },
  {
    title: "Maintenance préventive équipements portuaires",
    raw_description: "Contrat de maintenance préventive et curative pour grues portuaires, convoyeurs et équipements électromécaniques. Intervention H24, techniciens certifiés, stock de pièces de rechange. Expérience en milieu industriel portuaire requise.",
    location_zones: ["nador"],
    deadline_days: 60,
    min_score: 65,
    published_by: "Zone Logistique Nador West Med",
  },
  // ✅ Besoin garanti match — conçu pour matcher TRANSORIENT SARL + NADOR LOGISTICS
  // preset_tags bypass Claude extraction → match garanti même si Claude échoue
  {
    _guaranteed: true,
    title: "Transport frigorifique — produits de la mer débarqués Nador West Med",
    raw_description: "Le port Nador West Med recherche un prestataire de transport frigorifique pour acheminer les produits de la mer fraîchement débarqués vers les marchés régionaux et les unités de transformation agroalimentaire. Minimum 3 camions frigorifiques disponibles, chauffeurs expérimentés en procédures portuaires, certification ADR appréciée. Disponibilité 7j/7, démarrage sous 15 jours après signature du contrat.",
    location_zones: ["nador"],
    deadline_days: 15,
    min_score: 60,
    published_by: "TMSA — Nador West Med",
    preset_tags: ["transport_frigorifique", "logistique_portuaire", "transport_conteneurs", "camions_porteurs"],
    preset_required_capacity: "Minimum 3 camions frigorifiques disponibles, disponibilité 7j/7, chauffeurs certifiés procédures portuaires",
  },
]
import TagBadge from "../components/TagBadge"
import ScoreCard from "../components/ScoreCard"

const ZONES = [
  { value: "nador", label: "Nador / Nador West Med" },
  { value: "oujda", label: "Oujda" },
  { value: "berkane", label: "Berkane" },
  { value: "taourirt", label: "Taourirt" },
  { value: "oriental", label: "Toute la région Orientale" },
]

const DONNEURS_ORDRE = [
  "TMSA — Nador West Med",
  "ANP — Agence Nationale des Ports",
  "Zone Franche d'Exportation Nador",
  "Zone Logistique Nador West Med",
  "Direction Régionale des Travaux Publics",
  "ONCF — Logistique",
  "Marsa Maroc",
  "Ministère de l'Équipement et de l'Eau",
  "Direction Régionale du Commerce",
]

const INITIAL_FORM = {
  title: "",
  raw_description: "",
  location_zones: [],   // multi-select
  deadline_days: 30,
  min_score: 60,
  published_by: "",
  preset_tags: null,
  preset_required_capacity: null,
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const menuRef = useRef(null)

  // Ferme le menu si on clique ailleurs
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleReset() {
    setMenuOpen(false)
    setResetting(true)
    try {
      await demoApi.reset()
      // Reset local state aussi
      setStep("form")
      setForm(INITIAL_FORM)
      setPublishedNeed(null)
      setMatchResults([])
      setMatchGap(null)
      setAllSmes([])
      toast.success("Demo réinitialisée — données seed rechargées ✓")
    } catch {
      toast.error("Erreur lors du reset de la demo")
    } finally {
      setResetting(false)
    }
  }

  function handleChange(e) {
    const { name, value, type } = e.target
    setForm(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.raw_description || form.location_zones.length === 0 || !form.published_by) {
      toast.error("Veuillez remplir tous les champs obligatoires (titre, description, zones, donneur d'ordre).")
      return
    }

    // Step 1 — Publish need + extract tags
    setStep("publishing")
    let need
    try {
      // Serialize multi-zones to comma-separated string for the API
      // preset_tags / preset_required_capacity are passed as-is when present (guaranteed demo match)
      const { location_zones, _guaranteed, ...rest } = form
      const payload = {
        ...rest,
        location_zone: location_zones.join(", "),
      }
      const res = await needsApi.publish(payload)
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

          {/* Bouton ··· discret — reset demo */}
          <div className="ml-auto relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
              title="Options demo"
            >
              <MoreHorizontal size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-50 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 animate-fade-in">
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
                >
                  {resetting
                    ? <Loader2 size={13} className="animate-spin text-slate-400" />
                    : <RotateCcw size={13} className="text-slate-400" />}
                  <span>Réinitialiser la demo</span>
                </button>
              </div>
            )}
          </div>
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
                <div key={i} className="relative">
                  <DemoFillButton
                    label={demo.title.split("—")[0].trim()}
                    onFill={() => {
                      const { _guaranteed, ...fields } = demo
                      setForm({ ...INITIAL_FORM, ...fields })
                    }}
                  />
                  {demo._guaranteed && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-green-500 text-white font-bold px-1 py-0.5 rounded-full leading-none">
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className="label">Titre du besoin</label>
              <input className="input" name="title" value={form.title} onChange={handleChange}
                placeholder="Transport conteneurs zone franche" />
            </div>

            <div>
              <label className="label">Donneur d&apos;ordre</label>
              <select className="input" name="published_by" value={form.published_by} onChange={handleChange}>
                <option value="">Sélectionner le donneur d&apos;ordre…</option>
                {DONNEURS_ORDRE.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Zones géographiques
                {form.location_zones.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-brand">
                    {form.location_zones.length} sélectionnée{form.location_zones.length > 1 ? "s" : ""}
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {ZONES.map(z => {
                  const checked = form.location_zones.includes(z.value)
                  return (
                    <label
                      key={z.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                        checked
                          ? "border-brand bg-brand/5 text-brand font-medium"
                          : "border-gray-200 text-slate-600 hover:border-brand/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-brand"
                        checked={checked}
                        onChange={() => {
                          setForm(prev => ({
                            ...prev,
                            location_zones: checked
                              ? prev.location_zones.filter(v => v !== z.value)
                              : [...prev.location_zones, z.value],
                          }))
                        }}
                      />
                      {z.label}
                    </label>
                  )
                })}
              </div>
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
