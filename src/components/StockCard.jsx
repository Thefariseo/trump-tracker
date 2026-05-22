import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
const StockMiniChart = lazy(() => import('./StockMiniChart'));

const STATUS_CONFIG = {
  ACCUMULATING: { label: 'ACCUMULATING ▲', bg: 'bg-green-900/20', border: 'border-green-800/40', text: 'text-green-400' },
  TRIMMING:     { label: 'TRIMMING ◆',     bg: 'bg-yellow-900/20', border: 'border-yellow-800/40', text: 'text-yellow-400' },
  EXITING:      { label: 'NET SELLING ▼',  bg: 'bg-red-900/20',   border: 'border-red-800/40',   text: 'text-red-400' },
  CLOSED:       { label: 'CLOSED ✕',       bg: 'bg-red-950/30',   border: 'border-red-900/40',   text: 'text-red-500' },
};

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function fmt(n) {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs === 0) return '—';
  if (abs >= 1e6) return `${sign}~$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}~$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs}`;
}

export default function StockCard({ position, maxValue, expanded: defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const st = STATUS_CONFIG[position.netStatus] || STATUS_CONFIG.TRIMMING;
  const net = position.estimatedBuyTotal - position.estimatedSellTotal;
  const isNetSell = net < 0;

  return (
    <div
      className={`rounded-xl border bg-[#111] transition-all cursor-pointer ${
        expanded ? 'border-[#2a2a2a]' : 'border-[#1a1a1a] hover:border-[#252525]'
      }`}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Header row */}
      <div className="p-3 flex items-start gap-2.5">
        {/* Ticker */}
        <div className="flex-shrink-0">
          <div
            className="text-[13px] font-bold font-mono px-2 py-0.5 rounded"
            style={{ background: `${position.color}18`, color: position.color, border: `1px solid ${position.color}30` }}
          >
            {position.ticker}
          </div>
        </div>

        {/* Name + sector */}
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-[#ccc] leading-tight truncate">{position.name}</div>
          <div className="text-[10px] text-[#444] mt-0.5 truncate">{position.subsector}</div>
        </div>

        {/* Status badge */}
        <div className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${st.bg} ${st.border} ${st.text} whitespace-nowrap`}>
          {st.label}
        </div>
      </div>

      {/* Buy/sell bars */}
      <div className="px-3 pb-2 space-y-1.5">
        {/* Buys */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#22c55e]/60 w-8 flex-shrink-0 font-mono">BUY</span>
          <Bar value={position.estimatedBuyTotal} max={maxValue} color="#22c55e" />
          <span className="text-[9px] text-[#22c55e] w-16 text-right flex-shrink-0 font-mono">{fmt(position.estimatedBuyTotal)}</span>
          <span className="text-[9px] text-[#333] w-8 text-right flex-shrink-0">{position.buys}×</span>
        </div>

        {/* Sells */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#ef4444]/60 w-8 flex-shrink-0 font-mono">SELL</span>
          <Bar value={position.estimatedSellTotal} max={maxValue} color="#ef4444" />
          <span className={`text-[9px] w-16 text-right flex-shrink-0 font-mono ${position.sells > 0 ? 'text-[#ef4444]' : 'text-[#333]'}`}>
            {position.sells > 0 ? fmt(position.estimatedSellTotal) : '—'}
          </span>
          <span className="text-[9px] text-[#333] w-8 text-right flex-shrink-0">
            {position.sells > 0 ? `${position.sells}×` : ''}
          </span>
        </div>

        {/* Net indicator */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#1a1a1a]">
          <span className="text-[9px] text-[#444] w-8 flex-shrink-0 font-medium">NET</span>
          <div className="flex-1" />
          <span className={`text-[11px] font-bold font-mono ${isNetSell ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
            {isNetSell ? '' : '+'}{fmt(net)}
          </span>
        </div>
      </div>

      {/* Flag */}
      {position.flag && (
        <div className="mx-3 mb-2 px-2 py-1 rounded bg-[#1a1a1a] text-[10px] text-[#f5a623]/80">
          {position.flag}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#1a1a1a] px-3 py-3 space-y-3" onClick={e => e.stopPropagation()}>
          {/* Analysis */}
          <p className="text-[11px] text-[#777] leading-relaxed">{position.analysis}</p>

          {/* Key dates */}
          {(position.keyBuyDates?.length > 0 || position.keySellDates?.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {position.keyBuyDates?.slice(0, 3).map(d => (
                <span key={d} className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/20 text-green-500/70 border border-green-900/30">
                  BUY {d}
                </span>
              ))}
              {position.keySellDates?.slice(0, 3).map(d => (
                <span key={d} className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/20 text-red-500/70 border border-red-900/30">
                  SELL {d}
                </span>
              ))}
            </div>
          )}

          {/* Bands detail */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0e0e0e] rounded p-2">
              <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">Max buy band</div>
              <div className="text-[11px] text-[#22c55e]">{position.maxBuyBand || '—'}</div>
              <div className="text-[9px] text-[#333] mt-0.5">{position.buys} transactions</div>
            </div>
            <div className="bg-[#0e0e0e] rounded p-2">
              <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">Max sell band</div>
              <div className="text-[11px] text-[#ef4444]">{position.maxSellBand || '—'}</div>
              <div className="text-[9px] text-[#333] mt-0.5">{position.sells} transactions</div>
            </div>
          </div>

          {/* Price chart */}
          <Suspense fallback={<div className="h-28 flex items-center justify-center text-[10px] text-[#222]">Caricamento…</div>}>
            <StockMiniChart
              ticker={position.ticker}
              color={position.color}
              keyBuyDates={position.keyBuyDates ?? []}
              keySellDates={position.keySellDates ?? []}
            />
          </Suspense>

          {/* Links */}
          <div className="flex items-center gap-3 pt-1">
            <Link
              to={`/ticker/${position.ticker}`}
              className="text-[10px] text-[#C41E3A]/70 hover:text-[#C41E3A] transition-colors"
              onClick={e => e.stopPropagation()}
            >
              Scheda completa →
            </Link>
            <a
              href={position.yahooUrl}
              target="_blank" rel="noreferrer"
              className="text-[10px] text-[#D4AF37]/70 hover:text-[#D4AF37] transition-colors"
              onClick={e => e.stopPropagation()}
            >
              Yahoo ↗
            </a>
            {position.refPrice && (
              <span className="text-[10px] text-[#333]">ref ${position.refPrice} · {position.refPriceDate}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
