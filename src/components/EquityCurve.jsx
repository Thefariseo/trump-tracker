import { lazy, Suspense } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import { useEquityCurve } from '../hooks/useEquityCurve';

const PORT_COLOR = '#D4AF37';
const SPY_COLOR  = '#3b82f6';
const QQQ_COLOR  = '#a78bfa';

function fmtPct(v) {
  if (v == null) return '—';
  const delta = v - 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
}

/* ─── Tooltip ────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141414] border border-[#272727] rounded-xl px-4 py-3 text-[11px] shadow-2xl">
      <div className="text-[#666] mb-2 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono font-bold" style={{ color: p.color }}>
            {p.value != null ? fmtPct(p.value) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Metric chip ────────────────────────────────────────────────────── */
function MetricChip({ label, value, color, note }) {
  const isPositive = typeof value === 'string' && value.startsWith('+');
  const isNegative = typeof value === 'string' && value.startsWith('-');
  const finalColor = color ?? (isPositive ? '#22c55e' : isNegative ? '#ef4444' : '#aaa');

  return (
    <div className="panel px-4 py-3.5 text-center flex flex-col gap-1">
      <div className="text-[9px] font-bold text-[#555] uppercase tracking-widest leading-none">{label}</div>
      <div className="text-[22px] font-black font-mono leading-none" style={{ color: finalColor }}>
        {value}
      </div>
      {note && <div className="text-[9px] text-[#444]">{note}</div>}
    </div>
  );
}

/* ─── Legend item ────────────────────────────────────────────────────── */
function LegendItem({ color, label, dashed }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="20" height="2" viewBox="0 0 20 2">
        {dashed
          ? <line x1="0" y1="1" x2="20" y2="1" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
          : <line x1="0" y1="1" x2="20" y2="1" stroke={color} strokeWidth="2" />
        }
      </svg>
      <span style={{ color }}>{label}</span>
    </span>
  );
}

export default function EquityCurve() {
  const { data, loading, error } = useEquityCurve();

  if (loading) {
    return (
      <div className="card p-6 min-h-[300px] flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full spin-anim" />
        <div className="text-[11px] text-[#555]">Fetching price history for top 12 positions + SPY + QQQ…</div>
      </div>
    );
  }

  if (error || !data?.length) {
    return (
      <div className="card p-6 min-h-[300px] flex flex-col items-center justify-center gap-2">
        <div className="text-[#444] text-2xl mb-1">📡</div>
        <div className="text-[12px] font-semibold text-[#666]">Dati non disponibili</div>
        <div className="text-[11px] text-[#444]">Richiede connessione a Yahoo Finance</div>
      </div>
    );
  }

  const withData = data.filter(d => d.portfolio != null);
  if (!withData.length) return null;

  // Final values
  const last    = withData[withData.length - 1];
  const portNum = last.portfolio ?? 100;
  const spyNum  = last.spy ?? 100;
  const qqqNum  = last.qqq ?? 100;
  const alpha   = portNum - spyNum;

  const portRet  = fmtPct(portNum);
  const spyRet   = fmtPct(spyNum);
  const qqqRet   = fmtPct(qqqNum);
  const alphaStr = `${alpha >= 0 ? '+' : ''}${alpha.toFixed(1)}%`;

  // Thin to ~80 pts for chart performance
  const step      = Math.max(1, Math.floor(withData.length / 80));
  const chartData = withData.filter((_, i) => i % step === 0 || i === withData.length - 1);

  const allVals = chartData.flatMap(d => [d.portfolio, d.spy, d.qqq].filter(Boolean));
  const minY    = Math.min(...allVals) * 0.99;
  const maxY    = Math.max(...allVals) * 1.01;

  return (
    <div className="card p-5">
      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <MetricChip
          label="Trump portfolio"
          value={portRet}
          color={portNum >= 100 ? '#22c55e' : '#ef4444'}
          note="top 12 pesato OGE"
        />
        <MetricChip
          label="SPY — S&P 500"
          value={spyRet}
          color={spyNum >= 100 ? '#22c55e' : '#ef4444'}
          note="benchmark"
        />
        <MetricChip
          label="QQQ — Nasdaq 100"
          value={qqqRet}
          color={qqqNum >= 100 ? '#22c55e' : '#ef4444'}
          note="tech benchmark"
        />
        <MetricChip
          label="Alpha vs SPY"
          value={alphaStr}
          color={alpha >= 0 ? '#22c55e' : '#ef4444'}
          note="sovra/sotto-performance"
        />
      </div>

      {/* Chart */}
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#171717" strokeDasharray="4 8" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#444' }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              domain={[minY, maxY]}
              tick={{ fontSize: 9, fill: '#444' }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={v => `${(v - 100).toFixed(0)}%`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }} />
            <ReferenceLine y={100} stroke="#2a2a2a" strokeWidth={1} strokeDasharray="5 5" />
            <Line
              type="monotone"
              dataKey="portfolio"
              name="Trump Portfolio"
              stroke={PORT_COLOR}
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="spy"
              name="SPY"
              stroke={SPY_COLOR}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="qqq"
              name="QQQ"
              stroke={QQQ_COLOR}
              strokeWidth={1.5}
              strokeDasharray="3 4"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + note */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-[9px] text-[#555]">
        <LegendItem color={PORT_COLOR} label="Trump portfolio (top 12 pesato)" />
        <LegendItem color={SPY_COLOR}  label="SPY (S&P 500)" dashed />
        <LegendItem color={QQQ_COLOR}  label="QQQ (Nasdaq 100)" dashed />
        <span className="ml-auto hidden sm:block text-[#444]">
          Stima — pesi statici OGE, prezzi live Yahoo Finance
        </span>
      </div>
    </div>
  );
}
