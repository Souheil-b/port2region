import { useState } from "react"
import { Building2, Loader2, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import { smeApi } from "../api/client"
import TagBadge from "../components/TagBadge"
import DemoFillButton from "../components/DemoFillButton"

const DEMO_SMES = [
  { name: "TRANSMED OUJDA SARL", city: "Oujda", sector: "transport", raw_description: "Transport de conteneurs et logistique portuaire, flotte de 4 camions plateau 6j/7, certifiés ADR. Zone Orientale et port Nador." },
  { name: "TECHNIMAINT BERKANE", city: "Berkane", sector: "maintenance", raw_description: "Maintenance industrielle et électromécanique, équipements portuaires et industriels, équipe 12 techniciens, intervention H24." },
  { name: "ORIENT FOOD NADOR", city: "Nador", sector: "agroalim", raw_description: "Traiteur industriel, restauration collective 250 repas/jour, normes ONSSA, livraison sur chantiers, personnel HACCP certifié." },
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

const INITIAL_FORM = { name: "", city: "", sector: "", raw_description: "" }

export default function SMERegister() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.city || !form.sector || !form.raw_description) {
      toast.error("Tous les champs sont requis")
      return
    }
    setLoading(true)
    try {
      const res = await smeApi.register(form)
      setResult(res.data.data)
      toast.success("PME inscrite avec succès !")
      setForm(INITIAL_FORM)
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Inscrire une PME</h1>
        </div>
        <p className="text-sm text-muted ml-12">
          L'IA extrait automatiquement vos tags de service à partir de votre description.
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-wrap gap-2 p-3 bg-violet-50 border border-violet-100 rounded-lg">
            <span className="text-xs text-violet-600 font-medium w-full mb-1">✏️ Exemples de démo :</span>
            {DEMO_SMES.map((demo, i) => (
              <DemoFillButton key={i} label={demo.name} onFill={() => setForm(demo)} />
            ))}
          </div>
          <div>
            <label className="label">Nom de l'entreprise</label>
            <input
              className="input"
              placeholder="Ex: TRANSORIENT SARL"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ville</label>
              <select
                className="input"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
              >
                <option value="">Sélectionner</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Secteur</label>
              <select
                className="input"
                value={form.sector}
                onChange={e => setForm({ ...form, sector: e.target.value })}
              >
                <option value="">Sélectionner</option>
                {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description des services</label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="Décrivez vos services en français ou darija... Ex: Transport de conteneurs et logistique portuaire, flotte de 8 camions frigorifiques certifiés ADR..."
              value={form.raw_description}
              onChange={e => setForm({ ...form, raw_description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Extraction en cours...</>
              : "S'inscrire & Extraire les Tags"
            }
          </button>
        </form>
      </div>

      {result && (
        <div className="card p-5 mt-4 border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-success" />
            <span className="text-sm font-semibold text-success">PME inscrite — Tags extraits par l'IA</span>
          </div>
          <p className="text-xs text-muted mb-3">{result.capacity_summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {result.tags?.map(t => <TagBadge key={t} tag={t} sector={result.sector} />)}
          </div>
        </div>
      )}
    </div>
  )
}
