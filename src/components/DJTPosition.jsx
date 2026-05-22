import { useState } from 'react';
import { DJT_FILING } from '../data/holdings';
import { formatCurrency, formatDate, formatPercent } from '../utils/format';

const SHARES = DJT_FILING.shares;

function MetricBox({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? 'bg-[#C41E3A]/10 border border-[#C41E3A]/25' : 'bg-[#111] border border-[#1f1f1f]'}`}>
      <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-sm font-bold leading-snug ${highlight ? 'text-[#C41E3A]' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-[10px] text-[#444] mt-0.5">{sub}</div>}
    </div>
  );
}

function Row({ label, value, sub, url }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[#1a1a1a] last:border-0">
      <span className="text-[10px] text-[#444] uppercase tracking-wider flex-shrink-0 mt-0.5">{label}</span>
      <div className="text-right">
        {url
          ? <a href={url} target="_blank" rel="noreferrer" className="text-[12px] text-[#D4AF37]/80 hover:text-[#D4AF37] underline underline-offset-2">{value} ↗</a>
          : <span className="text-[12px] text-[#bbb]">{value}</span>
        }
        {sub && <div className="text-[10px] text-[#444] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function PriceBar({ label, price, pct, color }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-[#444] w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-[#222] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[#888] w-12 text-right flex-shrink-0">${price.toFixed(2)}</span>
    </div>
  );
}

export default function DJTPosition({ prices, changes, djtManual, setDjtManual, compact = false }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const price = prices['djt'] ?? DJT_FILING.currentPrice;
  const isManual = prices['djt_is_manual'];
  const isFallback = prices['djt_is_fallback'];
  const totalValue = price * SHARES;
  const change24h = changes['djt'];

  // Price bar context
  const low = DJT_FILING.price52wkLow;
  const high = DJT_FILING.price52wkHigh;
  const range = high - low;
  const currentPct = range > 0 ? ((price - low) / range) * 100 : 50;
  const transferPct = range > 0 ? ((DJT_FILING.priceAtTransfer - low) / range) * 100 : 50;

  function handleSave() {
    const parsed = parseFloat(inputVal);
    if (!isNaN(parsed) && parsed > 0) setDjtManual(parsed);
    setEditing(false);
  }

  // ── COMPACT MODE (sidebar) ─────────────────────────────────────────
  if (compact) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#C41E3A] font-mono">DJT</span>
              <span className="text-[9px] text-[#333]">NASDAQ</span>
            </div>
            <div className="text-[10px] text-[#444] mt-0.5">114,750,000 shares · 41.4%</div>
          </div>
          <div className="text-right">
            {editing ? (
              <div className="flex items-center gap-1">
                <span className="text-[#555] text-xs">$</span>
                <input
                  type="number" step="0.01" min="0.01" value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                  autoFocus
                  className="w-16 bg-[#111] border border-[#D4AF37]/50 rounded px-1.5 py-0.5 text-white text-xs font-mono focus:outline-none"
                />
                <button onClick={handleSave} className="text-[10px] text-[#22c55e]">✓</button>
                <button onClick={() => { setDjtManual(null); setEditing(false); }} className="text-[10px] text-[#555]">↩</button>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-lg font-bold text-white">${price.toFixed(2)}</span>
                  {change24h != null && (
                    <span className={`text-[11px] ${change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change24h >= 0 ? '+' : ''}{change24h.toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  <button onClick={() => { setInputVal(price.toFixed(2)); setEditing(true); }}
                    className="text-[9px] text-[#333] hover:text-[#D4AF37] underline underline-offset-1">edit</button>
                  <a href="https://finance.yahoo.com/quote/DJT/" target="_blank" rel="noreferrer"
                    className="text-[9px] text-[#333] hover:text-[#D4AF37]">Yahoo ↗</a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 text-[10px]">
          <div className="flex justify-between">
            <span className="text-[#444]">Valore stimato posizione</span>
            <span className="text-white font-semibold">${(totalValue / 1e6).toFixed(0)}M</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#444]">Costo acquisizione</span>
            <span className="text-[#22c55e]">$0 (non-cash DWAC)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#444]">Trustee</span>
            <span className="text-[#888]">Donald Trump Jr.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#444]">Vendite</span>
            <span className="text-[#22c55e]">Nessuna (Form 4)</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1a1a1a]">
          <div className="text-[9px] text-[#333] mb-1.5">Range 52 settimane</div>
          <div className="relative h-1 bg-[#1a1a1a] rounded-full">
            <div className="absolute h-2 w-0.5 bg-[#D4AF37] top-[-2px]" style={{ left: `${transferPct}%` }} />
            <div className="absolute h-2 w-1 bg-[#C41E3A] rounded-full top-[-2px]" style={{ left: `${Math.max(1, currentPct)}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-[#333] mt-1">
            <span>${low}</span>
            <span className="text-[#D4AF37]">transfer ${DJT_FILING.priceAtTransfer}</span>
            <span>${high}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C41E3A]/20 border border-[#C41E3A]/40 flex items-center justify-center text-xl flex-shrink-0">
            📺
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-white">Trump Media & Technology Group</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#C41E3A]/40 text-[#C41E3A] bg-[#C41E3A]/10">DJT</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-800/40 text-green-400 bg-green-900/10">NASDAQ</span>
            </div>
            <div className="text-[11px] text-[#555] mt-0.5">
              {SHARES.toLocaleString('en-US')} shares · {DJT_FILING.ownershipPct}% of outstanding
              <span className="text-[#333] ml-1">(diluted from {DJT_FILING.ownershipPctAtMerger}% at merger)</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[#555] text-sm">$</span>
              <input
                type="number" step="0.01" min="0.01" value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                autoFocus
                className="w-20 bg-[#111] border border-[#D4AF37]/50 rounded px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-[#D4AF37]"
              />
              <button onClick={handleSave} className="text-[11px] text-[#22c55e]">✓</button>
              <button onClick={() => { setDjtManual(null); setEditing(false); }} className="text-[11px] text-[#555]">↩</button>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-2xl font-bold text-white">${price.toFixed(2)}</span>
                {change24h != null && (
                  <span className={`text-sm font-medium ${change24h >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercent(change24h)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 justify-end mt-0.5">
                {isFallback && <span className="text-[10px] text-[#D4AF37]/70">live May 19 2026</span>}
                {isManual && <span className="text-[10px] text-[#22c55e]/80">manual</span>}
                <button onClick={() => { setInputVal(price.toFixed(2)); setEditing(true); }}
                  className="text-[10px] text-[#444] hover:text-[#D4AF37] transition-colors underline underline-offset-2">
                  edit
                </button>
                <a href="https://finance.yahoo.com/quote/DJT/" target="_blank" rel="noreferrer"
                  className="text-[10px] text-[#444] hover:text-[#D4AF37]">Yahoo ↗</a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <MetricBox label="Est. Position Value" value={formatCurrency(totalValue)} sub={`at $${price.toFixed(2)}/share`} highlight />
        <MetricBox label="Shares Held" value="114,750,000" sub="via Revocable Trust" />
        <MetricBox label="Ownership Stake" value={`${DJT_FILING.ownershipPct}%`} sub={`${DJT_FILING.totalOutstanding.toLocaleString('en-US')} shares out.`} />
        <MetricBox label="Cost Basis" value="$0" sub="Non-cash acquisition" />
      </div>

      {/* 52-week price bar */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-3 mb-4 space-y-2">
        <div className="text-[10px] text-[#444] uppercase tracking-wider mb-2">52-Week Price Context</div>
        <PriceBar label="52-wk low" price={low} pct={0} color="#ef4444" />
        <PriceBar label="At transfer" price={DJT_FILING.priceAtTransfer} pct={transferPct} color="#D4AF37" />
        <PriceBar label="Current" price={price} pct={Math.max(2, currentPct)} color="#C41E3A" />
        <PriceBar label="52-wk high" price={high} pct={100} color="#22c55e" />
        <div className="text-[10px] text-[#333] mt-1">
          Down {(((price - high) / high) * 100).toFixed(1)}% from 52-week high · Down {(((price - DJT_FILING.priceAtTransfer) / DJT_FILING.priceAtTransfer) * 100).toFixed(1)}% from trust transfer price
        </div>
      </div>

      {/* Filing details */}
      <div>
        <div className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Filing Details</div>

        {/* Trust transfer — highlight */}
        <div className="bg-[#1a1010] border border-[#3a1a1a] rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#C41E3A]/20 text-[#C41E3A] border border-[#C41E3A]/30">MOST RECENT EVENT</span>
            <span className="text-[11px] text-[#888]">SEC Form 4 — Dec 20, 2024</span>
          </div>
          <p className="text-[12px] text-[#bbb] leading-relaxed">
            Trump transferred all 114,750,000 DJT shares to the <strong className="text-white">Donald J. Trump Revocable Trust</strong>.
            Trustee: <strong className="text-white">Donald Trump Jr.</strong> (sole voting & investment power).
            DJT was trading at <strong className="text-white">~$35.41</strong>/share at time of transfer (~$4.06B value).
          </p>
        </div>

        <div className="space-y-0">
          <Row label="Original acquisition" value="SEC Schedule 13D — Mar 26, 2024" url={DJT_FILING.filingUrl} />
          <Row label="Acquisition method" value="DWAC Business Combination (non-cash)" />
          <Row label="Lock-up expired" value={formatDate(DJT_FILING.lockupExpiry)} />
          <Row label="Escrow release" value="553,176 shares released to brokerage" sub="March 2025 — total unchanged" />
          <Row label="Sell transactions" value="None (Form 4 / Form 144)" sub="As of May 2026" />
          <Row label="Share dilution" value={`57.26% → ${DJT_FILING.ownershipPct}%`} sub={`TMTG issued new shares; ${(DJT_FILING.totalOutstanding / 1e6).toFixed(2)}M outstanding`} />
          <Row label="TMTG 2025 net loss" value="$712 million" sub="Minimal revenue; 10-Q 2026" />
        </div>
      </div>
    </div>
  );
}
