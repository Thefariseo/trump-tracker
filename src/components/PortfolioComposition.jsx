import { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap,
} from 'recharts';
import { ALLOCATIONS, SECTOR_ALLOCATIONS, NET_SELLERS, TOTAL_ESTIMATED_NET } from '../data/unified';

const SECTOR_COLORS = {
  'Technology':   '#6366f1',
  'ETF':          '#0ea5e9',
  'Consumer':     '#f59e0b',
  'Healthcare':   '#10b981',
  'Industrials':  '#8b5cf6',
  'Media':        '#ec4899',
  'Financials':   '#14b8a6',
};

function sectorColor(s) { return SECTOR_COLORS[s.split('/')[0].trim()] || '#6b7280'; }

function fmtPct(v) { return `${(v * 100).toFixed(1)}%`; }
function fmtM(v)   { return `~$${(v / 1e6).toFixed(2)}M`; }

function SectorTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[11px] shadow-xl">
      <div className="font-bold text-white mb-1">{d.sector}</div>
      <div className="text-[#aaa]">{fmtPct(d.weight)} del portafoglio</div>
      <div className="text-[#555] mt-0.5 text-[10px]">{d.tickers.join(', ')}</div>
    </div>
  );
}

function StockTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[11px] shadow-xl">
      <div className="font-bold text-white mb-1">{d.ticker} — {d.name}</div>
      <div className="text-[#aaa]">Peso: <span className="text-white font-semibold">{fmtPct(d.weight)}</span></div>
      <div className="text-[#aaa]">Net investito: <span className="text-[#22c55e]">{fmtM(d.net)}</span></div>
      <div className="text-[#555] text-[10px] mt-0.5">{d.sector}</div>
    </div>
  );
}

// Custom treemap cell with label
function TreemapCell(props) {
  const { x, y, width, height, name, root, depth, value, ticker, color } = props;
  if (depth === 0 || !width || !height) return null;
  const showLabel = width > 32 && height > 20;
  return (
    <g>
      <rect
        x={x + 1} y={y + 1}
        width={Math.max(0, width - 2)}
        height={Math.max(0, height - 2)}
        rx={3}
        fill={color || '#6b7280'}
        fillOpacity={0.7}
        stroke={color || '#6b7280'}
        strokeWidth={0.5}
        strokeOpacity={0.4}
      />
      {showLabel && (
        <>
          <text x={x + 6} y={y + 14} fontSize={9} fill="#fff" fontFamily="monospace" fontWeight="bold">
            {ticker || name}
          </text>
          {height > 32 && (
            <text x={x + 6} y={y + 25} fontSize={8} fill="rgba(255,255,255,0.5)">
              {(value * 100).toFixed(1)}%
            </text>
          )}
        </>
      )}
    </g>
  );
}

