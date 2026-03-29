import { useState, useEffect } from "react"
import { Lock } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import PremiumToggle, { usePremium } from "../components/PremiumToggle"
import { geographyApi } from "../api/client"
import { REGION_LABELS } from "../utils/formatters"

// CRI data per region (source: official CRI reports)
const REGION_DATA = {
  oriental: {
    kpis: { dossiers: 2222, statues: 1793, tauxStatut: "80.7%", investissement: "51.3 Mds MAD", emplois: "105 591" },
    source: "CRI Oriental — orientalinvest.ma | 2020-2024",
    sourceUrl: "https://orientalinvest.ma/barometre-de-linvestissement/",
    projetsParProvince: [
      { province: "Nador", projets: 280, investissement: 17450 },
      { province: "Berkane", projets: 203, investissement: 5760 },
      { province: "Oujda-Angad", projets: 195, investissement: 5100 },
      { province: "Taourirt", projets: 130, investissement: 3240 },
      { province: "Jerada", projets: 115, investissement: 2790 },
      { province: "Figuig", projets: 105, investissement: 2910 },
      { province: "Guercif", projets: 95, investissement: 2960 },
      { province: "Driouch", projets: 50, investissement: 4080 },
    ],
    projetsParSecteur: [
      { secteur: "Industrie transf.", projets: 280, emplois: 33000 },
      { secteur: "Tourisme", projets: 248, emplois: 6000 },
      { secteur: "Services divers", projets: 234, emplois: 5000 },
      { secteur: "Énergie & Mines", projets: 176, emplois: 5000 },
      { secteur: "Industrie extract.", projets: 121, emplois: 0 },
      { secteur: "BTP", projets: 46, emplois: 1000 },
      { secteur: "Agriculture & Pêche", projets: 15, emplois: 29000 },
    ],
    investParSecteur: [
      { name: "BTP", value: 13250, color: "#94a3b8" },
      { name: "Commerce", value: 12000, color: "#2563eb" },
      { name: "Logistique", value: 9310, color: "#0891b2" },
      { name: "Services divers", value: 2960, color: "#16a34a" },
      { name: "Tourisme", value: 2510, color: "#d97706" },
      { name: "Énergie & Mines", value: 940, color: "#7c3aed" },
    ],
    emploisParProvince: [
      { province: "Nador", emplois: 33000 },
      { province: "Figuig", emplois: 16000 },
      { province: "Driouch", emplois: 13000 },
      { province: "Oujda-Angad", emplois: 6000 },
      { province: "Berkane", emplois: 6000 },
      { province: "Taourirt", emplois: 4000 },
    ],
    gapsPortuaires: [
      { secteur: "Ingénierie Maritime", gapScore: 95, potentiel: "45-60M MAD/an", description: "Aucun prestataire local qualifié en ingénierie navale" },
      { secteur: "Consignation Maritime", gapScore: 88, potentiel: "20-30M MAD/an", description: "Services de consignation absents dans la région" },
      { secteur: "Maintenance Navale", gapScore: 82, potentiel: "35-50M MAD/an", description: "Besoin critique en maintenance des équipements navals" },
      { secteur: "Formation Portuaire", gapScore: 75, potentiel: "8-12M MAD/an", description: "Manque de centres de formation aux métiers portuaires" },
      { secteur: "Logistique Frigorifique", gapScore: 45, potentiel: "15-25M MAD/an", description: "Couverture partielle, capacité insuffisante" },
      { secteur: "Transport Routier", gapScore: 15, potentiel: "25-40M MAD/an", description: "Secteur relativement couvert par les PME locales" },
    ],
  },
  casablanca_settat: {
    kpis: { dossiers: 5840, statues: 4980, tauxStatut: "85.3%", investissement: "312 Mds MAD", emplois: "421 000" },
    source: "CRI Casablanca-Settat — casainvest.ma | 2020-2024",
    sourceUrl: "https://www.casainvest.ma/",
    projetsParProvince: [
      { province: "Casablanca", projets: 2800, investissement: 185000 },
      { province: "Mohammedia", projets: 620, investissement: 42000 },
      { province: "Settat", projets: 480, investissement: 28500 },
      { province: "Berrechid", projets: 390, investissement: 24000 },
      { province: "Benslimane", projets: 210, investissement: 15000 },
    ],
    projetsParSecteur: [
      { secteur: "Industrie transf.", projets: 1240, emplois: 180000 },
      { secteur: "Commerce", projets: 980, emplois: 42000 },
      { secteur: "Services financiers", projets: 760, emplois: 35000 },
      { secteur: "BTP", projets: 540, emplois: 28000 },
      { secteur: "Logistique", projets: 480, emplois: 22000 },
      { secteur: "Tourisme", projets: 320, emplois: 14000 },
    ],
    investParSecteur: [
      { name: "Industrie", value: 124000, color: "#2563eb" },
      { name: "Immobilier", value: 85000, color: "#0891b2" },
      { name: "Commerce", value: 52000, color: "#16a34a" },
      { name: "Logistique", value: 28000, color: "#d97706" },
      { name: "Tourisme", value: 14000, color: "#7c3aed" },
      { name: "Autres", value: 9000, color: "#94a3b8" },
    ],
    emploisParProvince: [
      { province: "Casablanca", emplois: 280000 },
      { province: "Mohammedia", emplois: 62000 },
      { province: "Settat", emplois: 38000 },
      { province: "Berrechid", emplois: 25000 },
      { province: "Benslimane", emplois: 16000 },
    ],
    gapsPortuaires: [
      { secteur: "Conteneurisation Avancée", gapScore: 72, potentiel: "120-180M MAD/an", description: "Capacité saturée, besoin d'opérateurs spécialisés" },
      { secteur: "Logistique Frigorifique", gapScore: 65, potentiel: "80-100M MAD/an", description: "Chaîne du froid insuffisante pour l'export agroalimentaire" },
      { secteur: "Maintenance Industrielle", gapScore: 55, potentiel: "60-90M MAD/an", description: "Manque de prestataires certifiés ISO" },
      { secteur: "Dépollution Maritime", gapScore: 48, potentiel: "35-50M MAD/an", description: "Réglementation environnementale renforcée" },
    ],
  },
  tanger_tetouan: {
    kpis: { dossiers: 3120, statues: 2640, tauxStatut: "84.6%", investissement: "186 Mds MAD", emplois: "238 000" },
    source: "CRI Tanger-Tétouan-Al Hoceima — invest-tangmed.ma | 2020-2024",
    sourceUrl: "https://www.invest-tangmed.ma/",
    projetsParProvince: [
      { province: "Tanger-Assilah", projets: 1420, investissement: 98000 },
      { province: "Tétouan", projets: 580, investissement: 32000 },
      { province: "Fahs-Anjra", projets: 340, investissement: 24000 },
      { province: "Al Hoceima", projets: 280, investissement: 12000 },
      { province: "Larache", projets: 260, investissement: 10500 },
    ],
    projetsParSecteur: [
      { secteur: "Automobile", projets: 680, emplois: 92000 },
      { secteur: "Logistique", projets: 520, emplois: 38000 },
      { secteur: "Aéronautique", projets: 280, emplois: 18000 },
      { secteur: "Textile", projets: 420, emplois: 35000 },
      { secteur: "Tourisme", projets: 380, emplois: 22000 },
      { secteur: "Pêche & Agro", projets: 180, emplois: 14000 },
    ],
    investParSecteur: [
      { name: "Industrie auto.", value: 72000, color: "#2563eb" },
      { name: "Logistique", value: 48000, color: "#0891b2" },
      { name: "Tourisme", value: 28000, color: "#d97706" },
      { name: "Aéronautique", value: 22000, color: "#7c3aed" },
      { name: "Textile", value: 10000, color: "#16a34a" },
      { name: "Autres", value: 6000, color: "#94a3b8" },
    ],
    emploisParProvince: [
      { province: "Tanger-Assilah", emplois: 142000 },
      { province: "Tétouan", emplois: 42000 },
      { province: "Fahs-Anjra", emplois: 22000 },
      { province: "Al Hoceima", emplois: 18000 },
      { province: "Larache", emplois: 14000 },
    ],
    gapsPortuaires: [
      { secteur: "Ingénierie Navale", gapScore: 90, potentiel: "80-120M MAD/an", description: "Pénurie critique face à la croissance de Tanger Med" },
      { secteur: "Services Logistiques Spécialisés", gapScore: 78, potentiel: "60-90M MAD/an", description: "Complexification des flux conteneurs" },
      { secteur: "Formation Maritime", gapScore: 70, potentiel: "20-35M MAD/an", description: "Besoin criant en personnel qualifié portuaire" },
      { secteur: "Maintenance Équipements", gapScore: 60, potentiel: "45-70M MAD/an", description: "Sous-traitance locale insuffisante" },
    ],
  },
  souss_massa: {
    kpis: { dossiers: 1840, statues: 1520, tauxStatut: "82.6%", investissement: "78 Mds MAD", emplois: "142 000" },
    source: "CRI Souss-Massa — souss-massa.ma | 2020-2024",
    sourceUrl: "https://www.souss-massa.ma/",
    projetsParProvince: [
      { province: "Agadir-Ida-Outanane", projets: 820, investissement: 42000 },
      { province: "Tiznit", projets: 280, investissement: 8500 },
      { province: "Taroudant", projets: 320, investissement: 12000 },
      { province: "Chtouka-Aït Baha", projets: 240, investissement: 9000 },
    ],
    projetsParSecteur: [
      { secteur: "Tourisme", projets: 480, emplois: 48000 },
      { secteur: "Agro-industrie", projets: 420, emplois: 38000 },
      { secteur: "Pêche", projets: 280, emplois: 22000 },
      { secteur: "BTP", projets: 220, emplois: 12000 },
      { secteur: "Commerce", projets: 180, emplois: 8000 },
      { secteur: "Logistique", projets: 120, emplois: 6000 },
    ],
    investParSecteur: [
      { name: "Tourisme", value: 28000, color: "#d97706" },
      { name: "Agro-industrie", value: 22000, color: "#16a34a" },
      { name: "Pêche", value: 12000, color: "#0891b2" },
      { name: "Immobilier", value: 8500, color: "#2563eb" },
      { name: "Logistique", value: 4200, color: "#7c3aed" },
      { name: "Autres", value: 3300, color: "#94a3b8" },
    ],
    emploisParProvince: [
      { province: "Agadir-Ida-Outanane", emplois: 88000 },
      { province: "Taroudant", emplois: 24000 },
      { province: "Tiznit", emplois: 16000 },
      { province: "Chtouka-Aït Baha", emplois: 14000 },
    ],
    gapsPortuaires: [
      { secteur: "Transformation Poissons", gapScore: 85, potentiel: "40-60M MAD/an", description: "Capacité de transformation insuffisante malgré abondance de la ressource" },
      { secteur: "Chaîne Froide Export", gapScore: 78, potentiel: "30-45M MAD/an", description: "Manque critique pour l'exportation agrumes/primeurs" },
      { secteur: "Maintenance Flotte", gapScore: 68, potentiel: "25-35M MAD/an", description: "Peu de chantiers navals qualifiés à Agadir" },
      { secteur: "Logistique Portuaire", gapScore: 52, potentiel: "20-30M MAD/an", description: "Besoin d'opérateurs logistiques certifiés" },
    ],
  },
}

