import { useState } from 'react';
import { TRANSACTIONS } from '../data/transactions';
import { formatCurrency, formatDate, timeAgo } from '../utils/format';

const TYPE_CONFIG = {
  receive: { label: 'RECEIVED', icon: '⬇️', color: '#22c55e' },
  launch: { label: 'LAUNCH', icon: '🚀', color: '#D4AF37' },
  unlock: { label: 'UNLOCKED', icon: '🔓', color: '#8b5cf6' },
  buy: { label: 'BUY', icon: '💰', color: '#3b82f6' },
  sell: { label: 'SELL', icon: '💸', color: '#ef4444' },
};

export default function TransactionFeed() {
  const [showAll, setShowAll] = useState(false);

  const sorted = [...TRANSACTIONS].sort((a, b) => new Date(b.date) - new Date(a.date));
  const displayed = showAll ? sorted : sorted.slice(0, 6);

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider">
          Disclosure Timeline
        </h2>
        <span className="text-xs text-[#555]">
          {TRANSACTIONS.length} events from public records
        </span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[28px] top-0 bottom-0 w-px bg-[#222] hidden md:block" />

        <div className="divide-y divide-[#1a1a1a]">
          {displayed.map((tx) => {
            const cfg = TYPE_CONFIG[tx.type] ?? { label: tx.type.toUpperCase(), icon: '•', color: '#666' };
            return (
              <div key={tx.id} className="flex gap-4 px-4 py-4 hover:bg-[#1c1c1c] transition-colors group">
                {/* Timeline dot */}
                <div className="flex-shrink-0 hidden md:flex flex-col items-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 bg-[#0f0f0f] z-10"
                    style={{ borderColor: cfg.color + '60' }}
                  >
                    {cfg.icon}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                      style={{ color: cfg.color, borderColor: cfg.color + '40', background: cfg.color + '15' }}
                    >
                      {cfg.label}
                    </span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: cfg.color }}
                    >
                      {tx.asset}
                    </span>
                    <span className="text-[11px] text-[#444] ml-auto whitespace-nowrap">
                      {formatDate(tx.date)}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#888] leading-relaxed mb-2">
                    {tx.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    {tx.totalValue != null && tx.totalValue > 0 && (
                      <span className="text-white font-medium">
                        Est. value: {formatCurrency(tx.totalValue)}
                      </span>
                    )}
                    {tx.quantity != null && (
                      <span className="text-[#555]">
                        Qty: {tx.quantity.toLocaleString('en-US')}
                      </span>
                    )}
                    {tx.sourceUrl ? (
                      <a
                        href={tx.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#444] hover:text-[#D4AF37] transition-colors underline underline-offset-2"
                      >
                        {tx.source} ↗
                      </a>
                    ) : (
                      <span className="text-[#444]">{tx.source}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!showAll && TRANSACTIONS.length > 6 && (
        <div className="px-5 py-3 border-t border-[#1f1f1f]">
          <button
            onClick={() => setShowAll(true)}
            className="text-[12px] text-[#D4AF37] hover:text-yellow-300 transition-colors"
          >
            Show all {TRANSACTIONS.length} events ↓
          </button>
        </div>
      )}
    </div>
  );
}
