import { Lock } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import PremiumToggle, { usePremium } from "../components/PremiumToggle"

const projetsParProvince = [
  { province: "Nador", projets: 280, investissement: 17450 },
  { province: "Berkane", projets: 203, investissement: 5760 },
  { province: "Oujda-Angad", projets: 195, investissement: 5100 },
  { province: "Taourirt", projets: 130, investissement: 3240 },
  { province: "Jerada", projets: 115, investissement: 2790 },
  { province: "Figuig", projets: 105, investissement: 2910 },
  { province: "Guercif", projets: 95, investissement: 2960 },
  { province: "Driouch", projets: 50, investissement: 4080 },
]

const projetsParSecteur = [
  { secteur: "Industrie transf.", projets: 280, emplois: 33000 },
  { secteur: "Tourisme", projets: 248, emplois: 6000 },
  { secteur: "Services divers", projets: 234, emplois: 5000 },
  { secteur: "Énergie & Mines", projets: 176, emplois: 5000 },
  { secteur: "Industrie extract.", projets: 121, emplois: 0 },
  { secteur: "BTP", projets: 46, emplois: 1000 },
  { secteur: "Commerce", projets: 31, emplois: 0 },
  { secteur: "Agriculture & Pêche", projets: 15, emplois: 29000 },
  { secteur: "Logistique", projets: 7, emplois: 0 },
]

const investParSecteur = [
  { name: "BTP", value: 13250, color: "#94a3b8" },
  { name: "Commerce", value: 12000, color: "#2563eb" },
  { name: "Logistique", value: 9310, color: "#0891b2" },
  { name: "Services divers", value: 2960, color: "#16a34a" },
  { name: "Tourisme", value: 2510, color: "#d97706" },
  { name: "Énergie & Mines", value: 940, color: "#7c3aed" },
]

const emploisParProvince = [
  { province: "Nador", emplois: 33000 },
  { province: "Figuig", emplois: 16000 },
  { province: "Driouch", emplois: 13000 },
  { province: "Oujda-Angad", emplois: 6000 },
  { province: "Berkane", emplois: 6000 },
  { province: "Guercif", emplois: 5000 },
  { province: "Taourirt", emplois: 4000 },
]

