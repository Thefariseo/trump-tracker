import { lazy, Suspense } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid, Legend,
} from 'recharts';
import { useEquityCurve } from '../hooks/useEquityCurve';

function fmtPct(v) {
  if (v == null) return '—';
  return `${v >= 100 ? '+' : ''}${(v - 100).toFixed(1)}%`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[11px] shadow-xl">
      <div className="text-[#666] mb-1.5">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {p.value != null ? fmtPct(p.value) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricChip({ label, value, color }) {
  return (
    <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg px-3 py-2.5 text-center">
      <div className="text-[9px] text-[#444] uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-[15px] font-bold font-mono`} style={{ color }}>
        {value}
      </div>
    </div>
  );
}

export default function EquityCurve() {
  const { data, loading, error } = useEquityCurve();

  if (loading) {
    return (
      <div className="card p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Equity Curve vs Benchmark</h2>
        </div>
        <div className="h-72 flex items-center justify-center">
          <div className="text-[11px] text-[#333] animate-pulse">
            Fetching price history for top 12 positions + SPY + QQQ…
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.length) {
    return (
      <div className="card p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Equity Curve vs Benchmark</h2>
        </div>
        <div className="h-72 flex items-center justify-center">
          <div className="text-[11px] text-[#333]">
            Dati non disponibili — richiede connessione a Yahoo Finance.
          </div>
        </div>
      </div>
    );
  }

  // Filter out leading nulls (before we have data for all series)
  const withData = data.filter(d => d.portfolio != null);
  if (!withData.length) return null;

  // Final values for metrics
  const last   = withData[withData.length - 1];
  const portRet   = last.portfolio != null ? fmtPct(last.portfolio) : '—';
  const spyRet    = last.spy  != null ? fmtPct(last.spy)  : '—';
  const qqqRet    = last.qqq  != null ? fmtPct(last.qqq)  : '—';

  // Alpha vs SPY
  const portNum = last.portfolio ?? 100;
  const spyNum  = last.spy ?? 100;
  const alpha   = portNum - spyNum;
  const alphaStr = `${alpha >= 0 ? '+' : ''}${alpha.toFixed(1)}%`;
  const alphaColor = alpha >= 0 ? '#22c55e' : '#ef4444';

  // Thin data to ~80 points max for chart performance
  const step = Math.max(1, Math.floor(withData.length / 80));
  const chartData = withData.filter((_, i) => i % step === 0 || i === withData.length - 1);

  const portColor = '#D4AF37';
  const spyColor  = '#3b82f6';
  const qqqColor  = '#8b5cf6';

  // Y domain (normalize-relative: ~±30%)
  const allVals = chartData.flatMap(d => [d.portfolio, d.spy, d.qqq].filter(Boolean));
  const minY = Math.min(...allVals) * 0.99;
  const maxY = Math.max(...allVals) * 1.01;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Equity Curve vs Benchmark
          </h2>
          <p className="text-[11px] text-[#444] mt-0.5">
            Performance stimata del portafoglio Trump (top 12 titoli pesati) vs SPY e QQQ · base 100 = 6 Jan 2026
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <MetricChip
          label="Portfolio stimato"
          value={portRet}
          color={portNum >= 100 ? '#22c55e' : '#ef4444'}
        />
        <MetricChip
          label="SPY (benchmark)"
          value={spyRet}
          color={spyNum >= 100 ? '#22c55e' : '#ef4444'}
        />
        <MetricChip
          label="QQQ (tech)"
          value={qqqRet}
          color={(last.qqq ?? 100) >= 100 ? '#22c55e' : '#ef4444'}
        />
        <MetricChip
          label="Alpha vs SPY"
          value={alphaStr}
          color={alphaColor}
        />
      </div>

      {/* Chart */}
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 6" vertical={false} />
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
              width={52}
              tickFormatter={v => `${(v - 100).toFixed(0)}%`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
            <ReferenceLine y={100} stroke="#333" strokeWidth={1} strokeDasharray="4 4" />

            <Line
              type="monotone"
              dataKey="portfolio"
              name="Trump Portfolio"
              stroke={portColor}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="spy"
              name="SPY"
              stroke={spyColor}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="qqq"
              name="QQQ"
              stroke={qqqColor}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 mt-2 text-[9px] text-[#444]">
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t-2 inline-block" style={{ borderColor: portColor }} />
          <span style={{ color: portColor }}>Trump portfolio (top 12 pesato)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t border-dashed inline-block" style={{ borderColor: spyColor }} />
          <span style={{ color: spyColor }}>SPY (S&P 500)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t border-dashed inline-block" style={{ borderColor: qqqColor }} />
          <span style={{ color: qqqColor }}>QQQ (Nasdaq 100)</span>
        </span>
        <span className="ml-auto">Stima — pesi OGE statici, prezzi live Yahoo Finance</span>
      </div>
    </div>
  );
}
