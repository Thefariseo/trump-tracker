import { lazy, Suspense, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ALL_POSITIONS } from '../data/unified';
import { CONVICTION_BY_TICKER } from '../data/convictionScores';
import { POLICY_EVENTS } from '../data/unified';
import CongressOverlay from '../components/CongressOverlay';

// Lazy-load the heavy chart
const PerformanceChart = lazy(() => import('../components/PerformanceChart'));

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtM(v) {
  if (!v) return '—';
  const a = Math.abs(v);
  const s = v < 0 ? '-' : '';
  if (a >= 1e6) return `${s}~$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${s}~$${(a / 1e3).toFixed(0)}K`;
  return `${s}$${a}`;
}

function fmtDate(str) {
  if (!str) return '—';
  // "M/D/YYYY" → "Jan 6, 2026"
  const [m, d, y] = str.split('/');
  return new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T12:00:00Z`)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_META = {
  ACCUMULATING: { label: 'ACCUMULATING ▲', color: '#22c55e' },
  TRIMMING:     { label: 'TRIMMING ◆',     color: '#84cc16' },
  EXITING:      { label: 'NET SELLING ▼',  color: '#ef4444' },
  CLOSED:       { label: 'CLOSED ✕',       color: '#6b7280' },
};

// ── sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#141414] last:border-0 gap-4">
      <span className="text-[11px] text-[#555]">{label}</span>
      <span className={`text-[11px] text-right ${mono ? 'font-mono text-white' : 'text-[#999]'}`}>{value}</span>
    </div>
  );
}

function PolicyCard({ event }) {
  const typeColor = event.type === 'CONFLICT' ? '#ef4444' : event.type === 'ALIGNMENT' ? '#22c55e' : '#888';
  return (
    <div
      className="rounded-lg border p-3"
      style={{ background: `${typeColor}08`, borderColor: `${typeColor}25` }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded border"
          style={{ color: typeColor, borderColor: `${typeColor}40` }}
        >
          {event.type}
        </span>
        <span className="text-[10px] text-[#777]">{event.date}</span>
        <span
          className="text-[8px] px-1.5 py-0.5 rounded ml-auto"
          style={{ background: `${typeColor}18`, color: typeColor }}
        >
          {event.severity}
        </span>
      </div>
      <div className="text-[12px] font-semibold text-white mb-1">{event.title}</div>
      <p className="text-[10px] text-[#666] leading-relaxed">{event.description}</p>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function TickerPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('performance');

  const ticker   = symbol?.toUpperCase();
  const position = ALL_POSITIONS.find(p => p.ticker === ticker);
  const conviction = CONVICTION_BY_TICKER[ticker] ?? null;
  const policyEvents = POLICY_EVENTS.filter(e => e.tickers.includes(ticker));

  if (!position) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <div className="text-[#333] text-4xl">?</div>
        <div className="text-white font-bold">{ticker} non trovato nel portafoglio</div>
        <Link to="/" className="text-[#D4AF37]/70 hover:text-[#D4AF37] text-sm transition-colors">
          ← Torna alla dashboard
        </Link>
      </div>
    );
  }

  const st = STATUS_META[position.netStatus] || STATUS_META.TRIMMING;
  const net = position.estimatedBuyTotal - position.estimatedSellTotal;

  const TABS = [
    { id: 'performance', label: 'Performance' },
    { id: 'details',     label: 'Dettagli' },
    { id: 'congress',    label: 'Congresso' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#161616]">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-[11px] text-[#444] hover:text-[#666] transition-colors flex items-center gap-1.5"
          >
            ← Indietro
          </button>
          <div className="h-4 w-px bg-[#1a1a1a]" />
          <div
            className="text-[13px] font-bold font-mono px-2 py-0.5 rounded"
            style={{ color: position.color, background: `${position.color}18`, border: `1px solid ${position.color}30` }}
          >
            {ticker}
          </div>
          <span className="text-[12px] text-[#777] truncate">{position.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded"
              style={{ color: st.color, background: `${st.color}15`, border: `1px solid ${st.color}30` }}
            >
              {st.label}
            </span>
            <a
              href={position.yahooUrl}
              target="_blank" rel="noreferrer"
              className="text-[10px] text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
            >
              Yahoo ↗
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* ── Hero stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card px-4 py-3">
            <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">Acquisti OGE</div>
            <div className="text-lg font-bold font-mono text-[#22c55e]">{fmtM(position.estimatedBuyTotal)}</div>
            <div className="text-[10px] text-[#444] mt-0.5">{position.buys} transazioni · {position.maxBuyBand ?? '—'}</div>
          </div>
          <div className="card px-4 py-3">
            <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">Vendite OGE</div>
            <div className="text-lg font-bold font-mono text-[#ef4444]">
              {position.estimatedSellTotal > 0 ? fmtM(position.estimatedSellTotal) : '—'}
            </div>
            <div className="text-[10px] text-[#444] mt-0.5">
              {position.sells > 0 ? `${position.sells} transazioni · ${position.maxSellBand}` : 'nessuna vendita'}
            </div>
          </div>
          <div className="card px-4 py-3">
            <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">Net flow</div>
            <div className={`text-lg font-bold font-mono ${net >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {net >= 0 ? '+' : ''}{fmtM(net)}
            </div>
            <div className="text-[10px] text-[#444] mt-0.5">{position.sector}</div>
          </div>
          <div className="card px-4 py-3">
            <div className="text-[9px] text-[#333] uppercase tracking-wider mb-1">Conviction score</div>
            <div
              className="text-lg font-bold font-mono"
              style={{ color: conviction?.labelColor ?? '#888' }}
            >
              {conviction ? `${conviction.score}/100` : '—'}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: conviction?.labelColor ?? '#444' }}>
              {conviction?.label ?? 'N/A'}
            </div>
          </div>
        </div>

        {/* ── Flag / analysis ── */}
        {position.flag && (
          <div className="bg-[#1a1400] border border-[#f5a623]/20 rounded-xl px-4 py-2.5 text-[11px] text-[#f5a623]/80">
            ⚡ {position.flag}
          </div>
        )}

        {position.analysis && (
          <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl px-4 py-3 text-[12px] text-[#777] leading-relaxed">
            {position.analysis}
          </div>
        )}

        {/* ── Tabs ── */}
        <div>
          <div className="flex gap-1 mb-5 border-b border-[#1a1a1a]">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-[11px] font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-[#D4AF37] text-[#D4AF37]'
                    : 'border-transparent text-[#444] hover:text-[#666]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Performance tab */}
          {activeTab === 'performance' && (
            <div className="card p-5">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Price History & Trump Trade Dates
                </h2>
                <p className="text-[11px] text-[#444] mt-0.5">
                  ▲ = acquisti OGE dichiarati · ▼ = vendite OGE · linea tratteggiata = entry medio stimato
                </p>
              </div>
              <Suspense fallback={
                <div className="h-72 flex items-center justify-center text-[11px] text-[#333] animate-pulse">
                  Caricamento grafico…
                </div>
              }>
                <PerformanceChart
                  ticker={ticker}
                  color={position.color}
                  keyBuyDates={position.keyBuyDates ?? []}
                  keySellDates={position.keySellDates ?? []}
                />
              </Suspense>
            </div>
          )}

          {/* Details tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Transaction details */}
              <div className="card p-5">
                <h3 className="text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-3">
                  Dettagli transazioni
                </h3>
                <InfoRow label="Settore"         value={position.sector} />
                <InfoRow label="Subsector"       value={position.subsector} />
                <InfoRow label="Totale acquisti" value={fmtM(position.estimatedBuyTotal)} mono />
                <InfoRow label="Totale vendite"  value={fmtM(position.estimatedSellTotal) || '—'} mono />
                <InfoRow label="Net flow"        value={`${net >= 0 ? '+' : ''}${fmtM(net)}`} mono />
                <InfoRow label="Max buy band"    value={position.maxBuyBand ?? '—'} mono />
                <InfoRow label="Max sell band"   value={position.maxSellBand ?? '—'} mono />
                <InfoRow label="Ref. price"      value={`$${position.refPrice} (${position.refPriceDate})`} mono />
              </div>

              {/* Key dates */}
              {(position.keyBuyDates?.length > 0 || position.keySellDates?.length > 0) && (
                <div className="card p-5">
                  <h3 className="text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-3">
                    Date chiave OGE
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {position.keyBuyDates?.length > 0 && (
                      <div>
                        <div className="text-[9px] text-[#22c55e]/70 uppercase tracking-wider mb-2">
                          ▲ Date acquisto ({position.keyBuyDates.length})
                        </div>
                        <div className="space-y-1">
                          {position.keyBuyDates.map(d => (
                            <div key={d} className="flex items-center gap-2 py-1 border-b border-[#141414]">
                              <span className="w-2 h-2 rounded-full bg-[#22c55e]/60 flex-shrink-0" />
                              <span className="text-[11px] font-mono text-[#888]">{fmtDate(d)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {position.keySellDates?.length > 0 && (
                      <div>
                        <div className="text-[9px] text-[#ef4444]/70 uppercase tracking-wider mb-2">
                          ▼ Date vendita ({position.keySellDates.length})
                        </div>
                        <div className="space-y-1">
                          {position.keySellDates.map(d => (
                            <div key={d} className="flex items-center gap-2 py-1 border-b border-[#141414]">
                              <span className="w-2 h-2 rounded-full bg-[#ef4444]/60 flex-shrink-0" />
                              <span className="text-[11px] font-mono text-[#888]">{fmtDate(d)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Policy events */}
              {policyEvents.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-3">
                    Correlazione con eventi politici
                  </h3>
                  <div className="space-y-3">
                    {policyEvents.map(e => <PolicyCard key={e.id} event={e} />)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Congress tab */}
          {activeTab === 'congress' && (
            <div className="card p-5">
              <h3 className="text-[11px] font-semibold text-[#888] uppercase tracking-wider mb-4">
                Trade parlamentari — Camera dei Rappresentanti 2026
              </h3>
              <CongressOverlay ticker={ticker} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
