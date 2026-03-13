import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Loader2, CheckCircle2, LogIn, UserPlus } from "lucide-react"
import toast from "react-hot-toast"
import { smeApi } from "../api/client"
import TagBadge from "../components/TagBadge"
import DemoFillButton from "../components/DemoFillButton"

const DEMO_SMES = [
  {
    name: "TRANSMED OUJDA SARL",
    city: "Oujda",
    sector: "transport",
    raw_description: "Transport de conteneurs et logistique portuaire, flotte de 4 camions plateau disponibles 6j/7, certifiés ADR. Intervient sur la zone Orientale et le port de Nador. Expérience de 3 ans en transport de marchandises dangereuses.",
  },
  {
    name: "TECHNO FOOD BERKANE",
    city: "Berkane",
    sector: "agroalim",
    raw_description: "Traiteur industriel spécialisé en restauration collective, capacité 300 repas/jour, cuisine équipée aux normes ONSSA, livraison sur chantiers et sites industriels. Personnel formé HACCP, véhicule frigorifique dédié.",
  },
  {
    name: "ORIENT SYSTEMS IT",
    city: "Nador",
    sector: "it",
    raw_description: "Développement de systèmes d'information portuaires, intégration EDI, réseaux industriels et cybersécurité. Partenaire Microsoft certifié, équipe de 8 développeurs, expérience sur des projets de digitalisation portuaire au Maroc.",
  },
]

const CITIES = ["Nador", "Oujda", "Berkane", "Taourirt", "Autre"]
const SECTORS = [
  { value: "transport", label: "Transport & Logistique" },
  { value: "agroalim", label: "Agroalimentaire" },
  { value: "it", label: "IT & Numérique" },
  { value: "hospitality", label: "Hôtellerie & Restauration" },
  { value: "btp", label: "BTP & Construction" },
  { value: "maintenance", label: "Maintenance Industrielle" },
]

const LS_PROFILES = "port2region_pme_profiles"
const LS_CURRENT = "port2region_current_pme"

const INITIAL_FORM = { name: "", city: "", sector: "", raw_description: "" }

function getProfiles() {
  try {
    return JSON.parse(localStorage.getItem(LS_PROFILES) || "[]")
  } catch {
    return []
  }
}

function saveProfile(sme) {
  const profiles = getProfiles()
  const existing = profiles.findIndex((p) => p.id === sme.id)
  if (existing >= 0) {
    profiles[existing] = sme
  } else {
    profiles.push(sme)
  }
  localStorage.setItem(LS_PROFILES, JSON.stringify(profiles))
}

export default function PMEAuth() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("login")

  // Login state
  const [loginName, setLoginName] = useState("")
  const [loginError, setLoginError] = useState("")

  // Register state
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [registeredSme, setRegisteredSme] = useState(null)

  const savedNames = getProfiles().map((p) => p.name)

  function handleLogin(e) {
    e.preventDefault()
    if (!loginName.trim()) {
      setLoginError("Saisissez le nom de votre entreprise.")
      return
    }
    const profiles = getProfiles()
    const found = profiles.find((p) => p.name.toLowerCase() === loginName.trim().toLowerCase())
    if (!found) {
      setLoginError("Entreprise non trouvée. Inscrivez-vous d'abord.")
      return
    }
    localStorage.setItem(LS_CURRENT, JSON.stringify(found))
    toast.success(`Connexion réussie — Bienvenue, ${found.name}`)
    navigate("/smes-dashboard")
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!form.name || !form.city || !form.sector || !form.raw_description) {
      toast.error("Tous les champs sont requis")
      return
    }
    setLoading(true)
    try {
      const res = await smeApi.register(form)
      const sme = res.data.data
      saveProfile(sme)
      localStorage.setItem(LS_CURRENT, JSON.stringify(sme))
      setRegisteredSme(sme)
      toast.success("Compte créé avec succès !")
      setTimeout(() => navigate("/smes-dashboard"), 1800)
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center">
          <Building2 size={18} className="text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Espace PME</h1>
          <p className="text-sm text-muted">Connectez-vous ou créez votre compte</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
            tab === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <LogIn size={14} /> Connexion
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
            tab === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <UserPlus size={14} /> Inscription
        </button>
      </div>

      {/* LOGIN TAB */}
      {tab === "login" && (
        <div className="card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Nom de l&apos;entreprise</label>
              <input
                className="input"
                list="saved-companies"
                placeholder="Ex: TRANSORIENT SARL"
                value={loginName}
                onChange={(e) => { setLoginName(e.target.value); setLoginError("") }}
              />
              {savedNames.length > 0 && (
                <datalist id="saved-companies">
                  {savedNames.map((name) => <option key={name} value={name} />)}
                </datalist>
              )}
            </div>
            {loginError && (
              <p className="text-xs text-danger font-medium">{loginError}</p>
            )}
            <button type="submit" className="btn-primary w-full justify-center py-2.5">
              <LogIn size={15} /> Se connecter
            </button>
          </form>
          <p className="text-xs text-center text-muted mt-4">
            Pas encore inscrit ?{" "}
            <button onClick={() => setTab("register")} className="text-brand font-medium hover:underline">
              Créer un compte
            </button>
          </p>
        </div>
      )}

      {/* REGISTER TAB */}
      {tab === "register" && (
        <div className="card p-6">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Demo fill buttons */}
            <div className="flex flex-wrap gap-2 p-3 bg-violet-50 border border-violet-100 rounded-lg">
              <span className="text-xs text-violet-600 font-medium w-full mb-1">✏️ Exemples de démo :</span>
              {DEMO_SMES.map((demo, i) => (
                <DemoFillButton
                  key={i}
                  label={demo.name}
                  onFill={() => setForm(demo)}
                />
              ))}
            </div>
            <div>
              <label className="label">Nom de l&apos;entreprise</label>
              <input
                className="input"
                placeholder="Ex: TRANSORIENT SARL"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ville</label>
                <select
                  className="input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                >
                  <option value="">Sélectionner</option>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Secteur</label>
                <select
                  className="input"
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                >
                  <option value="">Sélectionner</option>
                  {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description des services</label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Décrivez vos services... Ex: Transport de conteneurs et logistique portuaire, flotte de 8 camions certifiés ADR..."
                value={form.raw_description}
                onChange={(e) => setForm({ ...form, raw_description: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Création en cours…</>
                : <><UserPlus size={15} /> S&apos;inscrire &amp; Créer mon compte</>
              }
            </button>
          </form>
          <p className="text-xs text-center text-muted mt-4">
            Déjà inscrit ?{" "}
            <button onClick={() => setTab("login")} className="text-brand font-medium hover:underline">
              Se connecter
            </button>
          </p>
        </div>
      )}

      {/* Success confirmation after register */}
      {registeredSme && (
        <div className="card p-5 mt-4 border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-success" />
            <span className="text-sm font-semibold text-success">
              Compte créé — Tags extraits par l&apos;IA
            </span>
          </div>
          <p className="text-xs text-muted mb-3">{registeredSme.capacity_summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {registeredSme.tags?.map((t) => (
              <TagBadge key={t} tag={t} sector={registeredSme.sector} />
            ))}
          </div>
          <p className="text-xs text-muted mt-3">Redirection vers votre espace…</p>
        </div>
      )}
    </div>
  )
}
