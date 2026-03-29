import { useState, useEffect, useMemo } from "react"
import { Building2, Loader2, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import { smeApi, geographyApi } from "../api/client"
import TagBadge from "../components/TagBadge"
import DemoFillButton from "../components/DemoFillButton"
import TagConfirmStep from "../components/TagConfirmStep"

const DEMO_SMES = [
  {
    name: "TRANSMED OUJDA SARL",
    city: "Oujda",
    sector: "transport",
    raw_description: "Transport de conteneurs et logistique portuaire, flotte de 4 camions plateau 6j/7, certifiés ADR. Zone Orientale et port Nador.",
    region_id: "oriental",
    port_id: "nador_west_med",
  },
  {
    name: "TECHNIMAINT BERKANE",
    city: "Berkane",
    sector: "maintenance",
    raw_description: "Maintenance industrielle et électromécanique, équipements portuaires et industriels, équipe 12 techniciens, intervention H24.",
    region_id: "oriental",
    port_id: "beni_ensar",
  },
  {
    name: "CASA FREIGHT SOLUTIONS",
    city: "Casablanca",
    sector: "transport",
    raw_description: "Logistique et fret maritime à Casablanca, 8 camions plateaux et 2 grues mobiles, zone portuaire, certifiés ISO 9001.",
    region_id: "casablanca_settat",
    port_id: "casablanca",
  },
]

const SECTORS = [
  { value: "transport", label: "Transport & Logistique" },
  { value: "agroalim", label: "Agroalimentaire" },
  { value: "it", label: "IT & Numérique" },
  { value: "hospitality", label: "Hôtellerie & Restauration" },
  { value: "btp", label: "BTP & Construction" },
  { value: "maintenance", label: "Maintenance Industrielle" },
]

const INITIAL_FORM = {
  name: "",
  city: "",
  sector: "",
  raw_description: "",
  region_id: "oriental",
  port_id: "nador_west_med",
  rce: "",
  ice: "",
  is_available: true,
}

export default function SMERegister() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [tagConfirmSme, setTagConfirmSme] = useState(null)

  const [regions, setRegions] = useState([])
  const [allPorts, setAllPorts] = useState([])

  useEffect(() => {
    async function loadGeo() {
      try {
        const [regRes, portRes] = await Promise.all([
          geographyApi.regions(),
          geographyApi.ports(),
        ])
        setRegions(regRes.data?.data ?? [])
        setAllPorts(portRes.data?.data ?? [])
      } catch {
        // fallback — form still works without geography data
      }
    }
    loadGeo()
  }, [])

  const filteredPorts = useMemo(
    () => (form.region_id ? allPorts.filter(p => p.region_id === form.region_id) : allPorts),
    [allPorts, form.region_id]
  )

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    const newVal = type === "checkbox" ? checked : value
    if (name === "region_id") {
      setForm(prev => ({ ...prev, region_id: value, port_id: "" }))
    } else {
      setForm(prev => ({ ...prev, [name]: newVal }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.city || !form.sector || !form.raw_description) {
      toast.error("Tous les champs obligatoires sont requis")
      return
    }
    setLoading(true)
    try {
      const res = await smeApi.register(form)
      const sme = res.data.data
      toast.success("PME inscrite — confirmez les tags extraits par l'IA")
      setForm(INITIAL_FORM)
      setTagConfirmSme(sme)
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  async function handleTagsConfirm(finalTags) {
    const originalTags = (tagConfirmSme.tags || []).slice().sort().join(",")
    const confirmedTags = finalTags.slice().sort().join(",")
    if (confirmedTags !== originalTags) {
      try {
        await smeApi.update(tagConfirmSme.id, { tags: finalTags })
      } catch {
        // non-blocking — best effort
      }
    }
    setResult({ ...tagConfirmSme, tags: finalTags })
    setTagConfirmSme(null)
    toast.success("PME inscrite avec succès !")
  }

  // Tag confirmation step
  if (tagConfirmSme) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <TagConfirmStep
          tags={tagConfirmSme.tags || []}
          sector={tagConfirmSme.sector}
          onConfirm={handleTagsConfirm}
          onBack={() => setTagConfirmSme(null)}
        />
      </div>
    )
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
          L&apos;IA extrait automatiquement vos tags de service à partir de votre description.
        </p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-wrap gap-2 p-3 bg-violet-50 border border-violet-100 rounded-lg">
            <span className="text-xs text-violet-600 font-medium w-full mb-1">✏️ Exemples de démo :</span>
            {DEMO_SMES.map((demo, i) => (
              <DemoFillButton key={i} label={demo.name} onFill={() => setForm(prev => ({ ...prev, ...demo }))} />
            ))}
          </div>

          <div>
            <label className="label">Nom de l&apos;entreprise</label>
            <input
              className="input"
              name="name"
              placeholder="Ex: TRANSORIENT SARL"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Région</label>
              <select className="input" name="region_id" value={form.region_id} onChange={handleChange}>
                <option value="">Sélectionner</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Port de rattachement</label>
              <select className="input" name="port_id" value={form.port_id} onChange={handleChange}>
                <option value="">Tous les ports</option>
                {filteredPorts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ville</label>
              <input
                className="input"
                name="city"
                placeholder="Ex: Nador"
                value={form.city}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Secteur</label>
              <select className="input" name="sector" value={form.sector} onChange={handleChange}>
                <option value="">Sélectionner</option>
                {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">RCE <span className="text-muted font-normal">(optionnel)</span></label>
              <input
                className="input"
                name="rce"
                placeholder="RC/121323/2019"
                value={form.rce}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">ICE <span className="text-muted font-normal">(optionnel)</span></label>
              <input
                className="input"
                name="ice"
                placeholder="001234567000012"
                value={form.ice}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="label">Description des services</label>
            <textarea
              className="input resize-none"
              name="raw_description"
              rows={4}
              placeholder="Décrivez vos services en français ou darija…"
              value={form.raw_description}
              onChange={handleChange}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-brand/40 transition-colors">
            <input
              type="checkbox"
              name="is_available"
              checked={form.is_available}
              onChange={handleChange}
              className="w-4 h-4 accent-brand"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">Disponible pour des missions</p>
              <p className="text-xs text-muted">
                {form.is_available ? "Apparaîtra comme disponible" : "Apparaîtra comme non disponible"}
              </p>
            </div>
            <span className={`ml-auto w-2.5 h-2.5 rounded-full flex-shrink-0 ${form.is_available ? "bg-green-500" : "bg-gray-300"}`} />
          </label>

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
            <span className="text-sm font-semibold text-success">PME inscrite — Tags extraits par l&apos;IA</span>
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
