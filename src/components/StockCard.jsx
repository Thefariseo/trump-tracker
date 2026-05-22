import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

const StockMiniChart = lazy(() => import('./StockMiniChart'));

const STATUS_CONFIG = {
  ACCUMULATING: {
    label:  'ACCUMULATING',
    symbol: '▲',
    bg:     'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    text:   '#22c55e',
  },
  TRIMMING: {
    label:  'TRIMMING',
    symbol: '◆',
    bg:     'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.25)',
    text:   '#eab308',
  },
  EXITING: {
    label:  'NET SELLING',
    symbol: '▼',
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    text:   '#ef4444',
  },
  CLOSED: {
    label:  'CLOSED',
    symbol: '✕',
    bg:     'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.2)',
    text:   '#ef4444',
  },
};

function fmt(n) {
  if (n === null || n === undefined || n === 0) return '—';
  const abs  = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e6) return `${sign}~$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}~$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs}`;
}

function FlowBar({ value, max, color }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color, opacity: 0.8 }}
      />
    </div>
  );
}

export default function StockCard({ position, maxValue, expanded: defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const st  = STATUS_CONFIG[position.netStatus] ?? STATUS_CONFIG.TRIMMING;
  const net = position.estimatedBuyTotal - position.estimatedSellTotal;
  const isNetSell = net < 0;

  return (
    <div
      className={`rounded-xl border transition-all cursor-pointer ${
        expanded
          ? 'border-[#2a2a2a] bg-[#111]'
          : 'border-[#1a1a1a] bg-[#0e0e0e] hover:border-[#242424] hover:bg-[#111]'
      }`}
      onClick={() => setExpanded(e => !e)}
    >
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="p-3.5 flex items-start gap-3">

        {/* Ticker badge */}
        <div className="flex-shrink-0 mt-0.5">
          <div
            className="text-[13px] font-bold font-mono px-2.5 py-1 rounded-lg leading-none"
            style={{
              background: `${position.color}14`,
              color:      position.color,
              border:     `1px solid ${position.color}28`,
            }}
          >
            {position.ticker}
          </div>
        </div>

        {/* Name + sector */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-[#ccc] leading-tight truncate">
            {position.name}
          </div>
          <div className="text-[10px] text-[#555] mt-0.5 truncate">{position.subsector}</div>
        </div>

        {/* Status badge */}
        <div
          className="flex-shrink-0 flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md leading-none"
          style={{
            background: st.bg,
            border:     `1px solid ${st.border}`,
            color:      st.text,
          }}
        >
          <span>{st.symbol}</span>
          <span className="hidden sm:inline">{st.label}</span>
        </div>
      </div>

      {/* ── Buy / Sell / Net ────────────────────────────────────────── */}
      <div className="px-3.5 pb-3.5 space-y-1.5">
        {/* Buys */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-[#22c55e]/50 w-7 flex-shrink-0">BUY</span>
          <FlowBar value={position.estimatedBuyTotal} max={maxValue} color="#22c55e" />
          <span className="text-[10px] text-[#22c55e] font-mono font-semibold w-16 text-right flex-shrink-0">
            {fmt(position.estimatedBuyTotal)}
          </span>
          <span className="text-[9px] text-[#444] w-6 text-right flex-shrink-0 font-mono">{position.buys}×</span>
        </div>

        {/* Sells */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-[#ef4444]/50 w-7 flex-shrink-0">SELL</span>
          <FlowBar value={position.estimatedSellTotal} max={maxValue} color="#ef4444" />
          <span className={`text-[10px] font-mono font-semibold w-16 text-right flex-shrink-0 ${position.sells > 0 ? 'text-[#ef4444]' : 'text-[#333]'}`}>
            {position.sells > 0 ? fmt(position.estimatedSellTotal) : '—'}
          </span>
          <span className="text-[9px] text-[#444] w-6 text-right flex-shrink-0 font-mono">
            {position.sells > 0 ? `${position.sells}×` : ''}
          </span>
        </div>

        {/* Net */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
          <span className="text-[9px] font-bold text-[#444] tracking-wider">NET FLOW</span>
          <span
            className="text-[13px] font-black font-mono"
            style={{ color: isNetSell ? '#ef4444' : '#22c55e' }}
          >
            {isNetSell ? '' : '+'}{fmt(net)}
          </span>
        </div>
      </div>

      {/* ── Flag / note ─────────────────────────────────────────────── */}
      {position.flag && (
        <div className="mx-3.5 mb-3 px-3 py-1.5 rounded-lg bg-[#1a1500] border border-[#f5a623]/20 text-[10px] text-[#f5a623]/90">
          {position.flag}
        </div>
      )}

      {/* ── Expanded panel ──────────────────────────────────────────── */}
      {expanded && (
        <div
          className="border-t border-[#1a1a1a] px-3.5 py-4 space-y-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Analysis text */}
          {position.analysis && (
            <p className="text-[12px] text-[#888] leading-relaxed">{position.analysis}</p>
          )}

          {/* Key dates */}
          {(position.keyBuyDates?.length > 0 || position.keySellDates?.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {position.keyBuyDates?.slice(0, 4).map(d => (
                <span
                  key={d}
                  className="text-[9px] font-semibold px-2 py-1 rounded-md"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  ▲ {d}
                </span>
              ))}
              {position.keySellDates?.slice(0, 4).map(d => (
                <span
                  key={d}
                  className="text-[9px] font-semibold px-2 py-1 rounded-md"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  ▼ {d}
                </span>
              ))}
            </div>
          )}

          {/* Band detail */}
          <div className="grid grid-cols-2 gap-2">
            <div className="panel p-3">
              <div className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1.5">Max buy band</div>
              <div className="text-[12px] font-semibold text-[#22c55e]">{position.maxBuyBand || '—'}</div>
              <div className="text-[9px] text-[#444] mt-1">{position.buys} transazioni</div>
            </div>
            <div className="panel p-3">
              <div className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1.5">Max sell band</div>
              <div className="text-[12px] font-semibold text-[#ef4444]">{position.maxSellBand || '—'}</div>
              <div className="text-[9px] text-[#444] mt-1">{position.sells} transazioni</div>
            </div>
          </div>

          {/* Mini price chart */}
          <Suspense fallback={
            <div className="h-28 flex items-center justify-center text-[10px] text-[#333]">
              Caricamento grafico…
            </div>
          }>
            <StockMiniChart
              ticker={position.ticker}
              color={position.color}
              keyBuyDates={position.keyBuyDates ?? []}
              keySellDates={position.keySellDates ?? []}
            />
          </Suspense>

          {/* Links */}
          <div className="flex items-center gap-4 pt-1">
            <Link
              to={`/ticker/${position.ticker}`}
              className="text-[11px] font-semibold text-[#C41E3A]/80 hover:text-[#C41E3A] transition-colors flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              Scheda completa →
            </Link>
            <a
              href={position.yahooUrl}
              target="_blank" rel="noreferrer"
              className="text-[11px] font-medium text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
              onClick={e => e.stopPropagation()}
            >
              Yahoo ↗
            </a>
            {position.refPrice && (
              <span className="text-[10px] text-[#444] ml-auto font-mono">
                ref ${position.refPrice}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
