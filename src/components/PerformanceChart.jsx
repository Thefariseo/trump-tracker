// PerformanceChart — full 1-year price history with annotated Trump buy/sell markers
// Used on TickerPage (full-size) and optionally in StockCard (compact mode)

import {
  ComposedChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import { useHistoricalPrices } from '../hooks/useHistoricalPrices';

// ── helpers ────────────────────────────────────────────────────────────────────

function parseDate(str) {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length < 3) return null;
  const [m, d, y] = parts;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function fmtPrice(v) {
  if (v == null) return '—';
  if (v >= 10_000) return `$${(v / 1000).toFixed(1)}K`;
  if (v >= 1_000)  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${v.toFixed(2)}`;
}

function fmtPct(v) {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

// ── custom dot renderer ────────────────────────────────────────────────────────

function TradeDot(props) {
  const { cx, cy, payload } = props;
  if (!payload) return null;
  if (payload.isBuy) {
    return (
      <g key={`buy-${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={7} fill="#22c55e" stroke="#0a0a0a" strokeWidth={1.5} />
        <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle"
          fontSize={8} fill="#000" fontWeight="bold">▲</text>
      </g>
    );
  }
  if (payload.isSell) {
    return (
      <g key={`sell-${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#0a0a0a" strokeWidth={1.5} />
        <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle"
          fontSize={8} fill="#fff" fontWeight="bold">▼</text>
      </g>
    );
  }
  return null;
}

// ── tooltip ───────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, avgBuyPrice }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[11px] shadow-xl">
      <div className="text-[#666] mb-1">{d.date}</div>
      <div className="text-white font-mono font-semibold text-[13px]">{fmtPrice(d.price)}</div>
      {d.isBuy  && <div className="text-[#22c55e] mt-1 font-semibold">▲ Trump BUY (OGE 278-T)</div>}
      {d.isSell && <div className="text-[#ef4444] mt-1 font-semibold">▼ Trump SELL (OGE 278-T)</div>}
      {avgBuyPrice && (
        <div className="text-[#D4AF37]/70 text-[9px] mt-1 border-t border-[#2a2a2a] pt-1">
          Entry medio OGE: {fmtPrice(avgBuyPrice)}
          {d.price && (
            <span className={`ml-1 font-semibold ${d.price >= avgBuyPrice ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              ({fmtPct((d.price / avgBuyPrice - 1) * 100)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────────

export default function PerformanceChart({
  ticker,
  color = '#888',
  keyBuyDates  = [],
  keySellDates = [],
  compact = false,          // compact = true → smaller height, no stats strip
}) {
  const { data, loading, error } = useHistoricalPrices(ticker, '1y');

  const height = compact ? 140 : 300;

  if (loading) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-[11px] text-[#333] animate-pulse">Caricamento {ticker}…</div>
      </div>
    );
  }
  if (error || !data?.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-[10px] text-[#222]">Dati non disponibili · {error ?? 'CORS/API'}</div>
      </div>
    );
  }

  // Parse trade date sets
  const buySet  = new Set(keyBuyDates.map(parseDate).filter(Boolean));
  const sellSet = new Set(keySellDates.map(parseDate).filter(Boolean));

  // Annotate
  const annotated = data.map(d => ({
    ...d,
    isBuy:  buySet.has(d.iso),
    isSell: sellSet.has(d.iso),
  }));

  // Compute metrics from data points at buy/sell dates
  const buyPts  = annotated.filter(d => d.isBuy);
  const sellPts = annotated.filter(d => d.isSell);
  const avgBuyPrice     = buyPts.length ? buyPts.reduce((s, d) => s + d.price, 0) / buyPts.length : null;
  const currentPrice    = data[data.length - 1]?.price ?? null;
  const firstBuyPrice   = buyPts[0]?.price ?? null;
  const firstBuyDate    = buyPts[0]?.date  ?? null;
  const pnlFromAvg      = avgBuyPrice   && currentPrice ? (currentPrice / avgBuyPrice   - 1) * 100 : null;
  const pnlFromFirst    = firstBuyPrice && currentPrice ? (currentPrice / firstBuyPrice - 1) * 100 : null;

  // Y domain
  const prices = data.map(d => d.price);
  const minP = Math.min(...prices) * 0.97;
  const maxP = Math.max(...prices) * 1.03;

  // XAxis tick interval (show ~6 labels)
  const tickInterval = Math.floor(annotated.length / 6);

  return (
    <div>
      {/* ── Performance stats strip (full mode only) ── */}
      {!compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg px-3 py-2.5">
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-0.5">Prezzo attuale</div>
            <div className="text-[16px] font-bold font-mono text-white">{fmtPrice(currentPrice)}</div>
          </div>
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg px-3 py-2.5">
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-0.5">Entry medio OGE</div>
            <div className="text-[16px] font-bold font-mono text-[#D4AF37]">
              {avgBuyPrice ? fmtPrice(avgBuyPrice) : '—'}
            </div>
            <div className="text-[9px] text-[#333] mt-0.5">{buyPts.length} date acquisto dichiarate</div>
          </div>
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg px-3 py-2.5">
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-0.5">P&L vs entry medio</div>
            <div className={`text-[16px] font-bold font-mono ${
              pnlFromAvg == null ? 'text-[#444]' : pnlFromAvg >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
            }`}>{fmtPct(pnlFromAvg)}</div>
          </div>
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg px-3 py-2.5">
            <div className="text-[9px] text-[#444] uppercase tracking-wider mb-0.5">P&L dal primo acquisto</div>
            <div className={`text-[16px] font-bold font-mono ${
              pnlFromFirst == null ? 'text-[#444]' : pnlFromFirst >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
            }`}>{fmtPct(pnlFromFirst)}</div>
            <div className="text-[9px] text-[#333] mt-0.5">{firstBuyDate ?? '—'}</div>
          </div>
        </div>
      )}

      {/* ── Chart ── */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={annotated} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`pf-grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0}   />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 6" vertical={false} />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#444' }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis
              domain={[minP, maxP]}
              tick={{ fontSize: 9, fill: '#444' }}
              axisLine={false}
              tickLine={false}
              width={compact ? 44 : 58}
              tickFormatter={v =>
                v >= 10_000 ? `$${(v / 1000).toFixed(0)}K` :
                v >= 1_000  ? `$${(v / 1000).toFixed(1)}K` :
                `$${v.toFixed(0)}`
              }
            />

            <Tooltip
              content={(props) => <ChartTooltip {...props} avgBuyPrice={avgBuyPrice} />}
              cursor={{ stroke: '#333', strokeWidth: 1 }}
            />

            {/* Vertical lines at buy/sell dates */}
            {buyPts.map(d  => (
              <ReferenceLine key={`bl-${d.iso}`} x={d.date}
                stroke="#22c55e" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="3 5" />
            ))}
            {sellPts.map(d => (
              <ReferenceLine key={`sl-${d.iso}`} x={d.date}
                stroke="#ef4444" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="3 5" />
            ))}

            {/* Average cost basis */}
            {!compact && avgBuyPrice && (
              <ReferenceLine
                y={avgBuyPrice}
                stroke="#D4AF37"
                strokeWidth={1}
                strokeDasharray="5 4"
                strokeOpacity={0.8}
                label={{
                  value: `avg ${fmtPrice(avgBuyPrice)}`,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: '#D4AF37',
                  opacity: 0.8,
                }}
              />
            )}

            {/* Price area with trade markers as custom dots */}
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#pf-grad-${ticker})`}
              dot={<TradeDot />}
              activeDot={{ r: 3, fill: color }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 mt-2 text-[9px] text-[#444]">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-[#22c55e] inline-flex items-center justify-center text-[7px] text-black font-bold">▲</span>
          Data acquisto OGE
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-[#ef4444] inline-flex items-center justify-center text-[7px] text-white font-bold">▼</span>
          Data vendita OGE
        </span>
        {!compact && avgBuyPrice && (
          <span className="flex items-center gap-1.5">
            <span className="w-5 border-t border-dashed border-[#D4AF37]/70 inline-block" />
            Entry medio stimato da date OGE
          </span>
        )}
        <span className="ml-auto">Yahoo Finance · 1 anno · date dichiarate OGE 278-T</span>
      </div>
    </div>
  );
}
