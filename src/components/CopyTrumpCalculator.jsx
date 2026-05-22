import { useState, useMemo, useCallback } from 'react';
import { useStockPrices } from '../hooks/useStockPrices';
import { useBenchmarkReturn } from '../hooks/useBenchmarkReturn';
import { ALLOCATIONS, TOTAL_ESTIMATED_NET } from '../data/unified';

const EUR_USD = 1.10; // approximate, clearly disclosed
const IT_TAX  = 0.26; // imposta sostitutiva sulle plusvalenze

function fmt(n, currency = 'USD') {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const sym = currency === 'EUR' ? '€' : '$';
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${sym}${abs.toLocaleString('it-IT', { maximumFractionDigits: 0 })}`;
  return `${sign}${sym}${abs.toFixed(2)}`;
}

function pct(v, decimals = 1) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

// ─── Comparison bar ────────────────────────────────────────────────────────────
function CompareBar({ label, value, baseline, color, currency }) {
  if (!baseline) return null;
  const ratio   = value / baseline; // > 1 = better than baseline
  const barPct  = Math.min(100, Math.max(2, ((value - baseline) / baseline + 1) * 50));
  const gain    = value - baseline;
  const gainPct = ((value / baseline) - 1) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] font-semibold text-[#666] w-28 flex-shrink-0">{label}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${barPct}%`, background: color, opacity: 0.75 }}
        />
      </div>
      <div className="text-right flex-shrink-0 w-28">
        <div className="text-[13px] font-bold font-mono" style={{ color }}>
          {fmt(value, currency)}
        </div>
        <div className="text-[10px] font-mono" style={{ color, opacity: 0.65 }}>
          {pct(gainPct)}
        </div>
      </div>
    </div>
  );
}

