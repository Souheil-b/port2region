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
      toast("Mode Freemium", { icon: "🔓" })
    }
  }

  // inline = compact button used inside forms/cards
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

  // navbar = compact toggle switch shown in top bar
  return (
    <button
      onClick={toggle}
      title={isPremium ? "Premium actif — cliquer pour passer Freemium" : "Passer en Premium"}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
        isPremium
          ? "bg-amber-400 border-amber-300 text-white shadow-sm"
          : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
      }`}
    >
      <span className="text-sm leading-none">{isPremium ? "⭐" : "🔓"}</span>
      <span>{isPremium ? "Premium" : "Freemium"}</span>
      {/* Toggle track */}
      <span className={`ml-0.5 w-7 h-3.5 rounded-full flex items-center transition-colors relative ${isPremium ? "bg-white/30" : "bg-white/20"}`}>
        <span className={`absolute w-2.5 h-2.5 rounded-full bg-white shadow transition-all ${isPremium ? "left-[14px]" : "left-[2px]"}`} />
      </span>
    </button>
  )
}

PremiumToggle.propTypes = {
  inline: PropTypes.bool,
}
