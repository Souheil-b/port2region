import PropTypes from "prop-types"
import { Wand2 } from "lucide-react"
import toast from "react-hot-toast"

/**
 * A small button that pre-fills a form with demo data.
 * @param {function} onFill - called with the demo data object
 * @param {string} label - optional custom label
 */
export default function DemoFillButton({ onFill, label = "Remplir avec un exemple" }) {
  function handleClick() {
    onFill()
    toast("Formulaire pré-rempli — modifiable avant envoi", { icon: "✏️", duration: 2500 })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
    >
      <Wand2 size={13} />
      {label}
    </button>
  )
}

DemoFillButton.propTypes = {
  onFill: PropTypes.func.isRequired,
  label: PropTypes.string,
}