export default function PortfolioComposition({ onSectorClick, selectedSector }) {
  const [tab, setTab] = useState('sector'); // 'sector' | 'stocks' | 'treemap'
  const [showAll, setShowAll] = useState(false);

  const displayStocks = showAll ? ALLOCATIONS : ALLOCATIONS.slice(0, 20);
  const totalNetM = (TOTAL_ESTIMATED_NET / 1e6).toFixed(1);

  const barData = displayStocks.map(s => ({
    ticker:     s.ticker,
    name:       s.name,
    weight:     +(s.weight * 100).toFixed(2),
    net:        s.net,
    sector:     s.sector,
    color:      s.color || sectorColor(s.sector),
  }));

  const treemapData = ALLOCATIONS.map(s => ({
    name:   s.ticker,
    ticker: s.ticker,
    value:  s.weight,
    color:  s.color || sectorColor(s.sector),
    sector: s.sector,
  }));

  const pieData = SECTOR_ALLOCATIONS.map(s => ({
    ...s,
    isSelected: selectedSector === s.sector,
  }));

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-[13px] font-bold text-[#ccc] tracking-tight">Portfolio Composition</h2>
          <p className="text-[11px] text-[#555] mt-1">
            Net stimato <span className="text-[#22c55e] font-semibold">~${totalNetM}M</span>
            {selectedSector && (
              <button onClick={() => onSectorClick?.(null)}
                className="ml-2 text-[#D4AF37] hover:opacity-70 transition-opacity font-medium">
                · {selectedSector} ✕
              </button>
            )}
          </p>
        </div>
        <div className="flex gap-1">
          {[['sector', 'Settori'], ['stocks', 'Titoli'], ['treemap', 'Mappa']].map(([v, lbl]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                tab === v
                  ? 'bg-[#1e1e1e] border-[#2a2a2a] text-[#ccc]'
                  : 'border-transparent text-[#555] hover:text-[#888]'
              }`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: SETTORI ── */}
      {tab === 'sector' && (
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Donut */}
          <div style={{ width: 240, height: 240, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="weight"
                  nameKey="sector"
                  cx="50%" cy="50%"
                  innerRadius={62} outerRadius={105}
                  paddingAngle={2}
                  strokeWidth={0}
                  onClick={(d) => onSectorClick?.(selectedSector === d.sector ? null : d.sector)}
                  style={{ cursor: onSectorClick ? 'pointer' : 'default' }}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.sector}
                      fill={SECTOR_COLORS[entry.sector] || '#6b7280'}
                      fillOpacity={!selectedSector || entry.isSelected ? 1 : 0.3}
                      stroke={entry.isSelected ? '#fff' : 'transparent'}
                      strokeWidth={entry.isSelected ? 1.5 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<SectorTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend bars */}
          <div className="flex-1 w-full space-y-2">
            {SECTOR_ALLOCATIONS.map(s => {
              const color = SECTOR_COLORS[s.sector] || '#6b7280';
              const pct = s.weight * 100;
              const isActive = !selectedSector || selectedSector === s.sector;
              return (
                <button
                  key={s.sector}
                  onClick={() => onSectorClick?.(selectedSector === s.sector ? null : s.sector)}
                  className="flex items-center gap-3 w-full text-left group"
                >
                  <div className="w-2 h-2 rounded-sm flex-shrink-0 transition-opacity" style={{ background: color, opacity: isActive ? 1 : 0.3 }} />
                  <div className="text-[11px] w-24 flex-shrink-0 transition-colors" style={{ color: isActive ? '#888' : '#333' }}>{s.sector}</div>
                  <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, pct)}%`, background: color, opacity: isActive ? 1 : 0.2 }} />
                  </div>
                  <div className="text-[11px] font-mono font-semibold w-10 text-right transition-opacity" style={{ color, opacity: isActive ? 1 : 0.3 }}>
                    {pct.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-[#333] w-10 text-right hidden sm:block">{s.tickers.length}×</div>
                </button>
              );
            })}
            {onSectorClick && (
              <p className="text-[9px] text-[#444] pt-1">Clicca un settore per filtrare il Mirror Investment →</p>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: TITOLI ── */}
      {tab === 'stocks' && (
        <>
          <div style={{ height: displayStocks.length * 22 + 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }} barSize={8}>
                <CartesianGrid horizontal={false} stroke="#1a1a1a" strokeDasharray="2 4" />
                <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fontSize: 9, fill: '#444' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="ticker" tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<StockTooltip />} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="weight" radius={[0, 3, 3, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {ALLOCATIONS.length > 20 && (
            <button onClick={() => setShowAll(v => !v)}
              className="w-full mt-3 py-1.5 text-[10px] text-[#444] hover:text-[#666] border border-[#1a1a1a] rounded transition-colors">
              {showAll ? `▲ Mostra meno` : `▼ Mostra tutti i ${ALLOCATIONS.length} titoli`}
            </button>
          )}
        </>
      )}

      {/* ── TAB: TREEMAP ── */}
      {tab === 'treemap' && (
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="value"
              content={<TreemapCell />}
              aspectRatio={4 / 3}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#111] border border-[#2a2a2a] rounded px-3 py-2 text-[11px] shadow-xl">
                      <div className="font-bold text-white">{d.ticker}</div>
                      <div className="text-[#aaa]">{(d.value * 100).toFixed(2)}%</div>
                      <div className="text-[#555] text-[10px]">{d.sector}</div>
                    </div>
                  );
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}

      {/* Net sellers footer */}
      {NET_SELLERS.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
          <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1.5">Posizioni liquidate / net sellers (escluse dai pesi)</div>
          <div className="flex flex-wrap gap-1.5">
            {NET_SELLERS.map(s => (
              <span key={s.ticker} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#ef4444]/20 text-[#ef4444]/60 bg-[#ef4444]/5">
                {s.ticker}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
