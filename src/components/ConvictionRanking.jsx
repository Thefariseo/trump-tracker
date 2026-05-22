import { useState } from 'react';
import { CONVICTION_SCORES } from '../data/convictionScores';

function ScoreBar({ score, color }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${score}%`, background: color, opacity: 0.85 }}
      />
    </div>
  );
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default function ConvictionRanking() {
  const [expanded, setExpanded] = useState(false);
  const top3    = CONVICTION_SCORES.slice(0, 3);
  const visible = expanded ? CONVICTION_SCORES : CONVICTION_SCORES.slice(0, 10);

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-[13px] font-bold text-[#ccc] tracking-tight">Conviction Ranking</h2>
        <p className="text-[11px] text-[#555] mt-1 leading-relaxed">
          Score 0–100 · buys × 35 + band × 35 + no-sell bonus 20 − sell drag 20
        </p>
      </div>

      {/* Podium — top 3 */}
      <div className="grid grid-cols-3 gap-2.5">
        {top3.map((c, i) => (
          <div
            key={c.ticker}
            className="panel rounded-xl px-3 py-3 text-center"
            style={{ borderColor: `${c.color}25` }}
          >
            <div className="text-base mb-1">{MEDAL[i]}</div>
            <div className="text-[14px] font-bold font-mono" style={{ color: c.color }}>
              {c.ticker}
            </div>
            <div
              className="text-[26px] font-black font-mono leading-none mt-1"
              style={{ color: c.labelColor }}
            >
              {c.score}
            </div>
            <div className="text-[9px] font-semibold mt-1.5" style={{ color: c.labelColor }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Full list */}
      <div className="space-y-2">
        {visible.map((c, i) => (
          <div key={c.ticker} className="flex items-center gap-2.5 group">
            <span className="text-[10px] text-[#444] font-mono w-5 text-right flex-shrink-0">
              {i + 1}
            </span>
            <span
              className="text-[11px] font-bold font-mono w-12 flex-shrink-0"
              style={{ color: c.color }}
            >
              {c.ticker}
            </span>
            <ScoreBar score={c.score} color={c.labelColor} />
            <span
              className="text-[12px] font-bold font-mono w-8 text-right flex-shrink-0"
              style={{ color: c.labelColor }}
            >
              {c.score}
            </span>
            <span
              className="text-[9px] font-semibold w-20 flex-shrink-0 hidden sm:block"
              style={{ color: c.labelColor }}
            >
              {c.label}
            </span>
            <span className="text-[9px] text-[#333] group-hover:text-[#555] transition-colors hidden lg:block">
              {c.breakdown.buys}× · {c.breakdown.band} · {c.breakdown.sells} sell
            </span>
          </div>
        ))}
      </div>

      {/* Show more / less */}
      {CONVICTION_SCORES.length > 10 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full pt-3 border-t border-[#1a1a1a] text-[11px] font-medium text-[#555] hover:text-[#888] transition-colors"
        >
          {expanded
            ? '▲ Mostra meno'
            : `▼ Mostra tutti ${CONVICTION_SCORES.length} titoli`}
        </button>
      )}

      {/* Footer note */}
      <div className="pt-1 text-[10px] text-[#444] leading-relaxed border-t border-[#1a1a1a]">
        Basato sulle date e bande OGE dichiarate · indicativo
      </div>
    </div>
  );
}
