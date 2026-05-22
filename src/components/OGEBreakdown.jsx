import { useState } from 'react';
import { HOLDINGS, OGE_FILING } from '../data/holdings';
import { formatCurrency, formatDate } from '../utils/format';

export default function OGEBreakdown() {
  const [open, setOpen] = useState(null);
  const trumpOrg = HOLDINGS.find((h) => h.id === 'trump-org');
  const cash = HOLDINGS.find((h) => h.id === 'cash-mm');

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider">OGE Form 278 Breakdown</h2>
          <p className="text-[11px] text-[#444] mt-0.5">
            Filed {formatDate(OGE_FILING.filedDate)} · Covers CY{OGE_FILING.year} · Values in disclosure bands
          </p>
        </div>
        <a
          href={OGE_FILING.filingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-[#D4AF37] hover:text-yellow-300 transition-colors"
        >
          View OGE filing ↗
        </a>
      </div>

      <div className="text-[11px] text-[#555] bg-[#111] border border-[#222] rounded-lg px-3 py-2 mb-4">
        ℹ️ OGE regulations (5 U.S.C. app. § 102) require disclosure only in value bands. Assets above $50M are reported as ">$50M" — the exact figure is not disclosed. Estimates below use band midpoints and external sources (Forbes, Bloomberg, SEC filings).
      </div>

      {/* Private business assets */}
      <div className="mb-4">
        <button
          onClick={() => setOpen(open === 'org' ? null : 'org')}
          className="w-full flex items-center justify-between py-2.5 border-b border-[#222] hover:text-white transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <span>🏌️</span>
            <span className="text-sm font-medium text-[#ccc]">Trump Organization assets</span>
            <span className="text-[10px] text-[#555] px-1.5 py-0.5 bg-[#111] border border-[#222] rounded">PRIVATE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">{formatCurrency(trumpOrg.staticPrice)}</span>
            <span className="text-[#444] text-sm">{open === 'org' ? '▲' : '▼'}</span>
          </div>
        </button>

        {open === 'org' && (
          <div className="mt-1 divide-y divide-[#1a1a1a]">
            {trumpOrg.ogeAssets.map((a) => (
              <div key={a.name} className="flex items-center justify-between py-2 px-2">
                <div>
                  <div className="text-[12px] text-[#888]">{a.name}</div>
                  <div className="text-[10px] text-[#444]">OGE band: {a.ogeValue}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-[12px] text-[#ccc] font-medium">{formatCurrency(a.estimate)}</div>
                  <div className="text-[10px] text-[#444]">est.</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cash accounts */}
      <div className="mb-2">
        <button
          onClick={() => setOpen(open === 'cash' ? null : 'cash')}
          className="w-full flex items-center justify-between py-2.5 border-b border-[#222] hover:text-white transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <span>💵</span>
            <span className="text-sm font-medium text-[#ccc]">Cash & Money Market accounts</span>
            <span className="text-[10px] text-[#555] px-1.5 py-0.5 bg-[#111] border border-[#222] rounded">LIQUID</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">{formatCurrency(cash.staticPrice)}</span>
            <span className="text-[#444] text-sm">{open === 'cash' ? '▲' : '▼'}</span>
          </div>
        </button>

        {open === 'cash' && (
          <div className="mt-1 divide-y divide-[#1a1a1a]">
            {cash.ogeAccounts.map((a) => (
              <div key={a.institution} className="flex items-center justify-between py-2 px-2">
                <div>
                  <div className="text-[12px] text-[#888]">{a.institution}</div>
                  <div className="text-[10px] text-[#444]">OGE band: {a.ogeValue}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-[12px] text-[#ccc] font-medium">{formatCurrency(a.estimate)}</div>
                  <div className="text-[10px] text-[#444]">est.</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 text-[10px] text-[#333] leading-relaxed">
        {OGE_FILING.note}
      </div>
    </div>
  );
}
