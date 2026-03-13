import PropTypes from "prop-types"

const CRITERIA = [
  { key: "sector_score", label: "Secteur", max: 40, color: "bg-brand" },
  { key: "capacity_score", label: "Capacité", max: 25, color: "bg-teal" },
  { key: "location_score", label: "Localisation", max: 20, color: "bg-violet-500" },
  { key: "reputation_score", label: "Réputation", max: 15, color: "bg-amber-500" },
]

export default function ScoreBreakdown({ breakdown, justification }) {
  const total = Object.values(breakdown || {}).reduce((a, b) => a + b, 0)
  return (
    <div>
      <div className="space-y-3 mb-4">
        {CRITERIA.map(({ key, label, max, color }) => {
          const val = breakdown?.[key] ?? 0
          const pct = (val / max) * 100
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">{label}</span>
                <span className="text-xs font-semibold tabular-nums text-slate-900">{val}/{max}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Total</span>
        <span className="text-sm font-extrabold text-slate-900">{total}/100</span>
      </div>
      {justification && (
        <pre className="text-[11px] text-muted bg-gray-50 rounded-lg p-3 font-mono whitespace-pre-wrap leading-relaxed">
          {justification}
        </pre>
      )}
    </div>
  )
}

ScoreBreakdown.propTypes = { breakdown: PropTypes.object, justification: PropTypes.string }
