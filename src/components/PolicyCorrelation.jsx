import { useState } from 'react';
import { POLICY_EVENTS, ALL_POSITIONS } from '../data/unified';

const SEVERITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#6b7280' };
const TYPE_CONFIG = {
  CONFLICT:  { label: '⚠️ Potential Conflict', bg: 'bg-[#1a0a0a]', border: 'border-[#3a1a1a]', text: 'text-[#ef4444]' },
  ALIGNMENT: { label: '🔵 Policy Alignment',   bg: 'bg-[#0a0e1a]', border: 'border-[#1a2a3a]', text: 'text-[#60a5fa]' },
  NEUTRAL:   { label: '⬜ Neutral',             bg: 'bg-[#111]',    border: 'border-[#1f1f1f]', text: 'text-[#666]' },
};

function EventCard({ event }) {
  const [open, setOpen] = useState(false);
  const cfg = TYPE_CONFIG[event.type];
  const tickers = event.tickers.map(t => ALL_POSITIONS.find(p => p.ticker === t)).filter(Boolean);

  return (
    <div
      className={`rounded-xl border ${cfg.bg} ${cfg.border} cursor-pointer transition-all hover:brightness-110`}
      onClick={() => setOpen(o => !o)}
    >
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-bold ${cfg.text}`}>{cfg.label}</span>
              <span className="text-[9px] text-[#333] font-mono">{event.date}</span>
              <span
                className="text-[9px] font-bold px-1 py-px rounded"
                style={{ background: `${SEVERITY_COLOR[event.severity]}20`, color: SEVERITY_COLOR[event.severity] }}
              >
                {event.severity}
              </span>
            </div>
            <div className="text-[13px] font-semibold text-white leading-snug">{event.title}</div>
          </div>
          <span className="text-[#333] text-sm flex-shrink-0">{open ? '▲' : '▼'}</span>
        </div>

        {/* Ticker pills */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tickers.map(p => (
            <span
              key={p.ticker}
              className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
              style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}30` }}
            >
              {p.ticker}
            </span>
          ))}
        </div>
      </div>

      {open && (
        <div className="border-t border-[#1f1f1f]/50 px-3.5 py-3" onClick={e => e.stopPropagation()}>
          <p className="text-[12px] text-[#888] leading-relaxed mb-3">{event.description}</p>

          {/* Per-ticker detail */}
          {tickers.map(p => (
            <div key={p.ticker} className="flex items-center gap-3 py-1.5 border-b border-[#1a1a1a] last:border-0">
              <span className="text-[11px] font-bold font-mono w-12" style={{ color: p.color }}>{p.ticker}</span>
              <div className="flex-1 text-[11px] text-[#666]">
                {p.buys > 0 && <span className="text-green-500/70 mr-2">▲ {p.buys} buys ({p.maxBuyBand})</span>}
                {p.sells > 0 && <span className="text-red-500/70">▼ {p.sells} sells ({p.maxSellBand})</span>}
              </div>
              <a
                href={p.yahooUrl}
                target="_blank" rel="noreferrer"
                className="text-[10px] text-[#D4AF37]/60 hover:text-[#D4AF37]"
                onClick={e => e.stopPropagation()}
              >
                ↗
              </a>
            </div>
          ))}

          <div className="text-[10px] text-[#333] mt-2">Source: {event.source}</div>
        </div>
      )}
    </div>
  );
}

export default function PolicyCorrelation() {
  const conflictEvents = POLICY_EVENTS.filter(e => e.type === 'CONFLICT');
  const alignmentEvents = POLICY_EVENTS.filter(e => e.type === 'ALIGNMENT');

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider">Trading ↔ Policy Correlation</h2>
        <p className="text-[11px] text-[#444] mt-0.5">
          Overlap between Trump's stock transactions and his own policy announcements — per OGE 278-T analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Conflicts */}
        <div className="space-y-2.5">
          <div className="text-[10px] text-[#ef4444]/70 uppercase tracking-wider font-semibold">⚠️ Potential Conflicts</div>
          {conflictEvents.map(e => <EventCard key={e.id} event={e} />)}
        </div>

        {/* Alignments */}
        <div className="space-y-2.5">
          <div className="text-[10px] text-[#60a5fa]/70 uppercase tracking-wider font-semibold">🔵 Policy-Aligned Trades</div>
          {alignmentEvents.map(e => <EventCard key={e.id} event={e} />)}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1a1a1a] text-[10px] text-[#2a2a2a]">
        ⚖️ Correlations identified through date-cluster analysis of the 278-T. Correlation does not imply illegal insider trading — but these patterns are what ethics watchdogs flag for further review.
      </div>
    </div>
  );
}
