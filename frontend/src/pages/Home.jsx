import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import PropTypes from "prop-types"
import {
  Building2, FileText, Zap,
  ArrowRight, Users, Target, BarChart2, Award, Anchor,
} from "lucide-react"
import { smeApi, needsApi, matchingApi } from "../api/client"
import SMECard from "../components/SMECard"
import NeedCard from "../components/NeedCard"

const KPI_ICONS = [
  { icon: Users, color: "text-brand", bg: "bg-blue-50" },
  { icon: Target, color: "text-teal", bg: "bg-cyan-50" },
  { icon: BarChart2, color: "text-success", bg: "bg-green-50" },
  { icon: Award, color: "text-warning", bg: "bg-amber-50" },
]

const KPI_ICONS_PORT = [
  { icon: Target, color: "text-teal", bg: "bg-cyan-50" },
  { icon: Users, color: "text-brand", bg: "bg-blue-50" },
  { icon: Zap, color: "text-violet-600", bg: "bg-violet-50" },
  { icon: BarChart2, color: "text-success", bg: "bg-green-50" },
]

function KPIGrid({ kpis, icons, loading }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      {kpis.map((kpi, i) => {
        const { icon: Icon, color, bg } = icons[i]
        return (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">{kpi.label}</p>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{loading ? "—" : kpi.value}</p>
          </div>
        )
      })}
    </div>
  )
}

KPIGrid.propTypes = {
  kpis: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.any })).isRequired,
  icons: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
}

function PMEHome({ stats, smes, needs, loading }) {
  const kpis = [
    { label: "Total PMEs", value: stats.total_smes },
    { label: "Total Besoins", value: stats.total_needs },
    { label: "Taux de Match", value: `${stats.match_rate}%` },
    { label: "Score Moyen", value: `${stats.avg_score}/100` },
  ]

  return (
    <div>
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand-light text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 bg-brand-light rounded-full animate-pulse" />
              PME — Région Orientale
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
              Bienvenue sur <span className="text-brand-light">PORT2REGION IA</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Inscrivez votre entreprise et découvrez les opportunités du port Nador West Med grâce à l&apos;IA.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">
                <Building2 size={15} />
                Mon Profil PME
              </Link>
              <Link to="/matching" className="btn-secondary">
                <Zap size={15} />
                Mes Opportunités
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KPIGrid kpis={kpis} icons={KPI_ICONS} loading={loading} />
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Derniers Besoins</h2>
              <Link to="/matching" className="text-xs text-brand font-medium hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {needs.length
                ? needs.map(n => <NeedCard key={n.id} need={n} />)
                : <p className="text-sm text-muted">Aucun besoin publié.</p>
              }
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Dernières PMEs inscrites</h2>
              <Link to="/register" className="text-xs text-brand font-medium hover:underline flex items-center gap-1">
                Inscrire <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {smes.length
                ? smes.map(s => <SMECard key={s.id} sme={s} />)
                : <p className="text-sm text-muted">Aucune PME inscrite.</p>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

PMEHome.propTypes = {
  stats: PropTypes.object.isRequired,
  smes: PropTypes.array.isRequired,
  needs: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
}

function PortHome({ stats, needs, loading }) {
  const kpis = [
    { label: "Besoins publiés", value: stats.total_needs },
    { label: "PMEs inscrites", value: stats.total_smes },
    { label: "Matchings effectués", value: stats.total_matches },
    { label: "Taux de couverture", value: `${stats.match_rate}%` },
  ]

  return (
    <div>
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs font-medium mb-4">
              <Anchor size={12} />
              Nador West Med — Port Authority
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
              Tableau de bord <span className="text-teal-400">Port</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Gérez vos besoins en prestataires et lancez le matching automatique par IA.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/needs/publish" className="btn-primary">
                <FileText size={15} />
                Publier un Besoin
              </Link>
              <Link to="/matching" className="btn-secondary">
                <Zap size={15} />
                Lancer le Matching
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KPIGrid kpis={kpis} icons={KPI_ICONS_PORT} loading={loading} />
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Besoins Publiés</h2>
            <Link to="/needs/publish" className="text-xs text-brand font-medium hover:underline flex items-center gap-1">
              Nouveau <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {needs.length
              ? needs.map(n => <NeedCard key={n.id} need={n} />)
              : <p className="text-sm text-muted">Aucun besoin publié.</p>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

PortHome.propTypes = {
  stats: PropTypes.object.isRequired,
  needs: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
}

export default function Home() {
  const navigate = useNavigate()
  const role = localStorage.getItem("port2region_role")

  const [stats, setStats] = useState({ total_smes: 0, total_needs: 0, match_rate: 0, avg_score: 0, total_matches: 0 })
  const [smes, setSmes] = useState([])
  const [needs, setNeeds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!role) {
      navigate("/role-select")
      return
    }
    if (role === "investisseur") {
      navigate("/dashboard")
      return
    }
    if (role === "pme" && localStorage.getItem("port2region_current_pme")) {
      navigate("/smes-dashboard")
      return
    }

    Promise.all([smeApi.list(), needsApi.list(), matchingApi.history()])
      .then(([smeRes, needRes, matchRes]) => {
        const allSmes = smeRes.data?.data ?? []
        const allNeeds = needRes.data?.data ?? []
        const allMatches = matchRes.data?.data ?? []
        const needsWithMatch = new Set(allMatches.map(m => m.need_id)).size
        const avgScore = allMatches.length
          ? Math.round(allMatches.reduce((a, m) => a + m.total_score, 0) / allMatches.length)
          : 0
        setStats({
          total_smes: allSmes.length,
          total_needs: allNeeds.length,
          total_matches: allMatches.length,
          match_rate: allNeeds.length ? Math.round((needsWithMatch / allNeeds.length) * 100) : 0,
          avg_score: avgScore,
        })
        setSmes(allSmes.slice(-3).reverse())
        setNeeds(allNeeds.slice(-3).reverse())
      })
      .finally(() => setLoading(false))
  }, [role, navigate])

  if (!role || role === "investisseur") return null

  if (role === "port") {
    return <PortHome stats={stats} needs={needs} loading={loading} />
  }

  return <PMEHome stats={stats} smes={smes} needs={needs} loading={loading} />
}
