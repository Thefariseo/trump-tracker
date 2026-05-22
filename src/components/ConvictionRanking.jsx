import { useState } from 'react';
import { CONVICTION_SCORES } from '../data/convictionScores';

function ScoreBar({ score, color }) {
  return (
    <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

export default function ConvictionRanking() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? CONVICTION_SCORES : CONVICTION_SCORES.slice(0, 10);
  const top3 = CONVICTION_SCORES.slice(0, 3);

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Conviction Ranking
        </h2>
        <p className="text-[11px] text-[#444] mt-0.5">
          Score 0–100 · buys × 35 + band × 35 + no-sell bonus 20 − sell drag max 20
        </p>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {top3.map((c, i) => (
          <div
            key={c.ticker}
            className="rounded-lg border bg-[#0e0e0e] px-3 py-2.5 text-center"
            style={{ borderColor: `${c.color}30` }}
          >
            <div className="text-[9px] text-[#333] mb-1">{['🥇', '🥈', '🥉'][i]}</div>
            <div className="text-[13px] font-bold font-mono" style={{ color: c.color }}>
              {c.ticker}
            </div>
            <div className="text-[18px] font-black font-mono mt-0.5" style={{ color: c.labelColor }}>
              {c.score}
            </div>
            <div className="text-[8px] mt-0.5" style={{ color: c.labelColor }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Full ranking list */}
      <div className="space-y-1.5">
        {visible.map((c, i) => (
          <div key={c.ticker} className="flex items-center gap-3 group">
            {/* Rank */}
            <span className="text-[10px] text-[#333] font-mono w-5 text-right flex-shrink-0">
              {i + 1}
            </span>

            {/* Ticker */}
            <span
              className="text-[11px] font-bold font-mono w-12 flex-shrink-0"
              style={{ color: c.color }}
            >
              {c.ticker}
            </span>

            {/* Bar */}
            <ScoreBar score={c.score} color={c.labelColor} />

            {/* Score */}
            <span
              className="text-[11px] font-bold font-mono w-8 text-right flex-shrink-0"
              style={{ color: c.labelColor }}
            >
              {c.score}
            </span>

            {/* Label */}
            <span className="text-[9px] w-20 flex-shrink-0 hidden sm:block" style={{ color: c.labelColor }}>
              {c.label}
            </span>

            {/* Breakdown on hover */}
            <span className="text-[9px] text-[#2a2a2a] group-hover:text-[#444] transition-colors hidden lg:block">
              {c.breakdown.buys}× buys · {c.breakdown.band} · {c.breakdown.sells} sells
            </span>
          </div>
        ))}
      </div>

      {/* Show more / less */}
      {CONVICTION_SCORES.length > 10 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full mt-3 text-[10px] text-[#333] hover:text-[#555] transition-colors pt-2 border-t border-[#1a1a1a]"
        >
          {expanded ? '▲ Mostra meno' : `▼ Mostra tutti ${CONVICTION_SCORES.length} titoli`}
        </button>
      )}

      {/* Method note */}
      <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-[9px] text-[#2a2a2a]">
        Nota: basato sulle date e bande OGE dichiarate, non su prezzi esatti. Indicativo.
      </div>
    </div>
  );
}
