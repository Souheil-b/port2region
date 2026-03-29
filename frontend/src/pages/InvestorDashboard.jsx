import { useEffect, useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Loader2, TrendingUp, Building2, Target, BarChart2, Zap, AlertTriangle, Lock } from "lucide-react"
import PropTypes from "prop-types"
import toast from "react-hot-toast"
import PremiumToggle, { usePremium } from "../components/PremiumToggle"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { smeApi, needsApi, matchingApi, geographyApi } from "../api/client"
import GapCard from "../components/GapCard"
import RegionPortFilter from "../components/RegionPortFilter"
import { SECTOR_LABELS, REGION_LABELS } from "../utils/formatters"

const CHART_COLORS = ["#2563eb", "#0891b2", "#7c3aed", "#d97706", "#16a34a", "#dc2626"]

const KPI_DEFS = [
  { key: "total_smes", label: "PMEs", icon: Building2, color: "text-brand", bg: "bg-blue-50" },
  { key: "total_needs", label: "Besoins", icon: Target, color: "text-teal", bg: "bg-cyan-50" },
  { key: "total_matches", label: "Matchings", icon: Zap, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "match_rate", label: "Taux de Match", icon: BarChart2, color: "text-success", bg: "bg-green-50", suffix: "%" },
  { key: "avg_score", label: "Score Moyen", icon: TrendingUp, color: "text-warning", bg: "bg-amber-50", suffix: "/100" },
]

function MetricRow({ label, value, max, color, suffix = "" }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value}{suffix}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

MetricRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  suffix: PropTypes.string,
}

