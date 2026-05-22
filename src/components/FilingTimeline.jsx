import { useState } from 'react';
import { FILING_HISTORY } from '../data/unified';

const TYPE_CONFIG = {
  amended: { label: 'AMENDED',  color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b30' },
  bonds:   { label: 'BOND',     color: '#6b7280', bg: '#6b728018', border: '#6b728030' },
  mixed:   { label: 'MIXED',    color: '#0ea5e9', bg: '#0ea5e918', border: '#0ea5e930' },
  equity:  { label: 'EQUITY',   color: '#22c55e', bg: '#22c55e18', border: '#22c55e30' },
};

export default function FilingTimeline() {
  const [active, setActive] = useState(null);

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Filing History — 278-T</h2>
        <p className="text-[11px] text-[#444] mt-0.5">
          9 Periodic Transaction Reports · Aug 2025 – May 2026
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-4 left-4 right-4 h-px bg-[#1a1a1a]" />

        <div className="grid grid-cols-9 gap-1 relative">
          {FILING_HISTORY.map((f, i) => {
            const cfg = TYPE_CONFIG[f.type] || TYPE_CONFIG.bonds;
            const isActive = active === i;
            return (
              <button
                key={f.date}
                onClick={() => setActive(isActive ? null : i)}
                className="flex flex-col items-center gap-1.5 group"
              >
                {/* Dot */}
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all z-10 relative"
                  style={{
                    background: isActive ? cfg.color : cfg.bg,
                    borderColor: isActive ? cfg.color : cfg.border,
                    color: isActive ? '#000' : cfg.color,
                    transform: isActive ? 'scale(1.2)' : undefined,
                  }}
                >
                  {i + 1}
                </div>
                {/* Date label */}
                <span className="text-[8px] text-[#333] text-center leading-tight group-hover:text-[#555] transition-colors">
                  {f.label.replace(', ', '\n')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[#1a1a1a]">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5 text-[9px]" style={{ color: cfg.color }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.color }} />
              {cfg.label}
            </span>
          ))}
          <span className="ml-auto text-[9px] text-[#2a2a2a]">click per dettaglio</span>
        </div>
      </div>

      {/* Detail panel */}
      {active !== null && (() => {
        const f = FILING_HISTORY[active];
        const cfg = TYPE_CONFIG[f.type] || TYPE_CONFIG.bonds;
        return (
          <div
            className="mt-4 rounded-lg border p-3"
            style={{ background: cfg.bg, borderColor: cfg.border }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                    style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-[11px] text-white font-semibold">{f.label}</span>
                </div>
                <p className="text-[11px] text-[#888] leading-relaxed">{f.note}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {f.url && (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] px-2 py-1 rounded border transition-colors hover:opacity-80"
                    style={{ color: cfg.color, borderColor: cfg.border }}
                    onClick={e => e.stopPropagation()}
                  >
                    PDF ↗
                  </a>
                )}
                <button
                  onClick={() => setActive(null)}
                  className="text-[10px] text-[#333] hover:text-[#555]"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
