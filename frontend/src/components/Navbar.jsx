import { NavLink, useNavigate } from "react-router-dom"
import { Anchor, Building2, FileText, Zap, TrendingUp, BarChart2, Users, List, LayoutDashboard } from "lucide-react"
import { usePremium } from "./PremiumToggle"

const NAV_LINKS = {
  pme: [
    { to: "/smes-dashboard", label: "Mon Espace", icon: LayoutDashboard },
    { to: "/needs", label: "Besoins du Port", icon: List },
    { to: "/smes", label: "Toutes les PMEs", icon: Users },
  ],
  port: [
    { to: "/needs", label: "Mes Besoins", icon: List },
    { to: "/needs/publish", label: "Publier un Besoin", icon: FileText },
    { to: "/smes", label: "PMEs Disponibles", icon: Users },
  ],
  investisseur: [
    { to: "/dashboard", label: "Opportunités Gaps", icon: TrendingUp },
    { to: "/dashboard/market", label: "Données Marché CRI", icon: BarChart2 },
    { to: "/smes", label: "PMEs Inscrites", icon: Users },
    { to: "/needs", label: "Besoins Publiés", icon: List },
  ],
}

const ROLE_COLORS = {
  pme: "bg-blue-100 text-blue-700",
  port: "bg-cyan-100 text-cyan-700",
  investisseur: "bg-amber-100 text-amber-700",
}

function getCurrentPmeName() {
  try {
    const stored = localStorage.getItem("port2region_current_pme")
    if (!stored) return null
    const pme = JSON.parse(stored)
    return pme?.name || null
  } catch {
    return null
  }
}

export default function Navbar() {
  const navigate = useNavigate()
  const role = localStorage.getItem("port2region_role")
  const links = role ? (NAV_LINKS[role] ?? []) : []
  const isPremium = usePremium()
  const pmeName = role === "pme" ? getCurrentPmeName() : null

  const roleLabel =
    role === "pme" && pmeName
      ? pmeName.length > 18 ? pmeName.slice(0, 17) + "…" : pmeName
      : { pme: "PME", port: "Port Nador Med", investisseur: "Investisseur" }[role] ?? role

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Anchor size={14} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-wide hidden sm:block">
              PORT2REGION <span className="text-blue-400">IA</span>
            </span>
          </NavLink>

          {/* Nav links */}
          <div className="flex items-center gap-1 overflow-x-auto flex-1 justify-center">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-slate-700"
                  }`
                }
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Role badge + premium star + switch */}
          <div className="flex items-center gap-2 shrink-0">
            {role && (
              <div className="flex items-center gap-1">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700"}`}>
                  {role === "pme" && <Building2 size={10} className="inline mr-1" />}
                  {roleLabel}
                </span>
                {isPremium && <span className="text-amber-400 text-sm leading-none" title="Mode Premium actif">⭐</span>}
              </div>
            )}
            <button
              onClick={() => { localStorage.removeItem("port2region_role"); navigate("/") }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Changer
            </button>
          </div>

        </div>
      </div>
    </nav>
  )
}
