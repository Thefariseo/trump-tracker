import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import { usePrices }      from './hooks/usePrices';
import { useStockPrices } from './hooks/useStockPrices';

import StockGrid           from './components/StockGrid';
import CopyTrumpCalculator from './components/CopyTrumpCalculator';
import SignalScorecard     from './components/SignalScorecard';
import PolicyTimeline      from './components/PolicyTimeline';
import MirrorInvestment    from './components/MirrorInvestment';

const EquityCurve = lazy(() => import('./components/EquityCurve'));
const TickerPage  = lazy(() => import('./pages/TickerPage'));

import { ALLOCATIONS, TOTAL_ESTIMATED_NET, NET_SELLERS } from './data/unified';

// ═══════════════════════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  {
    id:    'portafoglio',
    label: 'Portafoglio',
    short: 'Portfolio',
    icon:  (a) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="4.5" width="13" height="10" rx="1.5"
          stroke={a ? '#D4AF37' : 'currentColor'} strokeWidth="1.5"/>
        <path d="M5 4.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5"
          stroke={a ? '#D4AF37' : 'currentColor'} strokeWidth="1.5"/>
        <line x1="8" y1="7.5" x2="8" y2="11.5"
          stroke={a ? '#D4AF37' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5.5" y1="9.5" x2="10.5" y2="9.5"
          stroke={a ? '#D4AF37' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id:    'performance',
    label: 'Performance',
    short: 'Perf.',
    icon:  (a) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <polyline points="1,13 4.5,8 8,10 12,4 15,1.5"
          stroke={a ? '#D4AF37' : 'currentColor'} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id:    'politica',
    label: 'Politica',
    short: 'Politica',
    icon:  (a) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1.5" width="12" height="13" rx="1.5"
          stroke={a ? '#D4AF37' : 'currentColor'} strokeWidth="1.5"/>
        <line x1="5" y1="5.5" x2="11" y2="5.5"
          stroke={a ? '#D4AF37' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="5" y1="8" x2="11" y2="8"
          stroke={a ? '#D4AF37' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="5" y1="10.5" x2="8.5" y2="10.5"
          stroke={a ? '#D4AF37' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TAB STATE
// ═══════════════════════════════════════════════════════════════════════════════

function useTabState() {
  const [tab, setRaw] = useState(() => {
    try { return localStorage.getItem('tst-tab') ?? 'portafoglio'; }
    catch { return 'portafoglio'; }
  });
  const set = (id) => {
    setRaw(id);
    try { localStorage.setItem('tst-tab', id); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return [tab, set];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function Header({ loading, stockPricesLive }) {
  return (
    <header className="no-print sticky top-0 z-50 bg-[#080808]/98 backdrop-blur-md border-b border-[#1a1a1a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-4">

        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#C41E3A] to-[#7A0E22] flex items-center justify-center shadow-md">
            <span className="text-white text-[11px] font-black select-none">T</span>
          </div>
          <div className="hidden sm:block leading-none">
            <span className="text-[13px] font-bold text-white">Trump Stock Tracker</span>
          </div>
          <span className="text-[13px] font-bold text-white sm:hidden">TST</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {stockPricesLive ? (
            <div className="flex items-center gap-1.5 bg-green-950/60 text-green-400 border border-green-800/50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
              <span className="text-[10px] font-bold tracking-widest">LIVE</span>
            </div>
          ) : (
            <span className="text-[10px] text-[#444]">offline</span>
          )}
          <span className="text-[10px] text-[#444] hidden md:block">OGE 278-T · 8 Mag 2026</span>
        </div>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('tst-refresh'))}
          disabled={loading}
          className="h-7 w-7 rounded-lg border border-[#222] hover:border-[#333] text-[#555] hover:text-[#888] transition-all disabled:opacity-30 flex items-center justify-center"
          title="Aggiorna prezzi"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'spin-anim' : ''}`} viewBox="0 0 12 12" fill="none">
            <path d="M10.5 6a4.5 4.5 0 1 1-1.3-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9.2 1.5l.7 1.8 1.8-.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP TAB NAV
// ═══════════════════════════════════════════════════════════════════════════════

function TabNav({ active, setTab }) {
  return (
    <nav className="no-print sticky top-[52px] z-40 bg-[#080808]/98 backdrop-blur-md border-b border-[#1a1a1a] hidden sm:block">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex">
        {TABS.map(t => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-6 py-3.5 text-[13px] font-medium flex items-center gap-2 transition-all select-none
                ${on ? 'text-[#D4AF37]' : 'text-[#666] hover:text-[#aaa] hover:bg-white/[0.02]'}`}
            >
              {t.icon(on)}
              {t.label}
              {on && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-[#C0961E] via-[#D4AF37] to-[#C0961E] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE BOTTOM NAV
// ═══════════════════════════════════════════════════════════════════════════════

function BottomNav({ active, setTab }) {
  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-[#080808]/98 backdrop-blur-md border-t border-[#1a1a1a]">
      <div className="flex">
        {TABS.map(t => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 transition-all select-none
                ${on ? 'text-[#D4AF37]' : 'text-[#555]'}`}
            >
              {t.icon(on)}
              <span className="text-[9px] font-semibold">{t.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT STRIP — compact summary line
// ═══════════════════════════════════════════════════════════════════════════════

function StatStrip({ livePortfolioValue, liveValueChange }) {
  const top = ALLOCATIONS[0];
  const val = livePortfolioValue ?? TOTAL_ESTIMATED_NET;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 py-3 border-b border-[#1a1a1a] text-[12px]">
      <span className="text-[#555]">
        <span className="font-bold text-[#22c55e]">{ALLOCATIONS.length}</span> posizioni
      </span>
      <span className="text-[#333]">·</span>
      <span className="text-[#555]">
        Net stimato <span className="font-bold font-mono text-[#D4AF37]">~${(val / 1e6).toFixed(1)}M</span>
        {liveValueChange != null && (
          <span className={`ml-1.5 font-bold text-[11px] ${liveValueChange >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {liveValueChange >= 0 ? '+' : ''}{liveValueChange.toFixed(1)}%
          </span>
        )}
      </span>
      {top && (
        <>
          <span className="text-[#333]">·</span>
          <span className="text-[#555]">
            Top: <span className="font-bold font-mono" style={{ color: top.color }}>{top.ticker}</span>
            <span className="text-[#444]"> {(top.weight * 100).toFixed(0)}%</span>
          </span>
        </>
      )}
      <span className="text-[#333]">·</span>
      <span className="text-[#444]">Q1 2026 · OGE 278-T</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY FALLBACK
// ═══════════════════════════════════════════════════════════════════════════════

function Spinner({ label }) {
  return (
    <div className="card p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
      <div className="w-5 h-5 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full spin-anim" />
      {label && <p className="text-[11px] text-[#555]">{label}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB — PORTAFOGLIO
// Calculator + Positions grid. Answers: "What did Trump buy?"
// ═══════════════════════════════════════════════════════════════════════════════

function TabPortafoglio({ livePortfolioValue, liveValueChange }) {
  return (
    <div className="flex flex-col gap-6 fade-up">
      <StatStrip livePortfolioValue={livePortfolioValue} liveValueChange={liveValueChange} />
      <CopyTrumpCalculator />
      <StockGrid />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB — PERFORMANCE
// Signal scorecard + equity curve. Answers: "Has it worked?"
// ═══════════════════════════════════════════════════════════════════════════════

function TabPerformance() {
  return (
    <div className="flex flex-col gap-6 fade-up">
      <SignalScorecard />
      <Suspense fallback={<Spinner label="Caricamento storico prezzi (Yahoo Finance)…" />}>
        <EquityCurve />
      </Suspense>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB — POLITICA
// Policy timeline. Answers: "Why did he buy?"
// ═══════════════════════════════════════════════════════════════════════════════

function TabPolitica() {
  return (
    <div className="fade-up">
      <PolicyTimeline />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

function MainApp() {
  const { loading, refresh }                                         = usePrices();
  const { prices: stockPrices, live: stockPricesLive, refresh: refreshStocks } = useStockPrices();
  const [activeTab, setActiveTab] = useTabState();

  useEffect(() => {
    const h = () => { refresh(); refreshStocks?.(); };
    window.addEventListener('tst-refresh', h);
    return () => window.removeEventListener('tst-refresh', h);
  }, [refresh, refreshStocks]);

  // Live portfolio value (weighted by allocation, priced live)
  const livePortfolioValue = (() => {
    if (!stockPricesLive) return null;
    let total = 0;
    for (const a of ALLOCATIONS) {
      const live = stockPrices[a.ticker];
      const ref  = a.ref_price;
      total += live && ref > 1
        ? a.weight * TOTAL_ESTIMATED_NET * (live / ref)
        : a.weight * TOTAL_ESTIMATED_NET;
    }
    return total;
  })();

  const liveValueChange = livePortfolioValue
    ? ((livePortfolioValue / TOTAL_ESTIMATED_NET) - 1) * 100
    : null;

  return (
    <>
      <Header loading={loading} stockPricesLive={stockPricesLive} />
      <TabNav active={activeTab} setTab={setActiveTab} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-28 sm:pb-12">
        {activeTab === 'portafoglio' && (
          <TabPortafoglio
            livePortfolioValue={livePortfolioValue}
            liveValueChange={liveValueChange}
          />
        )}
        {activeTab === 'performance' && <TabPerformance />}
        {activeTab === 'politica'    && <TabPolitica />}
      </main>

      <BottomNav active={activeTab} setTab={setActiveTab} />

      <footer className="hidden sm:block text-center text-[10px] text-[#303030] pb-5 pt-1">
        Fonte: OGE 278-T · May 8, 2026 · Valori stimati — non è consulenza finanziaria
      </footer>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

function Widget() {
  return (
    <div className="min-h-screen bg-[#080808] p-5">
      <MirrorInvestment selectedSector={null} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <Routes>
        <Route path="/"       element={<MainApp />} />
        <Route path="/widget" element={<Widget />} />
        <Route
          path="/ticker/:symbol"
          element={
            <Suspense fallback={
              <div className="min-h-screen bg-[#080808] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#D4AF37]/25 border-t-[#D4AF37] rounded-full spin-anim" />
              </div>
            }>
              <TickerPage />
            </Suspense>
          }
        />
      </Routes>
    </div>
  );
}
