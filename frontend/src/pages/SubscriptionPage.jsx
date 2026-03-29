import { useState } from "react"
import { Star, Check, Lock, Zap, TrendingUp, BarChart2, FileText, Users } from "lucide-react"
import toast from "react-hot-toast"
import PremiumToggle, { usePremium } from "../components/PremiumToggle"

const LS_PREMIUM = "port2region_premium"

const FEATURES = [
  {
    icon: FileText,
    label: "Voir tous les besoins publiés",
    freemium: true,
    premium: true,
  },
  {
    icon: Users,
    label: "Inscription PME & profil public",
    freemium: true,
    premium: true,
  },
  {
    icon: Zap,
    label: "Matching basique (score global)",
    freemium: true,
    premium: true,
  },
  {
    icon: Star,
    label: "Score IA détaillé par composante",
    freemium: false,
    premium: true,
  },
  {
    icon: TrendingUp,
    label: "Opportunités gap investisseur",
    freemium: false,
    premium: true,
  },
  {
    icon: Zap,
    label: "Matching personnalisé PME (Mon score face aux besoins)",
    freemium: false,
    premium: true,
  },
  {
    icon: BarChart2,
    label: "Export données et rapports marché",
    freemium: false,
    premium: true,
  },
]

function PlanBadge({ isPremium }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
        isPremium
          ? "bg-amber-100 text-amber-700 border border-amber-300"
          : "bg-gray-100 text-gray-600 border border-gray-200"
      }`}
    >
      {isPremium ? <Star size={11} className="fill-amber-500 text-amber-500" /> : <Lock size={11} />}
      {isPremium ? "Mode Premium actif" : "Freemium"}
    </span>
  )
}

import PropTypes from "prop-types"
PlanBadge.propTypes = { isPremium: PropTypes.bool.isRequired }

export default function SubscriptionPage() {
  const isPremium = usePremium()
  const [upgrading, setUpgrading] = useState(false)

  function handleUpgrade() {
    setUpgrading(true)
    setTimeout(() => {
      localStorage.setItem(LS_PREMIUM, "true")
      window.dispatchEvent(new Event("storage"))
      toast.success("Mode Premium activé !")
      setUpgrading(false)
    }, 600)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
            <Star size={18} className="text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Abonnement</h1>
        </div>
        <p className="text-sm text-muted ml-12">Gérez votre plan et accédez aux fonctionnalités premium.</p>
      </div>

      {/* Current plan */}
      <div className="card p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted mb-1">Plan actuel</p>
          <PlanBadge isPremium={isPremium} />
        </div>
        <PremiumToggle inline />
      </div>

      {/* Comparison table */}
      <div className="card overflow-hidden mb-6">
        <div className="grid grid-cols-3 text-center">
          {/* Header */}
          <div className="p-4 border-b border-r border-gray-100">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Fonctionnalité</p>
          </div>
          <div className="p-4 border-b border-r border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-slate-700">Freemium</p>
            <p className="text-xs text-muted">Gratuit</p>
          </div>
          <div className="p-4 border-b border-gray-100 bg-amber-50">
            <p className="text-xs font-bold text-amber-700 flex items-center justify-center gap-1">
              <Star size={10} className="fill-amber-500 text-amber-500" /> Premium
            </p>
            <p className="text-xs text-amber-600">Accès complet</p>
          </div>

          {/* Feature rows */}
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="contents">
                <div className="p-3 border-b border-r border-gray-100 flex items-center gap-2 text-left">
                  <Icon size={13} className="text-muted flex-shrink-0" />
                  <span className="text-xs text-slate-700">{f.label}</span>
                </div>
                <div className="p-3 border-b border-r border-gray-100 text-center bg-gray-50">
                  {f.freemium ? (
                    <Check size={15} className="mx-auto text-green-500" />
                  ) : (
                    <Lock size={13} className="mx-auto text-gray-300" />
                  )}
                </div>
                <div className="p-3 border-b border-gray-100 text-center bg-amber-50">
                  <Check size={15} className="mx-auto text-amber-500" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upgrade CTA */}
      {!isPremium && (
        <div className="card p-6 text-center border-amber-200 bg-amber-50">
          <Star size={32} className="mx-auto text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Passez au Premium</h2>
          <p className="text-sm text-muted mb-4">
            Accédez aux scores IA détaillés, aux opportunités d&apos;investissement et au matching personnalisé.
          </p>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="btn-primary py-2.5 px-8 justify-center"
          >
            {upgrading ? "Activation…" : "Activer le Mode Premium — Démo gratuite"}
          </button>
        </div>
      )}

      {isPremium && (
        <div className="card p-5 border-green-200 bg-green-50 flex items-center gap-3">
          <Check size={20} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">Mode Premium actif</p>
            <p className="text-xs text-green-700">Toutes les fonctionnalités avancées sont débloquées.</p>
          </div>
        </div>
      )}
    </div>
  )
}