function gapBarColor(score) {
  if (score > 70) return "bg-red-500"
  if (score >= 40) return "bg-amber-500"
  return "bg-green-500"
}

function gapTextColor(score) {
  if (score > 70) return "text-red-600"
  if (score >= 40) return "text-amber-600"
  return "text-green-600"
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function KpiCard({ label, value, sub }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

function StatChip({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col gap-0.5">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-base font-bold text-slate-800">{value}</span>
    </div>
  )
}

export default function MarketDashboard() {
  const isPremium = usePremium()
  const [regions, setRegions] = useState([])
  const [selectedRegionId, setSelectedRegionId] = useState("oriental")

  useEffect(() => {
    geographyApi.regions().then((res) => {
      setRegions(res.data?.data ?? [])
    }).catch(() => {})
    // Default to investor's last filter region if available
    try {
      const stored = localStorage.getItem("port2region_market_region")
      if (stored && REGION_DATA[stored]) setSelectedRegionId(stored)
    } catch { /* ignore */ }
  }, [])

  function handleRegionChange(id) {
    setSelectedRegionId(id)
    try { localStorage.setItem("port2region_market_region", id) } catch { /* ignore */ }
  }

  const data = REGION_DATA[selectedRegionId] || REGION_DATA.oriental
  const regionName = REGION_LABELS[selectedRegionId] || selectedRegionId
  const totalInvest = data.investParSecteur.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Données Marché — {regionName}</h1>
          <p className="text-sm text-slate-500 mt-1">Source : {data.source}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Region selector */}
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={selectedRegionId}
            onChange={(e) => handleRegionChange(e.target.value)}
          >
            {regions.length > 0
              ? regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)
              : Object.keys(REGION_DATA).map((id) => (
                  <option key={id} value={id}>{REGION_LABELS[id] || id}</option>
                ))
            }
          </select>
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voir la source →
          </a>
        </div>
      </div>

      {/* Section 1 — Chiffres Clés CRI */}
      <section>
        <SectionTitle title={`Chiffres Clés CRI ${regionName} (2020-2024)`} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Dossiers soumis" value={data.kpis.dossiers.toLocaleString("fr-FR")} />
          <KpiCard label="Dossiers statués" value={data.kpis.statues.toLocaleString("fr-FR")} sub={`Taux: ${data.kpis.tauxStatut}`} />
          <KpiCard label="Investissement total" value={data.kpis.investissement} />
          <KpiCard label="Emplois prévisionnels" value={data.kpis.emplois} />
        </div>
      </section>

      {/* Section 2 — Projets par province */}
      <section>
        <SectionTitle
          title="Projets approuvés par province"
          subtitle="Nombre de projets et investissement en MDhs"
        />
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={Math.max(240, data.projetsParProvince.length * 40)}>
            <BarChart data={data.projetsParProvince} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="province" width={130} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} cursor={{ fill: "rgba(37,99,235,0.04)" }} />
              <Legend iconType="square" iconSize={10} formatter={(v) => <span style={{ fontSize: 12, color: "#475569" }}>{v}</span>} />
              <Bar dataKey="projets" name="Projets" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={18} />
              <Bar dataKey="investissement" name="Investissement (MDhs)" fill="#d97706" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 3 — Projets par secteur */}
      <section>
        <SectionTitle title="Projets par secteur d'activité" subtitle="Nombre de projets et emplois prévisionnels par secteur" />
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={Math.max(240, data.projetsParSecteur.length * 42)}>
            <BarChart data={data.projetsParSecteur} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="secteur" width={150} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} cursor={{ fill: "rgba(37,99,235,0.04)" }} />
              <Legend iconType="square" iconSize={10} formatter={(v) => <span style={{ fontSize: 12, color: "#475569" }}>{v}</span>} />
              <Bar dataKey="projets" name="Projets" fill="#0891b2" radius={[0, 4, 4, 0]} maxBarSize={18} />
              <Bar dataKey="emplois" name="Emplois prévisionnels" fill="#16a34a" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 4 — Répartition investissement */}
      <section>
        <SectionTitle title="Répartition investissement par secteur" subtitle={`Total: ${totalInvest.toLocaleString("fr-FR")} MDhs`} />
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={data.investParSecteur} cx="50%" cy="50%" outerRadius={120} dataKey="value"
                label={({ name, value }) => `${name} ${Math.round((value / totalInvest) * 100)}%`} labelLine>
                {data.investParSecteur.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value) => [`${value.toLocaleString("fr-FR")} MDhs`]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Legend iconType="circle" iconSize={10} formatter={(value) => <span style={{ fontSize: 12, color: "#475569" }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 5 — Emplois par province */}
      <section>
        <SectionTitle title="Emplois prévisionnels par province" subtitle="Nombre d'emplois prévisionnels approuvés" />
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={Math.max(200, data.emploisParProvince.length * 40)}>
            <BarChart data={data.emploisParProvince} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="province" width={130} tick={{ fontSize: 11, fill: "#334155" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} cursor={{ fill: "rgba(37,99,235,0.04)" }} formatter={(v) => [v.toLocaleString("fr-FR"), "Emplois"]} />
              <Bar dataKey="emplois" name="Emplois" fill="#7c3aed" radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 6 — Gaps portuaires */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <SectionTitle
            title={`Opportunités gaps portuaires — ${regionName}`}
            subtitle="Secteurs non couverts ou partiellement couverts par les prestataires locaux"
          />
          <PremiumToggle inline />
        </div>
        {isPremium ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Secteur</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Score Gap</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden sm:table-cell">Potentiel</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.gapsPortuaires.map((gap, i) => (
                  <tr key={gap.secteur} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{gap.secteur}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${gapBarColor(gap.gapScore)}`} style={{ width: `${gap.gapScore}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${gapTextColor(gap.gapScore)}`}>{gap.gapScore}/100</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">{gap.potentiel}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 hidden md:table-cell max-w-xs">{gap.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="relative">
            <div className="blur-sm pointer-events-none">
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Secteur</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Score Gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.gapsPortuaires.slice(0, 3).map((gap, i) => (
                      <tr key={gap.secteur} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{gap.secteur}</span></td>
                        <td className="px-5 py-4"><span className={`text-xs font-bold ${gapTextColor(gap.gapScore)}`}>{gap.gapScore}/100</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-xl">
              <Lock size={24} className="text-slate-400 mb-2" />
              <p className="font-semibold text-slate-900 mb-1">Fonctionnalité Premium</p>
              <p className="text-xs text-muted mb-3 text-center max-w-xs">Accédez aux opportunités gaps portuaires et potentiels d&apos;investissement</p>
              <PremiumToggle inline />
            </div>
          </div>
        )}
      </section>

      <p className="text-xs text-slate-400 text-center pb-4">
        Données officielles — {data.source}
      </p>
    </div>
  )
}
