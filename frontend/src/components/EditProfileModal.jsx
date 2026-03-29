import { useState } from "react"
import PropTypes from "prop-types"
import { X, Save, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { smeApi } from "../api/client"

const SECTOR_OPTIONS = [
  { value: "transport", label: "Transport & Logistique" },
  { value: "agroalim", label: "Agroalimentaire" },
  { value: "it", label: "IT & Numérique" },
  { value: "hospitality", label: "Hôtellerie & Restauration" },
  { value: "btp", label: "BTP & Construction" },
  { value: "maintenance", label: "Maintenance Industrielle" },
]

const CITIES = ["Nador", "Oujda", "Berkane", "Taourirt", "Casablanca", "Tanger", "Agadir", "Autre"]

/**
 * Modal for editing an SME profile in-place.
 * Calls smeApi.update() and then updates localStorage + parent state.
 */
export default function EditProfileModal({ sme, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: sme.name || "",
    city: sme.city || "",
    sector: sme.sector || "",
    raw_description: sme.raw_description || "",
    rce: sme.rce || "",
    ice: sme.ice || "",
    is_available: sme.is_available !== false,
  })
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name || !form.city || !form.sector) {
      toast.error("Nom, ville et secteur sont requis.")
      return
    }
    setSaving(true)
    try {
      const res = await smeApi.update(sme.id, form)
      if (!res.data.success) {
        toast.error(res.data.error || "Erreur lors de la mise à jour")
        return
      }
      const updated = res.data.data
      localStorage.setItem("port2region_current_pme", JSON.stringify(updated))
      toast.success("Profil mis à jour !")
      onUpdated(updated)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-bold text-slate-900">Modifier mon profil</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-slate-900 hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="label">Nom de l&apos;entreprise</label>
            <input
              className="input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="TRANSORIENT SARL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ville</label>
              <select className="input" name="city" value={form.city} onChange={handleChange}>
                <option value="">Sélectionner</option>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Secteur</label>
              <select className="input" name="sector" value={form.sector} onChange={handleChange}>
                <option value="">Sélectionner</option>
                {SECTOR_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description des services</label>
            <textarea
              className="input resize-none"
              name="raw_description"
              rows={3}
              value={form.raw_description}
              onChange={handleChange}
              placeholder="Décrivez vos services et capacités…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">RCE</label>
              <input
                className="input"
                name="rce"
                value={form.rce}
                onChange={handleChange}
                placeholder="RC/121323/2019"
              />
            </div>
            <div>
              <label className="label">ICE</label>
              <input
                className="input"
                name="ice"
                value={form.ice}
                onChange={handleChange}
                placeholder="001234567000012"
              />
            </div>
          </div>

          {/* Availability toggle */}
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
                {form.is_available
                  ? "Votre PME apparaît comme disponible"
                  : "Votre PME apparaît comme non disponible"}
              </p>
            </div>
            <span
              className={`ml-auto w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                form.is_available ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center py-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 justify-center py-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Enregistrement…
                </>
              ) : (
                <>
                  <Save size={14} /> Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

EditProfileModal.propTypes = {
  /** Current SME data to pre-fill the form */
  sme: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    city: PropTypes.string,
    sector: PropTypes.string,
    raw_description: PropTypes.string,
    rce: PropTypes.string,
    ice: PropTypes.string,
    is_available: PropTypes.bool,
  }).isRequired,
  /** Called when user closes without saving */
  onClose: PropTypes.func.isRequired,
  /** Called with the updated SME record after a successful save */
  onUpdated: PropTypes.func.isRequired,
}
