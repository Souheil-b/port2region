import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Loader2, UserPlus, MapPin, Briefcase, ChevronRight } from "lucide-react"
import toast from "react-hot-toast"
import PropTypes from "prop-types"
import { smeApi } from "../api/client"
import TagBadge from "../components/TagBadge"
import DemoFillButton from "../components/DemoFillButton"

const LS_CURRENT = "port2region_current_pme"

const SECTOR_LABELS = {
  transport:   "Transport & Logistique",
  agroalim:    "Agroalimentaire",
  it:          "IT & Numérique",
  hospitality: "Hôtellerie & Restauration",
  btp:         "BTP & Construction",
  maintenance: "Maintenance Industrielle",
}

const SECTOR_COLORS = {
  transport:   "bg-blue-50 text-blue-700 border-blue-200",
  agroalim:    "bg-green-50 text-green-700 border-green-200",
  it:          "bg-violet-50 text-violet-700 border-violet-200",
  hospitality: "bg-amber-50 text-amber-700 border-amber-200",
  btp:         "bg-gray-50 text-gray-700 border-gray-200",
  maintenance: "bg-cyan-50 text-cyan-700 border-cyan-200",
}

const CITIES = ["Nador", "Oujda", "Berkane", "Taourirt", "Autre"]
const SECTORS = [
  { value: "transport",   label: "Transport & Logistique" },
  { value: "agroalim",    label: "Agroalimentaire" },
  { value: "it",          label: "IT & Numérique" },
  { value: "hospitality", label: "Hôtellerie & Restauration" },
  { value: "btp",         label: "BTP & Construction" },
  { value: "maintenance", label: "Maintenance Industrielle" },
]

const DEMO_REGISTER = [
  { name: "TRANSMED OUJDA SARL",  city: "Oujda",   sector: "transport",   raw_description: "Transport de conteneurs et logistique portuaire, flotte de 4 camions plateau 6j/7, certifiés ADR. Zone Orientale et port Nador." },
  { name: "TECHNO FOOD BERKANE",  city: "Berkane",  sector: "agroalim",   raw_description: "Traiteur industriel, restauration collective 300 repas/jour, normes ONSSA, livraison chantiers, personnel HACCP." },
  { name: "ORIENT SYSTEMS IT",    city: "Nador",    sector: "it",          raw_description: "Systèmes d'information portuaires, intégration EDI, réseaux industriels, équipe 8 développeurs." },
]

const INITIAL_FORM = { name: "", city: "", sector: "", raw_description: "" }

// ── SME card (clickable) ─────────────────────────────────────────────────────
function SmeCard({ sme, onSelect }) {
  return (
    <button
      onClick={() => onSelect(sme)}
      className="card p-4 text-left w-full hover:border-brand hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-brand transition-colors">
            {sme.name}
          </p>
          <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
            <MapPin size={10} /> {sme.city}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${SECTOR_COLORS[sme.sector] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
            {SECTOR_LABELS[sme.sector] || sme.sector}
          </span>
          <ChevronRight size={14} className="text-muted group-hover:text-brand transition-colors" />
        </div>
      </div>
      {sme.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sme.tags.slice(0, 3).map(t => <TagBadge key={t} tag={t} sector={sme.sector} />)}
          {sme.tags.length > 3 && <span className="text-[10px] text-muted">+{sme.tags.length - 3}</span>}
        </div>
      )}
    </button>
  )
}
SmeCard.propTypes = { sme: PropTypes.object.isRequired, onSelect: PropTypes.func.isRequired }

// ── Main component ────────────────────────────────────────────────────────────
export default function PMEAuth() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("login")
  const [smes, setSmes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Register form
  const [form, setForm] = useState(INITIAL_FORM)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(null)

  useEffect(() => {
    smeApi.list().then(r => setSmes(r.data.data || [])).finally(() => setLoading(false))
  }, [])

  function handleSelect(sme) {
    localStorage.setItem(LS_CURRENT, JSON.stringify(sme))
    toast.success(`Connecté en tant que ${sme.name}`)
    navigate("/smes-dashboard")
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!form.name || !form.city || !form.sector || !form.raw_description) {
      toast.error("Tous les champs sont requis")
      return
    }
    setRegistering(true)
    try {
      const res = await smeApi.register(form)
      const newSme = res.data.data
      setRegistered(newSme)
      setSmes(prev => [newSme, ...prev])
      toast.success("PME créée — connexion automatique dans 2s…")
      setTimeout(() => {
        localStorage.setItem(LS_CURRENT, JSON.stringify(newSme))
        navigate("/smes-dashboard")
      }, 2000)
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'inscription")
    } finally {
      setRegistering(false)
    }
  }

  const filtered = smes.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center">
          <Building2 size={18} className="text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Espace PME</h1>
          <p className="text-sm text-muted">Sélectionnez votre entreprise ou créez un compte</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <Building2 size={14} /> Se connecter
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${tab === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          <UserPlus size={14} /> Inscrire ma PME
        </button>
      </div>

      {/* LOGIN TAB — clickable company grid */}
      {tab === "login" && (
        <div>
          {/* Demo banner */}
          <div className="flex items-center gap-3 bg-brand/5 border border-brand/20 rounded-xl px-4 py-3 mb-4">
            <span className="text-lg">🎭</span>
            <div>
              <p className="text-xs font-bold text-brand">Mode démo — Se connecter en tant que</p>
              <p className="text-xs text-muted">Cliquez sur une entreprise pour incarner ce profil PME</p>
            </div>
          </div>
          <div className="mb-4">
            <input
              className="input"
              placeholder="Rechercher par nom ou ville…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Chargement des entreprises…</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted">Aucune entreprise trouvée.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map(sme => (
                <SmeCard key={sme.id} sme={sme} onSelect={handleSelect} />
              ))}
            </div>
          )}
          <p className="text-xs text-center text-muted mt-6">
            Votre PME n&apos;est pas listée ?{" "}
            <button onClick={() => setTab("register")} className="text-brand font-medium hover:underline">
              Inscrivez-la ici
            </button>
          </p>
        </div>
      )}

      {/* REGISTER TAB */}
      {tab === "register" && (
        <div className="card p-6">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="flex flex-wrap gap-2 p-3 bg-violet-50 border border-violet-100 rounded-lg">
              <span className="text-xs text-violet-600 font-medium w-full mb-1">✏️ Exemples de démo :</span>
              {DEMO_REGISTER.map((d, i) => (
                <DemoFillButton key={i} label={d.name} onFill={() => setForm(d)} />
              ))}
            </div>
            <div>
              <label className="label">Nom de l&apos;entreprise</label>
              <input className="input" placeholder="Ex: TRANSORIENT SARL"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ville</label>
                <select className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Secteur</label>
                <select className="input" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description des services</label>
              <textarea className="input resize-none" rows={4}
                placeholder="Décrivez vos services, capacités, certifications…"
                value={form.raw_description} onChange={e => setForm({ ...form, raw_description: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={registering}>
              {registering
                ? <><Loader2 size={15} className="animate-spin" /> Création en cours…</>
                : <><UserPlus size={15} /> S&apos;inscrire & Se connecter</>}
            </button>
          </form>

          {registered && (
            <div className="card p-4 mt-4 border-green-200 bg-green-50">
              <p className="text-sm font-semibold text-success mb-2">✓ PME créée — Tags extraits :</p>
              <div className="flex flex-wrap gap-1.5">
                {registered.tags?.map(t => <TagBadge key={t} tag={t} sector={registered.sector} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
