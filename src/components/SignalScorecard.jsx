import { useState, useMemo } from 'react';
import { useStockPrices } from '../hooks/useStockPrices';
import { useBenchmarkReturn } from '../hooks/useBenchmarkReturn';
import { ALLOCATIONS } from '../data/unified';

function pct(v, sign = true) {
  if (v == null) return '—';
  return `${sign && v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

// ─── Metric chip ───────────────────────────────────────────────────────────────
function Chip({ label, value, sub, color, large }) {
  return (
    <div className="panel rounded-xl px-4 py-3.5 text-center flex flex-col gap-1.5">
      <div className="text-[9px] font-bold text-[#555] uppercase tracking-widest leading-none">{label}</div>
      <div
        className={`font-black font-mono leading-none tracking-tight ${large ? 'text-[28px]' : 'text-[22px]'}`}
        style={{ color }}
      >
        {value}
      </div>
      {sub && <div className="text-[9px] text-[#444]">{sub}</div>}
    </div>
  );
}

// ─── Win rate bar ──────────────────────────────────────────────────────────────
function WinBar({ wins, total, beatSpy }) {
  const winPct     = total > 0 ? (wins / total) * 100 : 0;
  const beatSpyPct = total > 0 ? (beatSpy / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[#666] w-28 flex-shrink-0">In profitto</span>
        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${winPct}%`, background: '#22c55e', opacity: 0.8 }}
          />
        </div>
        <span className="text-[12px] font-bold font-mono text-[#22c55e] w-12 text-right">{Math.round(winPct)}%</span>
        <span className="text-[10px] text-[#555] w-14 text-right">{wins}/{total}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-[#666] w-28 flex-shrink-0">Batte SPY</span>
        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${beatSpyPct}%`, background: '#D4AF37', opacity: 0.8 }}
          />
        </div>
        <span className="text-[12px] font-bold font-mono text-[#D4AF37] w-12 text-right">{Math.round(beatSpyPct)}%</span>
        <span className="text-[10px] text-[#555] w-14 text-right">{beatSpy}/{total}</span>
      </div>
    </div>
  );
}

// ─── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }) {
  return (
    <span className="text-[9px] ml-0.5" style={{ opacity: active ? 1 : 0.3 }}>
      {active ? (dir === 'desc' ? '▼' : '▲') : '⇅'}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

export default function SignalScorecard() {
  const [showAll,   setShowAll]   = useState(false);
  const [sortKey,   setSortKey]   = useState('return');
  const [sortDir,   setSortDir]   = useState('desc');

  const { prices: stockPrices, live }    = useStockPrices();
  const { data: bench, loading: bLoading } = useBenchmarkReturn();

  const spyRet = bench?.spy.returnPct ?? null;

  // Build per-position signals
  const signals = useMemo(() => {
    return ALLOCATIONS
      .filter(a => a.ref_price > 1 && !a.ticker.includes('_'))
      .map(a => {
        const live    = stockPrices[a.ticker];
        const hasLive = live != null;
        const ret     = hasLive ? (live / a.ref_price - 1) * 100 : null;
        const alpha   = ret != null && spyRet != null ? ret - spyRet : null;
        return {
          ticker:    a.ticker,
          name:      a.name,
          color:     a.color,
          weight:    a.weight,
          refPrice:  a.ref_price,
          livePrice: live,
          returnPct: ret,
          alpha,
          isProfit:  ret != null ? ret > 0 : null,
          beatsSpy:  alpha != null ? alpha > 0 : null,
          hasLive,
        };
      });
  }, [stockPrices, spyRet]);

  // Aggregate metrics
  const { covered, wins, beatSpy, avgRet, best, worst, avgAlpha } = useMemo(() => {
    const withLive = signals.filter(s => s.returnPct != null);
    if (!withLive.length) return {};

    const wins      = withLive.filter(s => s.isProfit).length;
    const beatSpy   = withLive.filter(s => s.beatsSpy).length;
    const avgRet    = withLive.reduce((s, p) => s + p.returnPct, 0) / withLive.length;
    const avgAlpha  = withLive.filter(s => s.alpha != null).reduce((s, p) => s + p.alpha, 0) / withLive.length;
    const sorted    = [...withLive].sort((a, b) => b.returnPct - a.returnPct);

    return {
      covered: withLive.length,
      wins,
      beatSpy,
      avgRet,
      best:  sorted[0],
      worst: sorted[sorted.length - 1],
      avgAlpha,
    };
  }, [signals]);

  // Sorted visible signals
  const sorted = useMemo(() => {
    return [...signals]
      .filter(s => s.hasLive)
      .sort((a, b) => {
        const av = a[sortKey] ?? -Infinity;
        const bv = b[sortKey] ?? -Infinity;
        return sortDir === 'desc' ? bv - av : av - bv;
      });
  }, [signals, sortKey, sortDir]);

  const visible = showAll ? sorted : sorted.slice(0, 12);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const loading = bLoading || !live;

  if (loading) {
    return (
      <div className="card p-6 min-h-[200px] flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full spin-anim" />
        <p className="text-[11px] text-[#555]">Caricamento prezzi live e benchmark…</p>
      </div>
    );
  }

  if (!covered) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center gap-2 min-h-[160px]">
        <p className="text-[12px] font-semibold text-[#555]">Dati non disponibili</p>
        <p className="text-[11px] text-[#444]">Richiede connessione a Yahoo Finance</p>
      </div>
    );
  }

  const winRate = covered > 0 ? (wins / covered * 100) : 0;
  const winColor = winRate >= 65 ? '#22c55e' : winRate >= 50 ? '#D4AF37' : '#ef4444';

  return (
    <div className="card p-5 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-[13px] font-bold text-[#ccc] tracking-tight">
          🎯 Signal Scorecard
        </h2>
        <p className="text-[11px] text-[#555] mt-1">
          Da 6 Gen 2026 · prezzi di riferimento OGE vs prezzi live Yahoo Finance
          {spyRet != null && (
            <span className="ml-2 text-[#D4AF37]">· SPY {pct(spyRet)}</span>
          )}
        </p>
      </div>

      {/* KPI chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Chip
          label={`In utile su ${covered}`}
          value={`${wins}/${covered}`}
          sub={`${Math.round(winRate)}% win rate`}
          color={winColor}
          large
        />
        <Chip
          label="Return medio"
          value={pct(avgRet)}
          sub="media non pesata"
          color={avgRet >= 0 ? '#22c55e' : '#ef4444'}
        />
        <Chip
          label="SPY nello stesso periodo"
          value={pct(spyRet)}
          color={spyRet >= 0 ? '#3b82f6' : '#ef4444'}
          sub="benchmark"
        />
        <Chip
          label="Alpha medio"
          value={pct(avgAlpha)}
          sub="vs SPY per posizione"
          color={avgAlpha >= 0 ? '#D4AF37' : '#ef4444'}
        />
      </div>

      {/* Win rate bars */}
      <WinBar wins={wins} total={covered} beatSpy={beatSpy} />

      {/* Best / worst callout */}
      {best && worst && (
        <div className="grid sm:grid-cols-2 gap-2.5">
          <div
            className="panel rounded-xl p-3.5 flex items-center gap-3"
            style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.06)' }}
          >
            <div className="text-xl flex-shrink-0">🏆</div>
            <div>
              <div className="text-[9px] font-bold text-[#555] uppercase tracking-wider mb-0.5">Miglior trade</div>
              <span className="text-[14px] font-black font-mono" style={{ color: best.color }}>
                {best.ticker}
              </span>
              <span className="text-[14px] font-black text-[#22c55e] ml-2">
                {pct(best.returnPct)}
              </span>
            </div>
          </div>
          <div
            className="panel rounded-xl p-3.5 flex items-center gap-3"
            style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)' }}
          >
            <div className="text-xl flex-shrink-0">📉</div>
            <div>
              <div className="text-[9px] font-bold text-[#555] uppercase tracking-wider mb-0.5">Peggior trade</div>
              <span className="text-[14px] font-black font-mono" style={{ color: worst.color }}>
                {worst.ticker}
              </span>
              <span className="text-[14px] font-black text-[#ef4444] ml-2">
                {pct(worst.returnPct)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Per-position table */}
      <div>
        {/* Table header */}
        <div className="flex items-center gap-2 px-1 pb-2 border-b border-[#1e1e1e]">
          <span className="text-[9px] font-bold text-[#444] uppercase w-14">Ticker</span>
          <span className="text-[9px] font-bold text-[#444] uppercase flex-1 hidden sm:block">Nome</span>
          <button
            className="text-[9px] font-bold text-[#444] uppercase w-12 text-right hover:text-[#888] transition-colors"
            onClick={() => toggleSort('weight')}
          >
            Peso <SortIcon active={sortKey === 'weight'} dir={sortDir} />
          </button>
          <button
            className="text-[9px] font-bold text-[#444] uppercase w-16 text-right hover:text-[#888] transition-colors"
            onClick={() => toggleSort('returnPct')}
          >
            Return <SortIcon active={sortKey === 'returnPct'} dir={sortDir} />
          </button>
          <button
            className="text-[9px] font-bold text-[#444] uppercase w-14 text-right hover:text-[#888] transition-colors hidden sm:block"
            onClick={() => toggleSort('alpha')}
          >
            Alpha <SortIcon active={sortKey === 'alpha'} dir={sortDir} />
          </button>
          <span className="text-[9px] font-bold text-[#444] uppercase w-6 text-center">✓</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#161616]">
          {visible.map(s => {
            const isPos = s.returnPct >= 0;
            const retCol = isPos ? '#22c55e' : '#ef4444';
            const alpCol = s.alpha >= 0 ? '#D4AF37' : '#ef4444';
            return (
              <div key={s.ticker} className="flex items-center gap-2 py-2 px-1 hover:bg-white/[0.02] rounded-lg transition-colors">
                <span className="text-[12px] font-bold font-mono w-14 flex-shrink-0" style={{ color: s.color }}>
                  {s.ticker}
                </span>
                <span className="text-[10px] text-[#555] flex-1 truncate hidden sm:block">{s.name}</span>
                <span className="text-[10px] text-[#444] font-mono w-12 text-right flex-shrink-0">
                  {(s.weight * 100).toFixed(1)}%
                </span>
                <span className="text-[12px] font-bold font-mono w-16 text-right flex-shrink-0" style={{ color: retCol }}>
                  {pct(s.returnPct)}
                </span>
                <span className="text-[11px] font-mono w-14 text-right flex-shrink-0 hidden sm:block" style={{ color: alpCol }}>
                  {s.alpha != null ? pct(s.alpha) : '—'}
                </span>
                <span className="w-6 text-center flex-shrink-0 text-[12px]">
                  {isPos ? '✓' : '✗'}
                </span>
              </div>
            );
          })}
        </div>

        {sorted.length > 12 && (
          <button
            onClick={() => setShowAll(a => !a)}
            className="w-full mt-3 pt-3 border-t border-[#1a1a1a] text-[11px] font-medium text-[#555] hover:text-[#888] transition-colors"
          >
            {showAll ? '▲ Mostra meno' : `▼ Mostra tutti ${sorted.length} titoli`}
          </button>
        )}
      </div>

      <p className="text-[10px] text-[#3a3a3a] leading-relaxed">
        Return = prezzo live / prezzo ref. OGE · Alpha = return − SPY stesso periodo.
        Non rappresenta il P&L reale di Trump (prezzi esatti d'acquisto non dichiarati nell'OGE).
      </p>
    </div>
  );
}
