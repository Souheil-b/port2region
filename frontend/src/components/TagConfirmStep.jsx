import { useState } from "react"
import PropTypes from "prop-types"
import { X, Plus, CheckCircle2 } from "lucide-react"
import TagBadge from "./TagBadge"

/**
 * Tag confirmation step shown after AI extraction.
 * Lets users remove unwanted tags and add custom ones before saving.
 */
export default function TagConfirmStep({ tags, sector, onConfirm, onBack }) {
  const [currentTags, setCurrentTags] = useState([...tags])
  const [inputValue, setInputValue] = useState("")

  function removeTag(tag) {
    setCurrentTags((prev) => prev.filter((t) => t !== tag))
  }

  function addTag() {
    const cleaned = inputValue.trim().toLowerCase().replace(/\s+/g, "_")
    if (!cleaned || currentTags.includes(cleaned)) {
      setInputValue("")
      return
    }
    setCurrentTags((prev) => [...prev, cleaned])
    setInputValue("")
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 size={18} className="text-green-500" />
        <h3 className="text-base font-bold text-slate-900">Confirmer les tags extraits par l&apos;IA</h3>
      </div>
      <p className="text-xs text-muted mb-4">
        Retirez les tags non pertinents ou ajoutez vos propres tags avant d&apos;enregistrer.
      </p>

      {/* Tag pills */}
      <div className="flex flex-wrap gap-1.5 mb-4 min-h-[2rem]">
        {currentTags.length === 0 ? (
          <p className="text-xs text-muted italic">Aucun tag — ajoutez-en ci-dessous.</p>
        ) : (
          currentTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium"
            >
              <TagBadge tag={tag} sector={sector} />
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors"
                aria-label={`Retirer ${tag}`}
              >
                <X size={11} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add custom tag */}
      <div className="flex gap-2 mb-5">
        <input
          className="input flex-1 text-sm"
          placeholder="Ajouter un tag personnalisé…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={addTag}
          className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm"
          disabled={!inputValue.trim()}
        >
          <Plus size={13} /> Ajouter
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex-1 justify-center py-2"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={() => onConfirm(currentTags)}
          className="btn-primary flex-1 justify-center py-2"
        >
          <CheckCircle2 size={14} /> Confirmer et enregistrer
        </button>
      </div>
    </div>
  )
}

TagConfirmStep.propTypes = {
  /** Tags returned by the AI extraction */
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Business sector for tag badge coloring */
  sector: PropTypes.string,
  /** Called with the final tags array when user confirms */
  onConfirm: PropTypes.func.isRequired,
  /** Called when user clicks Retour */
  onBack: PropTypes.func.isRequired,
}

TagConfirmStep.defaultProps = {
  sector: "transport",
}
