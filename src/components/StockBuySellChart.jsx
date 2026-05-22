import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { ALL_POSITIONS } from '../data/unified';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const buys = payload.find(p => p.dataKey === 'buys')?.value || 0;
  const sells = payload.find(p => p.dataKey === 'sells')?.value || 0;
  const net = buys + sells; // sells are stored negative

  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-[11px] shadow-xl">
      <div className="font-bold text-white mb-1.5">{label}</div>
      <div className="text-[#22c55e]">▲ Buys: ~${buys.toFixed(1)}M est.</div>
      {sells < 0 && <div className="text-[#ef4444]">▼ Sells: ~${Math.abs(sells).toFixed(1)}M est.</div>}
      <div className={`font-semibold mt-1 ${net >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
        Net: {net >= 0 ? '+' : ''}${net.toFixed(1)}M
      </div>
    </div>
  );
}

export default function StockBuySellChart() {
  const data = ALL_POSITIONS
    .filter(p => p.estimatedBuyTotal > 500_000 || p.estimatedSellTotal > 500_000)
    .sort((a, b) => (b.estimatedBuyTotal - b.estimatedSellTotal) - (a.estimatedBuyTotal - a.estimatedSellTotal))
    .slice(0, 22)
    .map(p => ({
      ticker: p.ticker,
      name: p.name,
      buys:  +(p.estimatedBuyTotal / 1e6).toFixed(1),
      sells: p.estimatedSellTotal > 0 ? -(p.estimatedSellTotal / 1e6).toFixed(1) : 0,
      status: p.netStatus,
      color: p.color,
    }));

  const maxBuy = Math.max(...data.map(d => d.buys));
  const maxSell = Math.max(...data.map(d => Math.abs(d.sells)));
  const maxAbs = Math.max(maxBuy, maxSell);

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider">Buy / Sell Flow — Q1 2026</h2>
        <p className="text-[11px] text-[#444] mt-0.5">
          Stima in $M basata su midpoint delle fasce OGE. Verde = acquisti, Rosso = vendite.
        </p>
      </div>

      <div style={{ height: 520 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
            barSize={10}
            barGap={2}
          >
            <CartesianGrid horizontal={false} stroke="#1a1a1a" strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[-(maxAbs * 1.1), maxAbs * 1.1]}
              tickFormatter={v => v === 0 ? '0' : `$${Math.abs(v)}M`}
              tick={{ fontSize: 9, fill: '#444' }}
              axisLine={{ stroke: '#222' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="ticker"
              tick={{ fontSize: 10, fill: '#666', fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
            <ReferenceLine x={0} stroke="#333" strokeWidth={1} />

            <Bar dataKey="buys" name="Buys" radius={[0, 3, 3, 0]} stackId="a">
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.status === 'ACCUMULATING' ? '#22c55e' :
                        entry.status === 'TRIMMING'     ? '#84cc16' :
                        '#6b7280'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
            <Bar dataKey="sells" name="Sells" radius={[3, 0, 0, 3]} stackId="b">
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.sells < -1 ? '#ef4444' : '#6b7280'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-[#444]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#22c55e] inline-block" /> Acquisti stimati</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#ef4444] inline-block" /> Vendite stimate</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#6b7280] inline-block" /> Attività contenuta</span>
      </div>
    </div>
  );
}
