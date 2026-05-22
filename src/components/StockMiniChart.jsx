import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts';

// Fetch 6 months of daily price data from Yahoo Finance via Vite proxy
async function fetchHistory(ticker) {
  const url = `/api/yf/v8/finance/chart/${ticker}?interval=1d&range=6mo`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status}`);
  const json = await res.json();
  const { timestamp, indicators } = json.chart.result[0];
  const closes = indicators.quote[0].close;
  return timestamp.map((ts, i) => ({
    date: new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    iso:  new Date(ts * 1000).toISOString().slice(0, 10),
    price: closes[i] != null ? +closes[i].toFixed(2) : null,
  })).filter(d => d.price != null);
}

// Parse "M/D/YYYY" or "M/D/YY" → ISO date string
function parseDate(str) {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length < 3) return null;
  const [m, d, y] = parts;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[10px] shadow-xl">
      <div className="text-[#666] mb-0.5">{d.date}</div>
      <div className="text-white font-mono font-semibold">${d.price.toFixed(2)}</div>
      {d.isBuy  && <div className="text-[#22c55e] text-[9px] mt-0.5">▲ Trump BUY</div>}
      {d.isSell && <div className="text-[#ef4444] text-[9px] mt-0.5">▼ Trump SELL</div>}
    </div>
  );
}

export default function StockMiniChart({ ticker, color, keyBuyDates = [], keySellDates = [] }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchHistory(ticker)
      .then(raw => {
        // Parse trade dates to ISO
        const buySets  = new Set(keyBuyDates.map(parseDate).filter(Boolean));
        const sellSets = new Set(keySellDates.map(parseDate).filter(Boolean));
        const enriched = raw.map(d => ({
          ...d,
          isBuy:  buySets.has(d.iso),
          isSell: sellSets.has(d.iso),
        }));
        setData(enriched);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="h-28 flex items-center justify-center">
        <div className="text-[10px] text-[#333] animate-pulse">Caricamento grafico {ticker}…</div>
      </div>
    );
  }

  if (error || !data?.length) {
    return (
      <div className="h-28 flex items-center justify-center">
        <div className="text-[10px] text-[#222]">Dati non disponibili (CORS/API)</div>
      </div>
    );
  }

  const buyDots  = data.filter(d => d.isBuy);
  const sellDots = data.filter(d => d.isSell);
  const minP = Math.min(...data.map(d => d.price)) * 0.98;
  const maxP = Math.max(...data.map(d => d.price)) * 1.02;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-[#333] uppercase tracking-wider">Prezzo 6 mesi · date transazioni</span>
        <div className="flex gap-2 text-[9px]">
          {buyDots.length  > 0 && <span className="text-[#22c55e]">▲ {buyDots.length} acquisto/i</span>}
          {sellDots.length > 0 && <span className="text-[#ef4444]">▼ {sellDots.length} vendita/e</span>}
        </div>
      </div>
      <div style={{ height: 110 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1a1a1a" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
            <YAxis domain={[minP, maxP]} tick={{ fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(0)}`} />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${ticker})`}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.isBuy)  return <circle key={`buy-${cx}`}  cx={cx} cy={cy} r={4} fill="#22c55e" stroke="#0a0a0a" strokeWidth={1} />;
                if (payload.isSell) return <circle key={`sell-${cx}`} cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#0a0a0a" strokeWidth={1} />;
                return null;
              }}
              activeDot={{ r: 3, fill: color }}
            />
            {/* Zero-width reference lines at buy/sell dates for visual emphasis */}
            {buyDots.map(d  => <ReferenceLine key={`bl-${d.iso}`} x={d.date} stroke="#22c55e" strokeWidth={1} strokeOpacity={0.4} strokeDasharray="2 3" />)}
            {sellDots.map(d => <ReferenceLine key={`sl-${d.iso}`} x={d.date} stroke="#ef4444" strokeWidth={1} strokeOpacity={0.4} strokeDasharray="2 3" />)}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[8px] text-[#1e1e1e] mt-0.5 text-right">Yahoo Finance · 6 mesi · ▲▼ date dichiarate OGE</div>
    </div>
  );
}
