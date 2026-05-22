import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

import { usePrices }      from './hooks/usePrices';
import { useStockPrices } from './hooks/useStockPrices';

// Always-loaded (small, needed immediately)
import DJTPosition          from './components/DJTPosition';
import StockKPIs            from './components/StockKPIs';
import StockBuySellChart    from './components/StockBuySellChart';
import StockGrid            from './components/StockGrid';
import PolicyCorrelation    from './components/PolicyCorrelation';
import TransactionFeed      from './components/TransactionFeed';
import PortfolioComposition from './components/PortfolioComposition';
import MirrorInvestment     from './components/MirrorInvestment';
import FilingTimeline       from './components/FilingTimeline';
import PortfolioEvolution   from './components/PortfolioEvolution';
import ConvictionRanking    from './components/ConvictionRanking';
import RiskMetrics          from './components/RiskMetrics';
import SectorHeatmap        from './components/SectorHeatmap';

// Lazy-loaded (heavy API calls, only mount when tab is visited)
const EquityCurve = lazy(() => import('./components/EquityCurve'));
const TickerPage  = lazy(() => import('./pages/TickerPage'));

import { ALLOCATIONS, TOTAL_ESTIMATED_NET, NET_SELLERS } from './data/unified';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  {
    id:      'panoramica',
    label:   'Panoramica',
    short:   'Home',
    icon:    (active) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="7" height="7" rx="1.5"
          stroke={active ? '#D4AF37' : '#444'} strokeWidth="1.5" />
        <rect x="10" y="1" width="7" height="7" rx="1.5"
          stroke={active ? '#D4AF37' : '#444'} strokeWidth="1.5" />
        <rect x="1" y="10" width="7" height="7" rx="1.5"
          stroke={active ? '#D4AF37' : '#444'} strokeWidth="1.5" />
        <rect x="10" y="10" width="7" height="7" rx="1.5"
          stroke={active ? '#D4AF37' : '#444'} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id:      'titoli',
    label:   'Titoli',
    short:   'Titoli',
    icon:    (active) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 5h14M2 9h10M2 13h12"
          stroke={active ? '#D4AF37' : '#444'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id:      'performance',
    label:   'Performance',
    short:   'Perf.',
    icon:    (active) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polyline points="1,14 5,9 9,11 13,5 17,2"
          stroke={active ? '#D4AF37' : '#444'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id:      'analisi',
    label:   'Analisi',
    short:   'Analisi',
    icon:    (active) => (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7.5"
          stroke={active ? '#D4AF37' : '#444'} strokeWidth="1.5" />
        <line x1="9" y1="5" x2="9" y2="9.5"
          stroke={active ? '#D4AF37' : '#444'} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="12.5" r="0.8"
          fill={active ? '#D4AF37' : '#444'} />
      </svg>
    ),
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TAB STATE — persisted to localStorage
// ═══════════════════════════════════════════════════════════════════════════════

function useTabState() {
  const [tab, setTabRaw] = useState(() => {
    try { return localStorage.getItem('tst-tab') ?? 'panoramica'; }
    catch { return 'panoramica'; }
  });

  const setTab = (id) => {
    setTabRaw(id);
    try { localStorage.setItem('tst-tab', id); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return [tab, setTab];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function Header({ loading, lastUpdated, stockPricesLive }) {
  return (
    <header className="no-print sticky top-0 z-50 bg-[#0a0a0a]/97 backdrop-blur-md border-b border-[#161616]">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 rounded-md bg-[#C41E3A] flex items-center justify-center text-white text-[10px] font-black tracking-tight select-none">
            T
          </div>
          <span className="text-[13px] font-bold text-white tracking-tight hidden sm:block">
            Trump Stock Tracker
          </span>
          <span className="text-[13px] font-bold text-white tracking-tight sm:hidden">TST</span>
        </Link>

        {/* Center: live indicator + filing badge */}
        <div className="flex items-center gap-3 text-[10px]">
          {stockPricesLive ? (
            <span className="flex items-center gap-1.5 text-[#22c55e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-[#2a2a2a]">prezzi statici</span>
          )}
          <span className="text-[#222] hidden md:block">OGE 278-T · 8 Mag 2026</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {lastUpdated && (
            <span className="text-[10px] text-[#222] hidden lg:block">
              {lastUpdated instanceof Date ? lastUpdated.toLocaleTimeString('it-IT') : lastUpdated}
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="h-7 px-2.5 rounded text-[10px] text-[#333] border border-[#1e1e1e] hover:border-[#2a2a2a] hover:text-[#555] transition-all"
            title="Stampa / esporta PDF"
          >
            ⎙ PDF
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('tst-refresh'))}
            disabled={loading}
            className="h-7 px-2.5 rounded text-[10px] text-[#444] border border-[#1e1e1e] hover:border-[#2a2a2a] hover:text-[#666] transition-all disabled:opacity-30 flex items-center gap-1"
          >
            <span className={loading ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP TAB NAV (sticky, below header)
// ═══════════════════════════════════════════════════════════════════════════════

function TabNav({ activeTab, setTab }) {
  return (
    <nav className="no-print sticky top-12 z-40 bg-[#0a0a0a]/97 backdrop-blur-md border-b border-[#161616] hidden sm:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-0">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`
                  relative px-5 py-3 text-[12px] font-medium transition-colors flex items-center gap-2
                  ${active ? 'text-[#D4AF37]' : 'text-[#444] hover:text-[#666]'}
                `}
              >
                {tab.icon(active)}
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE BOTTOM NAV (fixed)
// ═══════════════════════════════════════════════════════════════════════════════

function BottomNav({ activeTab, setTab }) {
  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-[#0a0a0a]/97 backdrop-blur-md border-t border-[#161616]">
      <div className="flex">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors
                ${active ? 'text-[#D4AF37]' : 'text-[#2a2a2a]'}
              `}
            >
              {tab.icon(active)}
              <span className="text-[9px] font-medium">{tab.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED: section heading within a tab
// ═══════════════════════════════════════════════════════════════════════════════

function SectionHead({ title, sub }) {
  return (
    <div className="mb-3">
      <h2 className="text-[11px] font-bold text-[#2a2a2a] uppercase tracking-widest">{title}</h2>
      {sub && <p className="text-[10px] text-[#222] mt-0.5">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED: hero KPI strip (used on Panoramica tab)
// ═══════════════════════════════════════════════════════════════════════════════

function HeroStrip({ livePortfolioValue, liveValueChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="card px-4 py-3">
        <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">Posizioni attive</div>
        <div className="text-xl font-bold font-mono text-[#22c55e]">{ALLOCATIONS.length}</div>
        <div className="text-[10px] text-[#444] mt-0.5">net buyers in Q1</div>
      </div>

      <div className="card px-4 py-3">
        <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">
          {livePortfolioValue ? 'Valore live stimato' : 'Net stimato OGE'}
        </div>
        <div className="text-xl font-bold font-mono text-[#D4AF37]">
          ~${((livePortfolioValue ?? TOTAL_ESTIMATED_NET) / 1e6).toFixed(1)}M
        </div>
        <div className="text-[10px] mt-0.5">
          {liveValueChange != null ? (
            <span className={liveValueChange >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
              {liveValueChange >= 0 ? '+' : ''}{liveValueChange.toFixed(1)}% vs filing
            </span>
          ) : (
            <span className="text-[#444]">da fasce OGE</span>
          )}
        </div>
      </div>

      <div className="card px-4 py-3">
        <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">Top holding</div>
        <div className="text-xl font-bold font-mono" style={{ color: ALLOCATIONS[0]?.color ?? '#fff' }}>
          {ALLOCATIONS[0]?.ticker ?? '—'}
        </div>
        <div className="text-[10px] text-[#444] mt-0.5">
          {ALLOCATIONS[0] ? `${(ALLOCATIONS[0].weight * 100).toFixed(1)}% del portafoglio` : ''}
        </div>
      </div>

      <div className="card px-4 py-3">
        <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">Liquidate / vendute</div>
        <div className="text-xl font-bold font-mono text-[#ef4444]">{NET_SELLERS.length}</div>
        <div className="text-[10px] text-[#444] mt-0.5">net sellers / closed</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — PANORAMICA
// Overview: KPIs + composizione + mirror + DJT
// ═══════════════════════════════════════════════════════════════════════════════

function TabPanoramica({ prices, changes, djtManual, setDjtManual, livePortfolioValue, liveValueChange }) {
  const [selectedSector, setSelectedSector] = useState(null);

  return (
    <div className="flex flex-col gap-5">
      <HeroStrip livePortfolioValue={livePortfolioValue} liveValueChange={liveValueChange} />

      {/* Composition + Mirror — linked by sector */}
      <div className="grid lg:grid-cols-2 gap-5">
        <PortfolioComposition
          selectedSector={selectedSector}
          onSectorClick={setSelectedSector}
        />
        <MirrorInvestment selectedSector={selectedSector} />
      </div>

      {/* DJT */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] text-[#444] uppercase tracking-wider font-semibold">
            Posizione DJT — Trump Media &amp; Technology (114.75M azioni)
          </div>
          {prices['djt_is_fallback'] && (
            <span className="text-[9px] text-[#f5a623]/70">⚡ prezzo stimato</span>
          )}
        </div>
        <DJTPosition
          prices={prices}
          changes={changes}
          djtManual={djtManual}
          setDjtManual={setDjtManual}
          compact
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — TITOLI
// All positions: summary KPIs + buy/sell chart + full grid
// ═══════════════════════════════════════════════════════════════════════════════

function TabTitoli() {
  return (
    <div className="flex flex-col gap-5">
      <StockKPIs />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <StockBuySellChart />
        </div>
        <div className="card p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="text-[9px] text-[#333] uppercase tracking-wider mb-2">Quick stats</div>
            {[
              { label: 'Titoli analizzati', value: `${ALLOCATIONS.length + NET_SELLERS.length}` },
              { label: 'Net accumulatori', value: `${ALLOCATIONS.length}` },
              { label: 'Net venditori',    value: `${NET_SELLERS.length}`, red: true },
              { label: 'Top sector',       value: 'Technology' },
            ].map(({ label, value, red }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-[#141414] last:border-0">
                <span className="text-[10px] text-[#555]">{label}</span>
                <span className={`text-[11px] font-bold font-mono ${red ? 'text-[#ef4444]' : 'text-[#888]'}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-[#222] leading-relaxed">
            Fonte: OGE 278-T · 8 Mag 2026<br />
            Valori stimati da bande OGE
          </div>
        </div>
      </div>

      <StockGrid />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — PERFORMANCE
// Charts: equity curve vs benchmark + conviction + heatmap
// ═══════════════════════════════════════════════════════════════════════════════

function TabPerformance() {
  return (
    <div className="flex flex-col gap-5">
      {/* Equity curve — lazy loaded, heavy API calls */}
      <Suspense fallback={
        <div className="card p-5 h-52 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
          <div className="text-[10px] text-[#333]">Caricamento prezzi storici (Yahoo Finance)…</div>
        </div>
      }>
        <EquityCurve />
      </Suspense>

      {/* Conviction + Risk side by side */}
      <div className="grid lg:grid-cols-2 gap-5">
        <ConvictionRanking />
        <RiskMetrics />
      </div>

      {/* Sector heatmap */}
      <SectorHeatmap />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — ANALISI
// Deep dive: filing history + timeline + policy + feed
// ═══════════════════════════════════════════════════════════════════════════════

function TabAnalisi() {
  return (
    <div className="flex flex-col gap-5">
      <PortfolioEvolution />
      <FilingTimeline />
      <PolicyCorrelation />
      <TransactionFeed />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP (dashboard)
// ═══════════════════════════════════════════════════════════════════════════════

function MainApp() {
  const { prices, changes, loading, lastUpdated, errors, refresh, djtManual, setDjtManual } = usePrices();
  const { prices: stockPrices, live: stockPricesLive, refresh: refreshStocks } = useStockPrices();
  const [activeTab, setActiveTab] = useTabState();

  // Global refresh event (fired by the header button)
  useEffect(() => {
    const handler = () => { refresh(); refreshStocks?.(); };
    window.addEventListener('tst-refresh', handler);
    return () => window.removeEventListener('tst-refresh', handler);
  }, [refresh, refreshStocks]);

  // Live portfolio value
  const livePortfolioValue = (() => {
    if (!stockPricesLive) return null;
    let total = 0;
    for (const a of ALLOCATIONS) {
      const live = stockPrices[a.ticker];
      const ref  = a.ref_price;
      if (live && ref > 1) total += a.weight * TOTAL_ESTIMATED_NET * (live / ref);
      else                 total += a.weight * TOTAL_ESTIMATED_NET;
    }
    return total;
  })();

  const liveValueChange = livePortfolioValue
    ? ((livePortfolioValue / TOTAL_ESTIMATED_NET) - 1) * 100
    : null;

  return (
    <>
      <Header loading={loading} lastUpdated={lastUpdated} stockPricesLive={stockPricesLive} />
      <TabNav activeTab={activeTab} setTab={setActiveTab} />

      {/* Error banner */}
      {errors.crypto && (
        <div className="max-w-7xl mx-auto px-4 pt-3">
          <div className="bg-[#1a1010] border border-[#2a1a1a] rounded-lg px-4 py-2 text-[11px] text-[#f87171]">
            ⚠️ Feed prezzi non disponibile — dati statici
          </div>
        </div>
      )}

      {/* Tab content — pb-16 on mobile for bottom nav clearance */}
      <main className="max-w-7xl mx-auto px-4 py-5 pb-24 sm:pb-8">
        {activeTab === 'panoramica' && (
          <TabPanoramica
            prices={prices}
            changes={changes}
            djtManual={djtManual}
            setDjtManual={setDjtManual}
            livePortfolioValue={livePortfolioValue}
            liveValueChange={liveValueChange}
          />
        )}
        {activeTab === 'titoli' && <TabTitoli />}
        {activeTab === 'performance' && <TabPerformance />}
        {activeTab === 'analisi' && <TabAnalisi />}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} setTab={setActiveTab} />

      <footer className="hidden sm:block text-center text-[9px] text-[#1a1a1a] pb-4 pt-1">
        Fonte: OGE 278-T · May 8, 2026 · Valori stimati — non è consulenza finanziaria
      </footer>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET (embeddable at /widget)
// ═══════════════════════════════════════════════════════════════════════════════

function Widget() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <MirrorInvestment selectedSector={null} />
      <div className="text-[9px] text-[#1e1e1e] text-center mt-3">
        trumpstocktracker.com — OGE 278-T
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Routes>
        <Route path="/"        element={<MainApp />} />
        <Route path="/widget"  element={<Widget />} />
        <Route
          path="/ticker/:symbol"
          element={
            <Suspense fallback={
              <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
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