export default function InvestorDashboard() {
  const isPremium = usePremium()
  const [loading, setLoading] = useState(true)

  // Raw data storage
  const [rawSmes, setRawSmes] = useState([])
  const [rawNeeds, setRawNeeds] = useState([])
  const [rawMatches, setRawMatches] = useState([])
  const [rawGaps, setRawGaps] = useState([])
  const [ports, setPorts] = useState([])

  // Active filter
  const [filter, setFilter] = useState({ region_id: "", port_id: "" })

  useEffect(() => {
    async function load() {
      try {
        const [smesRes, needsRes, matchesRes, gapsRes, portsRes] = await Promise.all([
          smeApi.list(), needsApi.list(), matchingApi.history(), matchingApi.gaps(), geographyApi.ports(),
        ])
        setRawSmes(smesRes.data?.data ?? [])
        setRawNeeds(needsRes.data?.data ?? [])
        setRawMatches(matchesRes.data?.data ?? [])
        setRawGaps(gapsRes.data?.data ?? [])
        setPorts(portsRes.data?.data ?? [])
      } catch (_err) {
        toast.error("Erreur lors du chargement du dashboard.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filtered data
  const filteredSmes = useMemo(() => rawSmes.filter(s => {
    if (filter.port_id && s.port_id !== filter.port_id) return false
    if (filter.region_id && !filter.port_id && s.region_id !== filter.region_id) return false
    return true
  }), [rawSmes, filter])

  const filteredNeeds = useMemo(() => rawNeeds.filter(n => {
    if (filter.port_id && n.port_id !== filter.port_id) return false
    if (filter.region_id && !filter.port_id) {
      const port = ports.find(p => p.id === n.port_id)
      if (port && port.region_id !== filter.region_id) return false
    }
    return true
  }), [rawNeeds, filter, ports])

  const filteredMatches = useMemo(() => {
    const smeIds = new Set(filteredSmes.map(s => s.id))
    return rawMatches.filter(m => smeIds.has(m.sme_id))
  }, [rawMatches, filteredSmes])

  const filteredGaps = useMemo(() => {
    const needIds = new Set(filteredNeeds.map(n => n.id))
    return rawGaps.filter(g => needIds.has(g.need_id))
  }, [rawGaps, filteredNeeds])

  const stats = useMemo(() => {
    const needsWithMatch = new Set(filteredMatches.map(m => m.need_id))
    const matchRate = filteredNeeds.length > 0
      ? Math.round((needsWithMatch.size / filteredNeeds.length) * 100) : 0
    const avgScore = filteredMatches.length > 0
      ? Math.round(filteredMatches.reduce((acc, m) => acc + m.total_score, 0) / filteredMatches.length) : 0
    return {
      total_smes: filteredSmes.length,
      total_needs: filteredNeeds.length,
      total_matches: filteredMatches.length,
      avg_score: avgScore,
      match_rate: matchRate,
    }
  }, [filteredSmes, filteredNeeds, filteredMatches])

  const sectorData = useMemo(() => {
    const counts = filteredSmes.reduce((acc, s) => { acc[s.sector] = (acc[s.sector] || 0) + 1; return acc }, {})
    return Object.entries(counts).map(([sector, count]) => ({
      name: SECTOR_LABELS[sector] || sector, count,
    }))
  }, [filteredSmes])

  const subtitle = useMemo(() => {
    if (filter.port_id) {
      const port = ports.find(p => p.id === filter.port_id)
      return `Port ${port?.name || filter.port_id}`
    }
    if (filter.region_id) {
      return `Région ${REGION_LABELS[filter.region_id] || filter.region_id}`
    }
    return "Vue Nationale — toutes les régions"
  }, [filter, ports])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center gap-3 text-muted">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Chargement du dashboard…</span>
      </div>
    )
  }

  return (
    <div>
      {/* Dark header section */}
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand/20 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-brand-light" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard Investisseur</h1>
                <p className="text-xs text-gray-400">{subtitle}</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <RegionPortFilter onChange={setFilter} />
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {KPI_DEFS.map(({ key, label, icon: Icon, color, bg, suffix = "" }) => (
              <div key={key} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                  <div className={`w-6 h-6 ${bg} rounded-md flex items-center justify-center`}>
                    <Icon size={12} className={color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stats[key]}{suffix}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Sector distribution chart */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Répartition par Secteur</h2>
            {sectorData.length === 0 ? (
              <p className="text-sm text-muted">Aucune donnée secteur.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sectorData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }}
                    cursor={{ fill: "rgba(37,99,235,0.05)" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {sectorData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Metric bars */}
          <div className="card p-5">
            <h2 className="section-title mb-4">Indicateurs Clés</h2>
            <div className="space-y-4">
              <MetricRow label="PMEs enregistrées" value={stats.total_smes} max={50} color="bg-brand" />
              <MetricRow label="Besoins publiés" value={stats.total_needs} max={20} color="bg-teal" />
              <MetricRow label="Matchings effectués" value={stats.total_matches} max={100} color="bg-violet-500" />
              <MetricRow label="Taux de couverture" value={stats.match_rate} max={100} color="bg-success" suffix="%" />
              <MetricRow label="Score moyen IA" value={stats.avg_score} max={100} color="bg-warning" suffix="/100" />
            </div>
          </div>
        </div>

        {/* Gap opportunities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              Opportunités d&apos;Investissement
              <span className="ml-2 text-muted font-normal text-sm">({filteredGaps.length})</span>
            </h2>
            <PremiumToggle inline />
          </div>
          {isPremium ? (
            filteredGaps.length === 0 ? (
              <div className="card p-10 text-center">
                <AlertTriangle size={28} className="text-muted mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-800 mb-1">Aucune opportunité détectée</p>
                <p className="text-xs text-muted mb-4">Lancez des matchings pour générer des analyses d&apos;opportunités.</p>
                <Link to="/matching" className="text-xs text-brand font-medium hover:underline">
                  Aller au Matching →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGaps.map((gap) => <GapCard key={gap.id} gap={gap} />)}
              </div>
            )
          ) : (
            <div className="relative">
              <div className="blur-sm pointer-events-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGaps.slice(0, 3).map((gap) => <GapCard key={gap.id} gap={gap} />)}
                  {filteredGaps.length === 0 && (
                    <>
                      <div className="card p-5"><p className="text-sm font-bold text-slate-900">Ingénierie Maritime</p><p className="text-xs text-muted mt-1">Opportunité détectée…</p></div>
                      <div className="card p-5"><p className="text-sm font-bold text-slate-900">Consignation</p><p className="text-xs text-muted mt-1">Gap de marché identifié…</p></div>
                    </>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-xl">
                <Lock size={24} className="text-slate-400 mb-2" />
                <p className="font-semibold text-slate-900 mb-1">Fonctionnalité Premium</p>
                <p className="text-xs text-muted mb-3 text-center max-w-xs">
                  Accédez aux opportunités d&apos;investissement détaillées générées par l&apos;IA
                </p>
                <PremiumToggle inline />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
