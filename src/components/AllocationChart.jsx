import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HOLDINGS } from '../data/holdings';
import { formatCurrency, formatPercent } from '../utils/format';

function buildChartData(prices) {
  const data = [];
  let total = 0;

  for (const h of HOLDINGS) {
    const price = prices[h.id] ?? 0;
    const value = price * (h.quantity ?? 1);
    total += value;
    data.push({ name: h.ticker === '—' ? h.name.split(' ')[0] : h.ticker, fullName: h.name, value, color: h.color, id: h.id });
  }

  return { data: data.filter((d) => d.value > 0), total };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card border border-[#333] px-3 py-2 text-sm shadow-xl">
      <div className="font-semibold text-white mb-1">{d.fullName}</div>
      <div className="text-[#888]">{formatCurrency(d.value)}</div>
    </div>
  );
}

function CustomLegend({ data, total }) {
  return (
    <div className="flex flex-col gap-2 justify-center">
      {data.map((d) => {
        const pct = total > 0 ? (d.value / total) * 100 : 0;
        return (
          <div key={d.id} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-[#aaa] text-[12px]">{d.fullName}</span>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-white font-medium text-[12px]">{formatCurrency(d.value)}</span>
              <span className="text-[#555] text-[11px] ml-2">{pct.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AllocationChart({ prices, loading }) {
  const { data, total } = buildChartData(prices);

  if (loading || data.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-64">
        <div className="text-[#444] text-sm">Loading allocation data...</div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider">Portfolio Allocation</h2>
        <span className="text-xs text-[#555]">All disclosed assets</span>
      </div>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="w-full lg:w-48 h-48 flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-[#555] uppercase tracking-wider">Total</span>
            <span className="text-sm font-bold text-white">{formatCurrency(total)}</span>
          </div>
        </div>
        <div className="flex-1 w-full">
          <CustomLegend data={data} total={total} />
        </div>
      </div>
    </div>
  );
}
