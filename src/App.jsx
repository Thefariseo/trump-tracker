import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

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
// TABS CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  {
    id:    'panoramica',
    label: 'Panoramica',
    short: 'Home',
    icon:  (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5"
          stroke={active ? '#D4AF37' : 'currentColor'} strokeWidth="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5"
          stroke={active ? '#D4AF37' : 'currentColor'} strokeWidth="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5"
          stroke={active ? '#D4AF37' : 'currentColor'} strokeWidth="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5"
          stroke={active ? '#D4AF37' : 'currentColor'} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id:    'titoli',
    label: 'Titoli',
    short: 'Titoli',
    icon:  (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1.5 4.5h13M1.5 8h9M1.5 11.5h11"
          stroke={active ? '#D4AF37' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id:    'performance',
    label: 'Performance',
    short: 'Perf.',
    icon:  (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <polyline points="1,13 4.5,8 8,10 12,4 15,1.5"
          stroke={active ? '#D4AF37' : 'currentColor'} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  {
    id:    'analisi',
    label: 'Analisi',
    short: 'Analisi',
    icon:  (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5"
          stroke={active ? '#D4AF37' : 'currentColor'} strokeWidth="1.5" />
        <line x1="8" y1="4.5" x2="8" y2="8.5"
          stroke={active ? '#D4AF37' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.85"
          fill={active ? '#D4AF37' : 'currentColor'} />
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
    <header className="no-print sticky top-0 z-50 bg-[#080808]/98 backdrop-blur-md border-b border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C41E3A] to-[#7A0E22] flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white text-[12px] font-black select-none">T</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[13px] font-bold text-white tracking-tight">Trump Stock</span>
            <span className="text-[10px] text-[#555] tracking-wider font-medium">TRACKER</span>
          </div>
          <span className="text-[13px] font-bold text-white sm:hidden">TST</span>
        </Link>

        {/* Center: live + filing */}
        <div className="flex items-center gap-2.5">
          {stockPricesLive ? (
            <div className="flex items-center gap-1.5 bg-green-950/60 text-green-400 border border-green-800/50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot flex-shrink-0" />
              <span className="text-[10px] font-bold tracking-widest">LIVE</span>
            </div>
          ) : (
            <span className="text-[10px] text-[#444] italic">prezzi statici</span>
          )}
          <span className="text-[10px] text-[#444] hidden md:flex items-center gap-1.5 bg-[#111] px-2.5 py-1 rounded-md border border-[#1e1e1e]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C41E3A] inline-block opacity-60" />
            OGE 278-T · 8 Mag 2026
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {lastUpdated && (
            <span className="text-[10px] text-[#444] hidden lg:block font-mono">
              {lastUpdated instanceof Date
                ? lastUpdated.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                : lastUpdated}
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="h-7 px-3 rounded-lg text-[11px] font-medium text-[#666] border border-[#222] hover:border-[#333] hover:text-[#aaa] transition-all"
            title="Stampa / esporta PDF"
          >
            ↧ PDF
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('tst-refresh'))}
            disabled={loading}
            className="h-7 px-3 rounded-lg text-[11px] font-medium text-[#666] border border-[#222] hover:border-[#333] hover:text-[#aaa] transition-all disabled:opacity-30 flex items-center gap-1.5"
          >
            <svg
              className={`w-3 h-3 flex-shrink-0 ${loading ? 'spin-anim' : ''}`}
              viewBox="0 0 12 12" fill="none"
            >
              <path d="M10.5 6a4.5 4.5 0 1 1-1.3-3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9.2 1.5l.7 1.8 1.8-.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="hidden sm:inline">Aggiorna</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP TAB NAV
// ═══════════════════════════════════════════════════════════════════════════════

function TabNav({ activeTab, setTab }) {
  return (
    <nav className="no-print sticky top-14 z-40 bg-[#080808]/98 backdrop-blur-md border-b border-[#1a1a1a] hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`
                  relative px-5 py-3.5 text-[13px] font-medium transition-all flex items-center gap-2 select-none
                  ${active
                    ? 'text-[#D4AF37]'
                    : 'text-[#666] hover:text-[#aaa] hover:bg-white/[0.02]'
                  }
                `}
              >
                {tab.icon(active)}
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-[#C0961E] via-[#D4AF37] to-[#C0961E] rounded-t-full" />
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
// MOBILE BOTTOM NAV
// ═══════════════════════════════════════════════════════════════════════════════

function BottomNav({ activeTab, setTab }) {
  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-[#080808]/98 backdrop-blur-md border-t border-[#1a1a1a]">
      <div className="flex">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center gap-1.5 py-3 transition-all select-none
                ${active ? 'text-[#D4AF37]' : 'text-[#555]'}
              `}
            >
              {tab.icon(active)}
              <span className="text-[9px] font-semibold tracking-wide">{tab.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION HEADING
// ═══════════════════════════════════════════════════════════════════════════════

export function SectionHead({ title, sub, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="section-label">{title}</div>
      {sub && <p className="text-[11px] text-[#555] mt-1.5 leading-relaxed">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI CARD (hero strip)
// ═══════════════════════════════════════════════════════════════════════════════

function KPICard({ label, value, sub, color, subColor }) {
  return (
    <div className="card px-5 py-4 flex flex-col gap-2">
      <div className="text-[10px] font-semibold text-[#555] uppercase tracking-widest leading-none">
        {label}
      </div>
      <div
        className="text-[28px] sm:text-[32px] font-black font-mono leading-none tracking-tight"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[11px] font-medium" style={{ color: subColor ?? '#666' }}>
        {sub}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO STRIP — KPI overview
// ═══════════════════════════════════════════════════════════════════════════════

function HeroStrip({ livePortfolioValue, liveValueChange }) {
  const topTicker = ALLOCATIONS[0];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KPICard
        label="Posizioni attive"
        value={ALLOCATIONS.length}
        sub="net buyers in Q1 2026"
        color="#22c55e"
      />

      <KPICard
        label={livePortfolioValue ? 'Valore live stimato' : 'Netto stimato OGE'}
        value={`~$${((livePortfolioValue ?? TOTAL_ESTIMATED_NET) / 1e6).toFixed(1)}M`}
        sub={
          liveValueChange != null
            ? `${liveValueChange >= 0 ? '+' : ''}${liveValueChange.toFixed(1)}% vs filing`
            : 'fasce midpoint OGE'
        }
        color="#D4AF37"
        subColor={
          liveValueChange != null
            ? (liveValueChange >= 0 ? '#22c55e' : '#ef4444')
            : '#555'
        }
      />

      <KPICard
        label="Top holding"
        value={topTicker?.ticker ?? '—'}
        sub={topTicker ? `${(topTicker.weight * 100).toFixed(1)}% del portafoglio` : ''}
        color={topTicker?.color ?? '#fff'}
      />

      <KPICard
        label="Liquidate / Vendute"
        value={NET_SELLERS.length}
        sub="net sellers o chiuse"
        color="#ef4444"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING FALLBACK for lazy components
// ═══════════════════════════════════════════════════════════════════════════════

function ChartFallback({ label = 'Caricamento…' }) {
  return (
    <div className="card p-6 flex flex-col items-center justify-center gap-3 min-h-[180px]">
      <div className="w-5 h-5 border-2 border-[#D4AF37]/25 border-t-[#D4AF37] rounded-full spin-anim" />
      <div className="text-[11px] text-[#555]">{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — PANORAMICA
// ═══════════════════════════════════════════════════════════════════════════════

function TabPanoramica({ prices, changes, djtManual, setDjtManual, livePortfolioValue, liveValueChange }) {
  const [selectedSector, setSelectedSector] = useState(null);

  return (
    <div className="flex flex-col gap-6 fade-up">
      {/* Hero KPIs */}
      <HeroStrip livePortfolioValue={livePortfolioValue} liveValueChange={liveValueChange} />

      {/* Composition + Mirror — linked by sector selection */}
      <div>
        <SectionHead
          title="Composizione portafoglio"
          sub="Allocazioni per settore e strumento mirror per replicare le scelte di Trump"
        />
        <div className="grid lg:grid-cols-2 gap-5">
          <PortfolioComposition
            selectedSector={selectedSector}
            onSectorClick={setSelectedSector}
          />
          <MirrorInvestment selectedSector={selectedSector} />
        </div>
      </div>

      {/* DJT position */}
      <div>
        <SectionHead
          title="Posizione DJT — Trump Media & Technology"
          sub="114.75 milioni di azioni · asset non-financial dichiarato separatamente"
        />
        <div className="card p-5">
          <DJTPosition
            prices={prices}
            changes={changes}
            djtManual={djtManual}
            setDjtManual={setDjtManual}
            compact
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — TITOLI
// ═══════════════════════════════════════════════════════════════════════════════

function TabTitoli() {
  return (
    <div className="flex flex-col gap-6 fade-up">
      {/* KPI stats */}
      <StockKPIs />

      {/* Chart + quick stats */}
      <div>
        <SectionHead
          title="Flussi buy / sell per titolo"
          sub="Volume stimato delle transazioni da fasce OGE (midpoint)"
        />
        <div className="grid lg:grid-cols-[1fr_260px] gap-5">
          <StockBuySellChart />

          {/* Quick stats sidebar */}
          <div className="card p-5 flex flex-col gap-4">
            <div className="section-label">Quick stats</div>
            <div className="space-y-0">
              {[
                { label: 'Titoli analizzati',   value: `${ALLOCATIONS.length + NET_SELLERS.length}` },
                { label: 'Net accumulatori',    value: `${ALLOCATIONS.length}`,   color: '#22c55e' },
                { label: 'Net venditori',       value: `${NET_SELLERS.length}`,   color: '#ef4444' },
                { label: 'Top sector',          value: 'Technology',              color: '#D4AF37' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-3 border-b border-[#1a1a1a] last:border-0"
                >
                  <span className="text-[12px] text-[#777]">{label}</span>
                  <span
                    className="text-[14px] font-bold font-mono"
                    style={{ color: color ?? '#aaa' }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[#1a1a1a] text-[10px] text-[#444] leading-relaxed">
              Fonte: OGE 278-T · 8 Mag 2026<br />
              Valori da fasce OGE (midpoint)
            </div>
          </div>
        </div>
      </div>

      {/* Full stock grid */}
      <div>
        <SectionHead
          title="Posizioni per titolo"
          sub="Clicca su una card per espandere analisi, date chiave e grafico prezzi storico"
        />
        <StockGrid />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════

function TabPerformance() {
  return (
    <div className="flex flex-col gap-6 fade-up">
      {/* Equity curve */}
      <div>
        <SectionHead
          title="Equity curve vs benchmark"
          sub="Performance stimata del portafoglio Trump pesato per allocazione OGE · base 100 = 6 Gen 2026"
        />
        <Suspense fallback={
          <ChartFallback label="Fetching price history for top 12 positions + SPY + QQQ…" />
        }>
          <EquityCurve />
        </Suspense>
      </div>

      {/* Conviction + Risk */}
      <div>
        <SectionHead
          title="Conviction & rischio"
          sub="Score di convinzione per titolo e indice di concentrazione del portafoglio (HHI)"
        />
        <div className="grid lg:grid-cols-2 gap-5">
          <ConvictionRanking />
          <RiskMetrics />
        </div>
      </div>

      {/* Sector heatmap */}
      <div>
        <SectionHead
          title="Heatmap settoriale"
          sub="Intensità degli acquisti settimana per settimana nei vari settori"
        />
        <SectorHeatmap />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — ANALISI
// ═══════════════════════════════════════════════════════════════════════════════

function TabAnalisi() {
  return (
    <div className="flex flex-col gap-6 fade-up">
      <div>
        <SectionHead
          title="Evoluzione del portafoglio"
          sub="Crescita cumulata del valore stimato nel tempo"
        />
        <PortfolioEvolution />
      </div>
      <div>
        <SectionHead
          title="Timeline filing"
          sub="Cronologia delle transazioni dichiarate"
        />
        <FilingTimeline />
      </div>
      <div>
        <SectionHead
          title="Correlazione politica"
          sub="Acquisti in relazione agli annunci e alle politiche dell'amministrazione"
        />
        <PolicyCorrelation />
      </div>
      <div>
        <SectionHead
          title="Feed transazioni"
          sub="Tutte le transazioni dichiarate in ordine cronologico"
        />
        <TransactionFeed />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
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
      {errors?.crypto && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-950/40 border border-red-900/40 rounded-xl px-4 py-2.5 text-[12px] text-red-400 flex items-center gap-2">
            <span className="text-base">⚠</span>
            Feed prezzi non disponibile — visualizzazione con dati statici
          </div>
        </div>
      )}

      {/* Tab content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-10">
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
        {activeTab === 'titoli'      && <TabTitoli />}
        {activeTab === 'performance' && <TabPerformance />}
        {activeTab === 'analisi'     && <TabAnalisi />}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} setTab={setActiveTab} />

      <footer className="hidden sm:block text-center text-[10px] text-[#383838] pb-5 pt-1">
        Fonte: OGE 278-T · May 8, 2026 · Valori stimati da fasce midpoint — non è consulenza finanziaria
      </footer>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET (embeddable at /widget)
// ═══════════════════════════════════════════════════════════════════════════════

function Widget() {
  return (
    <div className="min-h-screen bg-[#080808] p-5">
      <MirrorInvestment selectedSector={null} />
      <div className="text-[10px] text-[#333] text-center mt-4">
        trumpstocktracker.com — OGE 278-T · May 2026
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
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
                <div className="w-7 h-7 border-2 border-[#D4AF37]/25 border-t-[#D4AF37] rounded-full spin-anim" />
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
