import { useState, Fragment } from 'react';
import { HOLDINGS } from '../data/holdings';
import { formatCurrency, formatNumber, formatPrice, formatPercent } from '../utils/format';

function LiquidityBadge({ liquid }) {
  return liquid ? (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800/50">
      LIQUID
    </span>
  ) : (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#222] text-[#555] border border-[#333]">
      LOCKED
    </span>
  );
}

function TypeBadge({ type }) {
  const map = {
    stock: { label: 'STOCK', color: 'text-[#C41E3A] bg-red-950/40 border-red-900/50' },
    crypto: { label: 'CRYPTO', color: 'text-[#D4AF37] bg-yellow-950/40 border-yellow-900/50' },
    private: { label: 'PRIVATE', color: 'text-[#8B7355] bg-amber-950/30 border-amber-900/40' },
    cash: { label: 'CASH', color: 'text-green-400 bg-green-950/30 border-green-900/40' },
  };
  const t = map[type] ?? { label: type.toUpperCase(), color: 'text-[#666]' };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${t.color}`}>
      {t.label}
    </span>
  );
}

function SourceLink({ url, label }) {
  if (!url) return <span className="text-[#555] text-[11px]">{label}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-[11px] text-[#444] hover:text-[#D4AF37] transition-colors underline underline-offset-2"
    >
      {label} ↗
    </a>
  );
}

export default function HoldingsTable({ prices, changes, loading }) {
  const [expanded, setExpanded] = useState(null);

  const rows = HOLDINGS.map((h) => {
    const price = prices[h.id] ?? 0;
    const qty = h.quantity ?? 1;
    const totalValue = price * qty;
    const liquidQty = h.liquid ? (h.liquidQuantity ?? qty) : 0;
    const liquidValue = price * liquidQty;
    const change = changes[h.id] ?? null;
    return { ...h, price, qty, totalValue, liquidValue, change };
  });

  const grandTotal = rows.reduce((a, r) => a + r.totalValue, 0);

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider">Holdings</h2>
        <span className="text-xs text-[#555]">{rows.length} positions — click row for details</span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f1f1f]">
              {['Asset', 'Type', 'Total Qty', 'Liquid Qty', 'Price', 'Total Value', 'Liquid Value', 'Alloc %', '24h'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] text-[#444] uppercase tracking-wider font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const allocPct = grandTotal > 0 ? (row.totalValue / grandTotal) * 100 : 0;
              const isExp = expanded === row.id;
              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => setExpanded(isExp ? null : row.id)}
                    className="border-b border-[#1a1a1a] hover:bg-[#1f1f1f] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: row.color + '30', border: `1px solid ${row.color}50` }}
                        >
                          {row.icon}
                        </div>
                        <div>
                          <div className="font-medium text-white text-[13px]">
                            {row.ticker !== '—' ? row.ticker : row.name.split(' ')[0]}
                          </div>
                          <div className="text-[10px] text-[#555] max-w-[140px] truncate">{row.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <TypeBadge type={row.type} />
                        <LiquidityBadge liquid={row.liquid} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#888] font-mono text-[12px]">
                      {formatNumber(row.qty)}
                    </td>
                    <td className="px-4 py-3 text-[#888] font-mono text-[12px]">
                      {row.liquid ? formatNumber(row.liquidQty ?? row.qty) : <span className="text-[#444]">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-white">
                      {loading ? '...' : (row.price > 0 ? formatPrice(row.price) : <span className="text-[#444]">N/A</span>)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {loading ? '...' : formatCurrency(row.totalValue)}
                    </td>
                    <td className="px-4 py-3">
                      {row.liquid ? (
                        <span className="text-[#22c55e] font-medium">{loading ? '...' : formatCurrency(row.liquidValue)}</span>
                      ) : (
                        <span className="text-[#444] text-[12px]">Illiquid</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1 bg-[#222] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(allocPct, 100)}%`, background: row.color }}
                          />
                        </div>
                        <span className="text-[11px] text-[#666]">{allocPct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]">
                      {row.change != null ? (
                        <span className={row.change >= 0 ? 'positive' : 'negative'}>
                          {formatPercent(row.change)}
                        </span>
                      ) : (
                        <span className="text-[#444]">—</span>
                      )}
                    </td>
                  </tr>
                  {isExp && (
                    <tr key={`${row.id}-exp`} className="bg-[#141414] border-b border-[#1f1f1f]">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid md:grid-cols-2 gap-4 text-[12px]">
                          <div>
                            <div className="text-[#555] uppercase tracking-wider text-[10px] mb-1">Notes</div>
                            <p className="text-[#888] leading-relaxed">{row.notes}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div>
                              <div className="text-[#555] uppercase tracking-wider text-[10px] mb-1">Source</div>
                              <SourceLink url={row.sourceUrl} label={row.source} />
                            </div>
                            {row.revenueNote && (
                              <div>
                                <div className="text-[#555] uppercase tracking-wider text-[10px] mb-1">Revenue Entitlement</div>
                                <span className="text-[#D4AF37]">{row.revenueNote}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-[#1f1f1f]">
        {rows.map((row) => {
          const allocPct = grandTotal > 0 ? (row.totalValue / grandTotal) * 100 : 0;
          return (
            <div
              key={row.id}
              className="px-4 py-3 cursor-pointer hover:bg-[#1f1f1f] transition-colors"
              onClick={() => setExpanded(expanded === row.id ? null : row.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{row.icon}</span>
                  <div>
                    <div className="font-medium text-white text-[13px]">
                      {row.ticker !== '—' ? row.ticker : row.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-[#555]">{row.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">{loading ? '...' : formatCurrency(row.totalValue)}</div>
                  <div className="text-[11px] text-[#555]">{allocPct.toFixed(1)}%</div>
                </div>
              </div>
              {expanded === row.id && (
                <div className="mt-2 pt-2 border-t border-[#222] text-[12px] text-[#888] leading-relaxed">
                  {row.notes}
                  <div className="mt-1">
                    <SourceLink url={row.sourceUrl} label={row.source} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