// ─── Per-position row ──────────────────────────────────────────────────────────
function PositionRow({ ticker, weight, refPrice, livePrice, amount, color, currency }) {
  if (!livePrice || refPrice <= 1) return null;
  const allocated    = amount * weight;
  const currentVal   = allocated * (livePrice / refPrice);
  const gainLoss     = currentVal - allocated;
  const gainPct      = (livePrice / refPrice - 1) * 100;
  const isPos        = gainPct >= 0;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-[#1a1a1a] last:border-0">
      <span
        className="text-[11px] font-bold font-mono w-14 flex-shrink-0"
        style={{ color }}
      >
        {ticker}
      </span>
      <span className="text-[10px] text-[#555] w-8 text-right flex-shrink-0">
        {(weight * 100).toFixed(1)}%
      </span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.abs(gainPct) * 3)}%`, background: isPos ? '#22c55e' : '#ef4444', opacity: 0.7 }}
        />
      </div>
      <span
        className="text-[11px] font-bold font-mono w-16 text-right flex-shrink-0"
        style={{ color: isPos ? '#22c55e' : '#ef4444' }}
      >
        {pct(gainPct)}
      </span>
      <span
        className="text-[11px] font-mono w-20 text-right flex-shrink-0"
        style={{ color: isPos ? '#22c55e' : '#ef4444' }}
      >
        {fmt(currency === 'EUR' ? currentVal / EUR_USD : currentVal, currency)}
      </span>
    </div>
  );
}

// ─── Share button ──────────────────────────────────────────────────────────────
function ShareButton({ trumpRet, spyRet, amount, currency }) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const sym    = currency === 'EUR' ? '€' : '$';
    const final  = amount * (1 + trumpRet / 100);
    const spyFin = amount * (1 + spyRet / 100);
    return `Se avessi copiato Trump il 6 Gen 2026 con ${sym}${amount.toLocaleString()}, oggi avresti ${sym}${Math.round(final).toLocaleString()} (${pct(trumpRet)}) vs ${sym}${Math.round(spyFin).toLocaleString()} del solo SPY. 📊 trumpstocktracker.com`;
  }, [trumpRet, spyRet, amount, currency]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  return (
    <div className="flex items-center gap-2">
      <a
        href={twitterHref}
        target="_blank"
        rel="noreferrer"
        className="h-8 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all"
        style={{ background: 'rgba(29,161,242,0.12)', color: '#1da1f2', border: '1px solid rgba(29,161,242,0.25)' }}
      >
        𝕏 Condividi
      </a>
      <button
        onClick={copy}
        className="h-8 px-3 rounded-lg text-[11px] font-semibold transition-all"
        style={{
          background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
          color:      copied ? '#22c55e' : '#666',
          border:     `1px solid ${copied ? 'rgba(34,197,94,0.3)' : '#222'}`,
        }}
      >
        {copied ? '✓ Copiato!' : '⎘ Copia testo'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function CopyTrumpCalculator() {
  const [rawInput,       setRawInput]      = useState('10000');
  const [currency,       setCurrency]      = useState('EUR');
  const [showBreakdown,  setShowBreakdown] = useState(false);
  const [showTax,        setShowTax]       = useState(false);

  const { prices: stockPrices, live: stockPricesLive } = useStockPrices();
  const { data: bench, loading: benchLoading }         = useBenchmarkReturn();

  // Parse input → USD amount for calculations
  const inputAmount = Math.max(0, parseFloat(rawInput.replace(/[^0-9.]/g, '')) || 0);
  const amountUSD   = currency === 'EUR' ? inputAmount * EUR_USD : inputAmount;
  const displayCur  = currency;

  // Portfolio return (weighted, live prices vs ref_price)
  const { portfolioReturnPct, coveredWeight, perPosition } = useMemo(() => {
    if (!stockPricesLive) return { portfolioReturnPct: null, coveredWeight: 0, perPosition: [] };

    let weightedRet = 0;
    let covered     = 0;
    const rows      = [];

    for (const a of ALLOCATIONS) {
      if (a.ref_price <= 1 || a.ticker.includes('_')) continue;
      const live = stockPrices[a.ticker];
      if (!live) continue;
      const posRet = (live / a.ref_price - 1);
      weightedRet += a.weight * posRet;
      covered     += a.weight;
      rows.push({ ...a, livePrice: live });
    }

    const portfolioReturnPct = covered > 0.25 ? (weightedRet / covered) * 100 : null;
    return { portfolioReturnPct, coveredWeight: covered, perPosition: rows };
  }, [stockPrices, stockPricesLive]);

  // Derived values (all in USD, converted for display)
  const portfolioCurrentUSD = portfolioReturnPct != null ? amountUSD * (1 + portfolioReturnPct / 100) : null;
  const spyCurrentUSD       = bench ? amountUSD * (1 + bench.spy.returnPct / 100) : null;
  const qqqCurrentUSD       = bench ? amountUSD * (1 + bench.qqq.returnPct / 100) : null;
  const gainUSD             = portfolioCurrentUSD != null ? portfolioCurrentUSD - amountUSD : null;
  const italianTaxUSD       = gainUSD != null && gainUSD > 0 ? gainUSD * IT_TAX : 0;
  const netGainUSD          = gainUSD != null ? gainUSD - italianTaxUSD : null;

  // Display conversions
  const toDisplay = (v) => v == null ? null : (currency === 'EUR' ? v / EUR_USD : v);

  const portDisplay    = toDisplay(portfolioCurrentUSD);
  const spyDisplay     = toDisplay(spyCurrentUSD);
  const qqqDisplay     = toDisplay(qqqCurrentUSD);
  const gainDisplay    = toDisplay(gainUSD);
  const taxDisplay     = toDisplay(italianTaxUSD);
  const netGainDisplay = toDisplay(netGainUSD);
  const initDisplay    = currency === 'EUR' ? inputAmount : amountUSD;

  const isPositive = gainDisplay != null && gainDisplay >= 0;
  const resultColor = isPositive ? '#22c55e' : '#ef4444';

  const spyRet  = bench?.spy.returnPct  ?? 0;
  const qqqRet  = bench?.qqq.returnPct  ?? 0;
  const beatSpy = portfolioReturnPct != null && portfolioReturnPct > spyRet;

  const hasResult = portfolioReturnPct != null && inputAmount > 0;

  return (
    <div className="card overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-[#1a1a1a]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-bold text-white tracking-tight">
              📊 Se avessi copiato Trump
            </h2>
            <p className="text-[11px] text-[#555] mt-1">
              Calcola quanto avresti guadagnato investendo come Trump dal 6 Gen 2026 · pesi OGE 278-T
            </p>
          </div>
          {!stockPricesLive && (
            <span className="text-[10px] text-[#ef4444]/70 border border-[#ef4444]/20 rounded-lg px-2 py-1 flex-shrink-0">
              offline — prezzi statici
            </span>
          )}
          {stockPricesLive && (
            <div className="flex items-center gap-1.5 bg-green-950/40 text-green-400 border border-green-800/40 px-2.5 py-1 rounded-full flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
              <span className="text-[10px] font-bold">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest block mb-2">
              Se avessi investito
            </label>
            <div className="flex items-center gap-2">
              {/* Currency toggle */}
              <div className="flex rounded-lg overflow-hidden border border-[#222] flex-shrink-0">
                {['EUR', 'USD'].map(c => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className="px-3 py-2 text-[11px] font-bold transition-all"
                    style={{
                      background: currency === c ? '#D4AF37' : 'transparent',
                      color:      currency === c ? '#080808' : '#555',
                    }}
                  >
                    {c === 'EUR' ? '€' : '$'} {c}
                  </button>
                ))}
              </div>

              {/* Amount input */}
              <input
                type="text"
                inputMode="numeric"
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder="10000"
                className="flex-1 bg-[#171717] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-[22px] font-black font-mono text-white placeholder-[#333] focus:outline-none focus:border-[#D4AF37]/50 transition-colors max-w-[220px]"
              />

              <span className="text-[13px] text-[#555]">il 6 Gen 2026</span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-1.5 flex-wrap">
            {[1000, 5000, 10000, 50000].map(v => (
              <button
                key={v}
                onClick={() => setRawInput(String(v))}
                className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all"
                style={{
                  background: inputAmount === v ? 'rgba(212,175,55,0.12)' : 'transparent',
                  borderColor: inputAmount === v ? 'rgba(212,175,55,0.4)' : '#222',
                  color:       inputAmount === v ? '#D4AF37' : '#555',
                }}
              >
                {currency === 'EUR' ? '€' : '$'}{v >= 1000 ? `${v / 1000}K` : v}
              </button>
            ))}
          </div>
        </div>

        {currency === 'EUR' && (
          <p className="text-[10px] text-[#444] mt-2">
            Conversione EUR/USD approssimativa (1 EUR ≈ $1.10) — tutti i dati OGE sono in USD
          </p>
        )}
      </div>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {!hasResult && (
        <div className="px-6 pb-6">
          <div className="panel rounded-xl p-6 text-center">
            {!stockPricesLive ? (
              <p className="text-[12px] text-[#555]">Connessione a Yahoo Finance necessaria per i prezzi live</p>
            ) : inputAmount === 0 ? (
              <p className="text-[12px] text-[#555]">Inserisci un importo per calcolare</p>
            ) : benchLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full spin-anim" />
                <p className="text-[11px] text-[#555]">Caricamento prezzi benchmark…</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {hasResult && (
        <div className="px-6 pb-6 flex flex-col gap-5">
          {/* ── Hero result ──────────────────────────────────────────────── */}
          <div
            className="panel rounded-2xl p-5"
            style={{ borderColor: `${resultColor}25`, background: `${resultColor}06` }}
          >
            <div className="text-[11px] font-bold text-[#555] uppercase tracking-widest mb-3">
              Seguendo le allocazioni Trump oggi avresti
            </div>

            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <div
                  className="text-[42px] sm:text-[52px] font-black font-mono leading-none tracking-tight"
                  style={{ color: resultColor }}
                >
                  {fmt(portDisplay, displayCur)}
                </div>
                <div className="text-[14px] font-bold mt-1" style={{ color: resultColor }}>
                  {pct(portfolioReturnPct)} {isPositive ? '📈' : '📉'}
                </div>
              </div>

              <div className="flex-1 min-w-[180px]">
                {/* vs invested */}
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-[#555]">Investito</span>
                  <span className="font-mono font-semibold text-[#888]">{fmt(initDisplay, displayCur)}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#666]">Guadagno lordo</span>
                  <span
                    className="font-mono font-black"
                    style={{ color: resultColor }}
                  >
                    {gainDisplay >= 0 ? '+' : ''}{fmt(gainDisplay, displayCur)}
                  </span>
                </div>

                {beatSpy && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-green-950/40 text-green-400 border border-green-800/40 px-2.5 py-1 rounded-full text-[10px] font-bold">
                    ↑ +{(portfolioReturnPct - spyRet).toFixed(1)}% vs SPY
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Benchmark comparison ─────────────────────────────────────── */}
          {bench && (
            <div className="panel rounded-xl p-4 flex flex-col gap-3">
              <div className="text-[10px] font-bold text-[#555] uppercase tracking-widest">
                Confronto nello stesso periodo
              </div>
              <CompareBar
                label="Trump portfolio"
                value={portDisplay}
                baseline={initDisplay}
                color={resultColor}
                currency={displayCur}
              />
              <CompareBar
                label="Solo SPY (S&P 500)"
                value={spyDisplay}
                baseline={initDisplay}
                color="#3b82f6"
                currency={displayCur}
              />
              <CompareBar
                label="Solo QQQ (Nasdaq)"
                value={qqqDisplay}
                baseline={initDisplay}
                color="#a78bfa"
                currency={displayCur}
              />
            </div>
          )}

          {/* ── Tax toggle ───────────────────────────────────────────────── */}
          <button
            onClick={() => setShowTax(t => !t)}
            className="flex items-center gap-2 text-[11px] font-semibold text-[#666] hover:text-[#aaa] transition-colors"
          >
            <span className="text-base">{showTax ? '▲' : '▼'}</span>
            🇮🇹 Calcola tasse italiane (26% imposta sostitutiva)
          </button>

          {showTax && gainDisplay != null && (
            <div
              className="panel rounded-xl p-4"
              style={{ borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}
            >
              <div className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">
                Regime fiscale italiano — plusvalenze finanziarie
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Plusvalenza lorda', value: fmt(gainDisplay, displayCur), color: isPositive ? '#22c55e' : '#ef4444' },
                  { label: 'Imposta sostitutiva (26%)', value: gainDisplay > 0 ? `-${fmt(taxDisplay, displayCur)}` : 'nessuna', color: gainDisplay > 0 ? '#ef4444' : '#555' },
                  { label: 'Guadagno netto', value: fmt(netGainDisplay, displayCur), color: '#D4AF37' },
                  { label: 'Valore finale netto', value: fmt(initDisplay + netGainDisplay, displayCur), color: '#D4AF37' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-[#1a1a1a] last:border-0">
                    <span className="text-[11px] text-[#777]">{label}</span>
                    <span className="text-[13px] font-bold font-mono" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-[#444] mt-3 leading-relaxed">
                Stima semplificata · non include detrazioni, compensazione minusvalenze, o regime dichiarativo/amministrato.
                Consulta un commercialista per la tua situazione specifica.
              </p>
            </div>
          )}

          {/* ── Share ────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <ShareButton
              trumpRet={portfolioReturnPct}
              spyRet={spyRet}
              amount={inputAmount}
              currency={displayCur}
            />
            <button
              onClick={() => setShowBreakdown(b => !b)}
              className="text-[11px] font-medium text-[#555] hover:text-[#888] transition-colors"
            >
              {showBreakdown ? '▲ Nascondi' : `▼ Vedi le ${perPosition.length} posizioni`}
            </button>
          </div>

          {/* ── Per-position breakdown ───────────────────────────────────── */}
          {showBreakdown && (
            <div className="panel rounded-xl p-4">
              <div className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">
                Dettaglio per posizione (prezzi live vs ref. OGE)
              </div>
              <div className="flex items-center gap-3 py-1 mb-1">
                <span className="text-[9px] text-[#444] font-bold w-14">TICKER</span>
                <span className="text-[9px] text-[#444] font-bold w-8 text-right">PESO</span>
                <div className="flex-1" />
                <span className="text-[9px] text-[#444] font-bold w-16 text-right">RETURN</span>
                <span className="text-[9px] text-[#444] font-bold w-20 text-right">VALORE</span>
              </div>
              {perPosition
                .sort((a, b) => b.weight - a.weight)
                .map(pos => (
                  <PositionRow
                    key={pos.ticker}
                    ticker={pos.ticker}
                    weight={pos.weight}
                    refPrice={pos.ref_price}
                    livePrice={pos.livePrice}
                    amount={amountUSD}
                    color={pos.color}
                    currency={displayCur}
                  />
                ))}
              <p className="text-[9px] text-[#444] mt-3 leading-relaxed">
                Return = prezzo live Yahoo Finance / prezzo di riferimento OGE (filing date).
                Non rappresenta il prezzo d'acquisto esatto dichiarato — solo un'approssimazione.
              </p>
            </div>
          )}

          {/* ── Disclaimer ───────────────────────────────────────────────── */}
          <p className="text-[10px] text-[#3a3a3a] leading-relaxed">
            ⚠ Stima basata su pesi OGE 278-T e prezzi live Yahoo Finance. Non è consulenza finanziaria.
            Copertura attiva: {(coveredWeight * 100).toFixed(0)}% del portafoglio per peso.
          </p>
        </div>
      )}
    </div>
  );
}
