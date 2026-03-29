import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, Anchor, TrendingUp } from "lucide-react"
import { geographyApi } from "../api/client"

const ROLES = [
  {
    key: "pme",
    title: "PME",
    icon: Building2,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    borderColor: "hover:border-blue-500",
    btnColor: "bg-blue-600 hover:bg-blue-700",
    description: "Inscrivez votre entreprise et accédez aux opportunités des ports marocains",
    to: "/pme-auth",
  },
  {
    key: "port",
    title: "Opérateur Portuaire National",
    icon: Anchor,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-100",
    borderColor: "hover:border-teal-500",
    btnColor: "bg-teal-600 hover:bg-teal-700",
    description: "Publiez vos besoins en prestataires et lancez le matching intelligent",
    to: "/needs",
  },
  {
    key: "investisseur",
    title: "Investisseur",
    icon: TrendingUp,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    borderColor: "hover:border-amber-500",
    btnColor: "bg-amber-600 hover:bg-amber-700",
    description: "Analysez le marché national, identifiez les gaps et les opportunités d'investissement",
    to: "/dashboard",
  },
]

export default function RoleSelect() {
  const navigate = useNavigate()
  const [ports, setPorts] = useState([])
  const [selectedPortId, setSelectedPortId] = useState("")

  useEffect(() => {
    geographyApi.ports().then((res) => {
      const data = res.data?.data ?? []
      setPorts(data)
      if (data.length > 0) setSelectedPortId(data[0].id)
    }).catch(() => {})
  }, [])

  function handleSelect(role) {
    localStorage.setItem("port2region_role", role.key)
    // Clear PME session when switching roles
    if (role.key !== "pme") {
      localStorage.removeItem("port2region_current_pme")
    }
    // Store selected port for port role
    if (role.key === "port" && selectedPortId) {
      const port = ports.find((p) => p.id === selectedPortId)
      if (port) {
        localStorage.setItem("port2region_current_port", JSON.stringify(port))
      }
    }
    navigate(role.to)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Anchor size={20} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-2xl tracking-wide">
            PORT2REGION <span className="text-blue-400">IA</span>
          </span>
        </div>

        <p className="text-gray-400 text-base mb-12 text-center max-w-md">
          Sélectionnez votre profil pour accéder à votre espace
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {ROLES.map((role) => {
            const Icon = role.icon
            return (
              <div
                key={role.key}
                className={`bg-white rounded-2xl p-8 flex flex-col items-center text-center border-2 border-transparent ${role.borderColor} transition-all duration-200 hover:scale-105 cursor-pointer shadow-lg`}
                onClick={() => handleSelect(role)}
              >
                <div className={`w-16 h-16 ${role.iconBg} rounded-full flex items-center justify-center mb-5`}>
                  <Icon size={32} className={role.iconColor} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3">{role.title}</h2>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">{role.description}</p>

                {/* Port selector for port role */}
                {role.key === "port" && ports.length > 0 && (
                  <div className="w-full mb-4" onClick={(e) => e.stopPropagation()}>
                    <label className="text-xs text-slate-500 font-medium mb-1 block text-left">
                      Port sélectionné
                    </label>
                    <select
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      value={selectedPortId}
                      onChange={(e) => setSelectedPortId(e.target.value)}
                    >
                      {ports.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  className={`w-full py-2.5 px-6 ${role.btnColor} text-white text-sm font-semibold rounded-xl transition-colors`}
                  onClick={(e) => { e.stopPropagation(); handleSelect(role) }}
                >
                  Accéder →
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-500 border-t border-slate-800">
        PORT2REGION IA — Ramadan IA Hackathon 2025 — Ministère de la Transition Numérique × Jazari Institute
      </footer>
    </div>
  )
}
