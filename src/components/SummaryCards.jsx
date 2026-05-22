import { HOLDINGS } from '../data/holdings';
import { formatCurrency, formatPercent } from '../utils/format';

function computeTotals(prices) {
  let totalValue = 0;
  let liquidValue = 0;
  let weightedChange = 0;
  let changeWeightSum = 0;

  for (const h of HOLDINGS) {
    const price = prices[h.id] ?? 0;
    const qty = h.quantity ?? 1;
    const value = price * qty;
    totalValue += value;

    const liquidQty = h.liquid ? (h.liquidQuantity ?? qty) : 0;
    liquidValue += price * liquidQty;
  }

  return { totalValue, liquidValue };
}

function StatCard({ label, value, sub, subColor, icon, link }) {
  const content = (
    <div className="card p-5 flex flex-col gap-1 transition-colors hover:border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-[#555] uppercase tracking-wider font-medium">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && (
        <div className={`text-[12px] font-medium ${subColor ?? 'text-[#666]'}`}>{sub}</div>
      )}
    </div>
  );
  if (link) return <a href={link} target="_blank" rel="noreferrer" className="block">{content}</a>;
  return content;
}

export default function SummaryCards({ prices, changes, loading }) {
  const { totalValue, liquidValue } = computeTotals(prices);
  const illiquidValue = totalValue - liquidValue;

  const djtChange = changes['djt'];
  const trumpChange = changes['trump-meme'];
  const melChange = changes['melania-meme'];

  const avgCryptoChange =
    [trumpChange, melChange].filter((v) => v != null).reduce((a, b) => a + b, 0) /
    ([trumpChange, melChange].filter((v) => v != null).length || 1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Est. Total Portfolio"
        value={loading ? '...' : formatCurrency(totalValue)}
        sub="All disclosed assets"
        icon="🏛️"
      />
      <StatCard
        label="Liquid / Tradeable"
        value={loading ? '...' : formatCurrency(liquidValue)}
        sub="Unlocked & marketable"
        icon="💧"
      />
      <StatCard
        label="DJT Stock (24h)"
        value={
          loading ? '...' :
          prices['djt'] ? (prices['djt_is_fallback'] ? `~$${prices['djt'].toFixed(2)}` : `$${prices['djt'].toFixed(2)}`) : '—'
        }
        sub={
          prices['djt_is_fallback'] ? 'est. mid-2025 · click ↗ for live' :
          djtChange != null ? formatPercent(djtChange) : 'Fetching...'
        }
        subColor={
          prices['djt_is_fallback'] ? 'text-[#666]' :
          djtChange != null ? (djtChange >= 0 ? 'positive' : 'negative') : 'text-[#666]'
        }
        icon="📺"
        link="https://finance.yahoo.com/quote/DJT/"
      />
      <StatCard
        label="TRUMP Coin (24h)"
        value={loading ? '...' : (prices['trump-meme'] ? `$${prices['trump-meme'].toFixed(3)}` : '—')}
        sub={trumpChange != null ? formatPercent(trumpChange) : 'Fetching...'}
        subColor={trumpChange != null ? (trumpChange >= 0 ? 'positive' : 'negative') : 'text-[#666]'}
        icon="🪙"
      />
    </div>
  );
}
