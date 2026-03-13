import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import toast from "react-hot-toast"

const LS_KEY = "port2region_premium"
const PREMIUM_EVENT = "port2region:premium-change"

export function usePremium() {
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem(LS_KEY) === "true")

  useEffect(() => {
    const handler = () => setIsPremium(localStorage.getItem(LS_KEY) === "true")
    window.addEventListener(PREMIUM_EVENT, handler)
    return () => window.removeEventListener(PREMIUM_EVENT, handler)
  }, [])

  return isPremium
}

export default function PremiumToggle({ inline = false }) {
  const [isPremium, setIsPremium] = useState(() => localStorage.getItem(LS_KEY) === "true")

  useEffect(() => {
    const handler = () => setIsPremium(localStorage.getItem(LS_KEY) === "true")
    window.addEventListener(PREMIUM_EVENT, handler)
    return () => window.removeEventListener(PREMIUM_EVENT, handler)
  }, [])

  function toggle() {
    const next = !isPremium
    localStorage.setItem(LS_KEY, String(next))
    setIsPremium(next)
    window.dispatchEvent(new Event(PREMIUM_EVENT))
    if (next) {
      toast.success("Mode Premium activé — Toutes les fonctionnalités débloquées", { icon: "⭐" })
    } else {
      toast("Mode Gratuit", { icon: "🔓" })
    }
  }

  if (inline) {
    return (
      <button
        onClick={toggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
          isPremium
            ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
        }`}
      >
        <span>{isPremium ? "⭐" : "🔓"}</span>
        <span>{isPremium ? "Premium actif" : "Passer Premium"}</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggle}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-lg transition-all ${
          isPremium
            ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:border-amber-400 hover:text-amber-700"
        }`}
        title={isPremium ? "Mode Premium actif — cliquer pour désactiver" : "Activer le mode Premium"}
      >
        <span className="text-base">{isPremium ? "⭐" : "🔓"}</span>
        <span>{isPremium ? "Premium" : "Gratuit"}</span>
      </button>
    </div>
  )
}

PremiumToggle.propTypes = {
  inline: PropTypes.bool,
}
