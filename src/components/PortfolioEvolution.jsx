import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
} from 'recharts';
import { FILING_SNAPSHOTS, SECTOR_COLORS, SECTORS } from '../data/filingSnapshots';

const TYPE_DOT = { bonds: '#6b7280', mixed: '#0ea5e9', equity: '#22c55e' };

function SectorTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const snap = FILING_SNAPSHOTS.find(s => s.label === label);
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[11px] shadow-xl min-w-[180px]">
      <div className="font-bold text-white mb-1.5">{snap?.date ?? label}</div>
      {payload.filter(p => p.value !== 0).map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }}>{p.dataKey}</span>
          <span className={`font-mono ${p.value >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {p.value >= 0 ? '+' : ''}{p.value.toFixed(1)}M
          </span>
        </div>
      ))}
      <div className="border-t border-[#222] mt-1.5 pt-1 flex justify-between">
        <span className="text-[#444]">Net totale</span>
        <span className={`font-mono font-semibold ${total >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          {total >= 0 ? '+' : ''}{total.toFixed(1)}M
        </span>
      </div>
      {snap?.note && <p className="text-[9px] text-[#444] mt-1.5 leading-relaxed">{snap.note}</p>}
    </div>
  );
}

export default function PortfolioEvolution() {
  const [view, setView] = useState('area'); // 'area' | 'bar'

  // Format data for recharts
  const chartData = FILING_SNAPSHOTS.map(s => ({
    label: s.label,
    type:  s.type,
    ...s.net,
    _total: Object.values(s.net).reduce((a, b) => a + b, 0),
  }));

  // Key events to annotate
  const annotations = [
    { label: 'Feb 26', text: '⚠ Sells', x: 'Feb 26' },
    { label: 'May 8',  text: '✓ Full reveal', x: 'May 8' },
  ];

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Portfolio Evolution — Disclosed Net by Filing</h2>
          <p className="text-[11px] text-[#444] mt-0.5">
            Esposizione netta <em>pubblicamente nota</em> per settore ad ogni filing OGE 278-T.
            Il crollo di feb 2026 riflette le vendite bloccate divulgate, i riacquisti furono rivelati solo a maggio.
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {['area', 'bar'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                view === v ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'border-transparent text-[#444] hover:text-[#666]'
              }`}>
              {v === 'area' ? 'Area' : 'Barre'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          {view === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#444' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}M`} tick={{ fontSize: 9, fill: '#444' }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<SectorTooltip />} />
              <ReferenceLine y={0} stroke="#333" strokeWidth={1} />
              {SECTORS.map(sec => (
                <Area
                  key={sec}
                  type="monotone"
                  dataKey={sec}
                  stackId="1"
                  stroke={SECTOR_COLORS[sec]}
                  fill={SECTOR_COLORS[sec]}
                  fillOpacity={0.3}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" horizontal />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#444' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${v}M`} tick={{ fontSize: 9, fill: '#444' }} axisLine={false} tickLine={false} width={42} />
              <Tooltip content={<SectorTooltip />} cursor={{ fill: '#ffffff08' }} />
              <ReferenceLine y={0} stroke="#333" strokeWidth={1} />
              {SECTORS.map(sec => (
                <Bar key={sec} dataKey={sec} stackId="1" fill={SECTOR_COLORS[sec]} fillOpacity={0.75} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend + annotation */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-[#1a1a1a]">
        {SECTORS.map(s => (
          <span key={s} className="flex items-center gap-1 text-[9px]" style={{ color: SECTOR_COLORS[s] }}>
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: SECTOR_COLORS[s] }} />
            {s}
          </span>
        ))}
        <span className="ml-auto text-[9px] text-[#2a2a2a]">valori stimati in $M · net = acquisti − vendite</span>
      </div>

      {/* Key insight callout */}
      <div className="mt-3 grid sm:grid-cols-2 gap-2">
        <div className="bg-[#1a1010] border border-[#3a1a1a] rounded-lg px-3 py-2">
          <div className="text-[9px] font-bold text-[#ef4444] uppercase tracking-wider mb-0.5">Feb 26, 2026 — Solo vendite divulgate</div>
          <p className="text-[10px] text-[#777] leading-relaxed">
            MSFT −$25.6M · META −$23M · VIG −$12M · PLTR −$4M. Pubblicamente sembrava un massiccio disinvestimento dal tech.
          </p>
        </div>
        <div className="bg-[#0e1a10] border border-[#1a3a1a] rounded-lg px-3 py-2">
          <div className="text-[9px] font-bold text-[#22c55e] uppercase tracking-wider mb-0.5">May 8, 2026 — La vera storia</div>
          <p className="text-[10px] text-[#777] leading-relaxed">
            3.642 transazioni di acquisto rivelate con <em>filing in ritardo</em>: AMZN, ORCL, ADBE, COST, UNH… +$84.8M netto in accumulo.
          </p>
        </div>
      </div>
    </div>
  );
}