const gapsPortuaires = [
  { secteur: "Ingénierie Maritime", gapScore: 95, potentiel: "45-60M MAD/an", description: "Aucun prestataire local qualifié en ingénierie navale" },
  { secteur: "Consignation Maritime", gapScore: 88, potentiel: "20-30M MAD/an", description: "Services de consignation absents dans la région" },
  { secteur: "Maintenance Navale", gapScore: 82, potentiel: "35-50M MAD/an", description: "Besoin critique en maintenance des équipements navals" },
  { secteur: "Formation Portuaire", gapScore: 75, potentiel: "8-12M MAD/an", description: "Manque de centres de formation aux métiers portuaires" },
  { secteur: "Logistique Frigorifique", gapScore: 45, potentiel: "15-25M MAD/an", description: "Couverture partielle, capacité insuffisante" },
  { secteur: "Transport Routier", gapScore: 15, potentiel: "25-40M MAD/an", description: "Secteur relativement couvert par les PME locales" },
]

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
  const TOTAL_INVEST = 41970
  const isPremium = usePremium()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Données Marché — Région Orientale</h1>
          <p className="text-sm text-slate-500 mt-1">Source: CRI Oriental — Baromètre de l&apos;Investissement 2020-2024</p>
        </div>
        <a
          href="https://orientalinvest.ma/barometre-de-linvestissement/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          Voir la source →
        </a>
      </div>

      {/* Section 1 — Chiffres Clés CRI */}
      <section>
        <SectionTitle title="Chiffres Clés CRI Oriental (2020-2024)" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <KpiCard label="Dossiers CRUI soumis" value="2 222" />
          <KpiCard label="Dossiers statués" value="1 793" sub="Taux: 80.7%" />
          <KpiCard label="Investissement total" value="51.3 Mds MAD" />
          <KpiCard label="Emplois prévisionnels" value="105 591" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatChip label="CRUIs tenues" value="281" />
          <StatChip label="Avis favorables" value="1 173 (65.42%)" />
          <StatChip label="Investissement favorable" value="42 695 MDhs" />
          <StatChip label="Emplois favorables" value="82 330" />
        </div>
      </section>

      {/* Section 2 — Projets par province */}
      <section>
        <SectionTitle
          title="Projets approuvés par province"
          subtitle="Nombre de projets et investissement en MDhs"
        />
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projetsParProvince} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="province"
                width={100}
                tick={{ fontSize: 11, fill: "#334155" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                cursor={{ fill: "rgba(37,99,235,0.04)" }}
              />
              <Legend iconType="square" iconSize={10} formatter={(v) => <span style={{ fontSize: 12, color: "#475569" }}>{v}</span>} />
              <Bar dataKey="projets" name="Projets" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={18} />
              <Bar dataKey="investissement" name="Investissement (MDhs)" fill="#d97706" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 3 — Projets par secteur */}
      <section>
        <SectionTitle
          title="Projets par secteur d'activité"
          subtitle="Nombre de projets et emplois prévisionnels par secteur"
        />
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={projetsParSecteur} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="secteur"
                width={130}
                tick={{ fontSize: 11, fill: "#334155" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                cursor={{ fill: "rgba(37,99,235,0.04)" }}
              />
              <Legend iconType="square" iconSize={10} formatter={(v) => <span style={{ fontSize: 12, color: "#475569" }}>{v}</span>} />
              <Bar dataKey="projets" name="Projets" fill="#0891b2" radius={[0, 4, 4, 0]} maxBarSize={18} />
              <Bar dataKey="emplois" name="Emplois prévisionnels" fill="#16a34a" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 4 — Répartition investissement par secteur */}
      <section>
        <SectionTitle
          title="Répartition investissement par secteur"
          subtitle={`Total: ${TOTAL_INVEST.toLocaleString("fr-FR")} MDhs`}
        />
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={investParSecteur}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label={({ name, value }) => `${name} ${Math.round((value / TOTAL_INVEST) * 100)}%`}
                labelLine={true}
              >
                {investParSecteur.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value.toLocaleString("fr-FR")} MDhs`]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span style={{ fontSize: 12, color: "#475569" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 5 — Emplois par province */}
      <section>
        <SectionTitle
          title="Emplois prévisionnels par province"
          subtitle="Nombre d'emplois prévisionnels approuvés"
        />
        <div className="card p-5">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={emploisParProvince} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="province"
                width={100}
                tick={{ fontSize: 11, fill: "#334155" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                cursor={{ fill: "rgba(37,99,235,0.04)" }}
                formatter={(v) => [v.toLocaleString("fr-FR"), "Emplois"]}
              />
              <Bar dataKey="emplois" name="Emplois" fill="#7c3aed" radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 6 — Opportunités gaps portuaires */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <SectionTitle
            title="Opportunités gaps pour le Port Nador Med"
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
                {gapsPortuaires.map((gap, i) => (
                  <tr key={gap.secteur} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {gap.secteur}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${gapBarColor(gap.gapScore)}`}
                            style={{ width: `${gap.gapScore}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${gapTextColor(gap.gapScore)}`}>
                          {gap.gapScore}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                        {gap.potentiel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 hidden md:table-cell max-w-xs">
                      {gap.description}
                    </td>
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
                    {gapsPortuaires.slice(0, 3).map((gap, i) => (
                      <tr key={gap.secteur} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{gap.secteur}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold ${gapTextColor(gap.gapScore)}`}>{gap.gapScore}/100</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded-xl">
              <Lock size={24} className="text-slate-400 mb-2" />
              <p className="font-semibold text-slate-900 mb-1">Fonctionnalité Premium</p>
              <p className="text-xs text-muted mb-3 text-center max-w-xs">
                Accédez aux opportunités gaps portuaires et potentiels d&apos;investissement
              </p>
              <PremiumToggle inline />
            </div>
          </div>
        )}
      </section>

      {/* Footer note */}
      <p className="text-xs text-slate-400 text-center pb-4">
        Données officielles — Source: Centre Régional d&apos;Investissement de la Région de l&apos;Oriental (orientalinvest.ma) | Période: 2020-2024
      </p>

    </div>
  )
}
