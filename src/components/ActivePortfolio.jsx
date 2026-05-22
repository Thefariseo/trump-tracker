import { useState } from 'react';
import { ACTIVE_PORTFOLIO_STOCKS, PTR_FILINGS } from '../data/holdings';
import { formatDate } from '../utils/format';

export default function ActivePortfolio() {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? ACTIVE_PORTFOLIO_STOCKS : ACTIVE_PORTFOLIO_STOCKS.slice(0, 7);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider flex items-center gap-2">
            Active Stock Portfolio
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#8b1a1a]/40 text-[#f87171] border border-[#8b1a1a]/50">NEW</span>
          </h2>
          <p className="text-[11px] text-[#555] mt-0.5">Disclosed via OGE Form 278-T — Q1 2026 (May 8, 2026)</p>
        </div>
        <a
          href="https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/405E4EC4E27BE8D185258DF7002DD1C0/$FILE/Trump,%20Donald%20J.-05.08.2026-278T(2).pdf"
          target="_blank" rel="noreferrer"
          className="text-[11px] text-[#D4AF37] hover:text-yellow-300 transition-colors flex-shrink-0"
        >
          View 278-T ↗
        </a>
      </div>

      {/* Q1 2026 summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Total Trades Q1 2026', value: '3,711', sub: '3,642 equities + 69 bonds' },
          { label: 'Equity Purchases', value: '~$247.7M', sub: 'Top buyer: Amazon ($5M–$25M band)' },
          { label: 'Equity Sales', value: '~$159.1M', sub: 'Top seller: MSFT 3× $5M–$25M (Feb 10)' },
        ].map((s) => (
          <div key={s.label} className="bg-[#111] border border-[#1f1f1f] rounded-lg p-2.5">
            <div className="text-[10px] text-[#444] uppercase tracking-wider mb-1">{s.label}</div>
            <div className="text-sm font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-[#555]">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#1a1510] border border-[#3a2a15]/50 rounded-lg px-3 py-2 mb-4 text-[11px] text-[#f5a623]/80">
        ⚡ Trump's team described these assets as a "blind trust" in broad market indices. The 278-T (May 8, 2026) directly contradicts this: 3,642 individual equity picks. Largest single buyer: Amazon (up to $5M–$25M/txn). Largest seller: Microsoft (3× $5M–$25M block on Feb 10, 2026 — same day as Meta and Vanguard Dividend ETF). Palantir and Accenture were net sold despite earlier buys. Timing proximity to Trump policy announcements (tariffs, Iran ceasefire) drew scrutiny from ethics watchdogs.
      </div>

      {/* Stock table */}
      <div className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Top Disclosed Positions — Q1 2026 (from PDF)</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f1f1f]">
              {['Ticker', 'Name', 'Buy txns', 'Max buy band', 'Sell txns', 'Max sell band', 'Note'].map((h) => (
                <th key={h} className="text-left px-2 py-1.5 text-[9px] text-[#333] uppercase tracking-wider whitespace-nowrap font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((s) => {
              const isNetSeller = s.sells > s.buys || s.note?.includes('Net SELLER') || s.buys === 0;
              return (
                <tr key={s.ticker} className={`border-b border-[#141414] hover:bg-[#1a1a1a] transition-colors ${isNetSeller ? 'opacity-80' : ''}`}>
                  <td className="px-2 py-2 font-bold font-mono text-[12px]" style={{ color: isNetSeller ? '#ef4444' : '#C41E3A' }}>{s.ticker}</td>
                  <td className="px-2 py-2 text-[#888] text-[12px] whitespace-nowrap">{s.name}</td>
                  <td className="px-2 py-2 text-center">
                    {s.buys > 0
                      ? <span className="text-[11px] font-medium text-[#22c55e]">{s.buys}</span>
                      : <span className="text-[#333] text-[11px]">—</span>}
                  </td>
                  <td className="px-2 py-2 text-[#666] text-[11px] whitespace-nowrap">{s.buyRange}</td>
                  <td className="px-2 py-2 text-center">
                    {s.sells > 0
                      ? <span className="text-[11px] font-medium text-[#ef4444]">{s.sells}</span>
                      : <span className="text-[#333] text-[11px]">—</span>}
                  </td>
                  <td className="px-2 py-2 text-[#666] text-[11px] whitespace-nowrap">{s.sellRange}</td>
                  <td className="px-2 py-2 text-[#555] text-[10px] max-w-[180px]">{s.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!showAll && (
        <button onClick={() => setShowAll(true)} className="text-[11px] text-[#D4AF37] hover:text-yellow-300 mt-3 transition-colors">
          Show all {ACTIVE_PORTFOLIO_STOCKS.length} positions ↓
        </button>
      )}

      {/* 278-T filing history */}
      <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
        <div className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Form 278-T Filing History</div>
        <div className="space-y-1.5">
          {PTR_FILINGS.slice().reverse().map((f) => (
            <div key={f.date} className="flex items-start gap-3 text-[11px]">
              <span className="text-[#555] flex-shrink-0 font-mono">{formatDate(f.date)}</span>
              <span className="text-[#666] leading-relaxed">
                {f.description}
                {f.url && (
                  <> · <a href={f.url} target="_blank" rel="noreferrer" className="text-[#444] hover:text-[#D4AF37] underline">View ↗</a></>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
