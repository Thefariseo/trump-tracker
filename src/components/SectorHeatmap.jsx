import { useMemo } from 'react';
import { ALL_POSITIONS } from '../data/unified';

// ── helpers ────────────────────────────────────────────────────────────────────

function parseDate(str) {
  if (!str) return null;
  const [m, d, y] = str.split('/');
  const year = y?.length === 2 ? `20${y}` : y;
  return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Week index from start of Q1 2026 (week 1 = Jan 5–9)
const WEEK_START = new Date('2026-01-05T00:00:00Z');
function getWeekIdx(isoDate) {
  const d = new Date(isoDate + 'T12:00:00Z');
  return Math.floor((d - WEEK_START) / (7 * 24 * 60 * 60 * 1000));
}

// Week label from index
function weekLabel(idx) {
  const d = new Date(WEEK_START.getTime() + idx * 7 * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Normalize sector name
function normSector(s) {
  return s.split('/')[0].trim();
}

// ── data builder ───────────────────────────────────────────────────────────────

function buildHeatmapData(positions) {
  // cell: weekIdx → sector → { buyAmt, sellAmt }
  const grid = {};
  const sectors = new Set();

  for (const pos of positions) {
    const sector = normSector(pos.sector);
    sectors.add(sector);
    const avgBuyPerDate  = pos.keyBuyDates?.length  ? pos.estimatedBuyTotal  / pos.keyBuyDates.length  : 0;
    const avgSellPerDate = pos.keySellDates?.length ? pos.estimatedSellTotal / pos.keySellDates.length : 0;

    for (const raw of (pos.keyBuyDates ?? [])) {
      const iso = parseDate(raw);
      if (!iso) continue;
      const wi = getWeekIdx(iso);
      if (wi < 0 || wi > 16) continue; // Q1 2026 only
      if (!grid[wi]) grid[wi] = {};
      if (!grid[wi][sector]) grid[wi][sector] = { buy: 0, sell: 0 };
      grid[wi][sector].buy += avgBuyPerDate;
    }

    for (const raw of (pos.keySellDates ?? [])) {
      const iso = parseDate(raw);
      if (!iso) continue;
      const wi = getWeekIdx(iso);
      if (wi < 0 || wi > 16) continue;
      if (!grid[wi]) grid[wi] = {};
      if (!grid[wi][sector]) grid[wi][sector] = { buy: 0, sell: 0 };
      grid[wi][sector].sell += avgSellPerDate;
    }
  }

  const weeks    = [...new Set(Object.keys(grid).map(Number))].sort((a, b) => a - b);
  const sectorArr = [...sectors].sort();
  const allBuys  = Object.values(grid).flatMap(s => Object.values(s).map(v => v.buy));
  const maxBuy   = Math.max(...allBuys, 1);

  return { grid, weeks, sectors: sectorArr, maxBuy };
}

// ── color intensity ────────────────────────────────────────────────────────────

function cellColor(buy, sell, max) {
  if (buy === 0 && sell === 0) return null;
  const intensity = Math.min(buy / max, 1);
  if (sell > buy) {
    // Net sell → red tint
    return `rgba(239,68,68,${0.15 + intensity * 0.55})`;
  }
  // Net buy → green tint
  return `rgba(34,197,94,${0.1 + intensity * 0.6})`;
}

function fmtM(v) {
  if (!v) return '';
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}

// ── component ──────────────────────────────────────────────────────────────────

export default function SectorHeatmap() {
  const { grid, weeks, sectors, maxBuy } = useMemo(
    () => buildHeatmapData(ALL_POSITIONS),
    []
  );

  if (!weeks.length) {
    return (
      <div className="card p-5">
        <div className="text-[11px] text-[#444]">Dati heatmap non disponibili.</div>
      </div>
    );
  }

  return (
    <div className="card p-5 overflow-x-auto">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Heatmap Settoriale — Q1 2026
        </h2>
        <p className="text-[11px] text-[#444] mt-0.5">
          Attività di trading per settore × settimana. Intensità = volume stimato.
          Verde = acquisti, Rosso = vendite nette.
        </p>
      </div>

      <div style={{ minWidth: weeks.length * 56 + 100 }}>
        {/* Header row */}
        <div className="flex gap-1 mb-1">
          <div className="w-24 flex-shrink-0" />
          {weeks.map(wi => (
            <div key={wi} className="flex-1 text-center text-[8px] text-[#333] min-w-[52px]">
              W{wi + 1}
              <div className="text-[7px] text-[#222]">{weekLabel(wi)}</div>
            </div>
          ))}
        </div>

        {/* Sector rows */}
        {sectors.map(sector => (
          <div key={sector} className="flex gap-1 mb-1">
            {/* Sector label */}
            <div className="w-24 flex-shrink-0 text-[9px] text-[#555] flex items-center pr-1">
              {sector}
            </div>
            {/* Cells */}
            {weeks.map(wi => {
              const cell = grid[wi]?.[sector];
              const bg = cellColor(cell?.buy ?? 0, cell?.sell ?? 0, maxBuy);
              const tooltip = cell
                ? `${sector} · W${wi + 1} (${weekLabel(wi)})\nBuy: ${fmtM(cell.buy)}\nSell: ${fmtM(cell.sell)}`
                : '';
              return (
                <div
                  key={wi}
                  title={tooltip}
                  className="flex-1 min-w-[52px] h-8 rounded text-center flex items-center justify-center cursor-default transition-opacity hover:opacity-80"
                  style={{ background: bg ?? '#0e0e0e', border: '1px solid #1a1a1a' }}
                >
                  {cell && (cell.buy > 0 || cell.sell > 0) ? (
                    <span className="text-[8px] font-mono" style={{ color: '#000', mixBlendMode: 'difference', opacity: 0.8 }}>
                      {fmtM(cell.buy > cell.sell ? cell.buy : cell.sell)}
                    </span>
                  ) : (
                    <span className="text-[8px] text-[#1e1e1e]">·</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-[#1a1a1a] text-[9px] text-[#444]">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded inline-block" style={{ background: 'rgba(34,197,94,0.5)' }} />
          Acquisti
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded inline-block" style={{ background: 'rgba(239,68,68,0.5)' }} />
          Vendite
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded bg-[#0e0e0e] border border-[#1a1a1a] inline-block" />
          Nessuna attività
        </span>
        <span className="ml-auto">Date dichiarate OGE · stima volume da bande</span>
      </div>
    </div>
  );
}
