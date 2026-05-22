import { ALLOCATIONS, SECTOR_ALLOCATIONS, TOTAL_ESTIMATED_NET } from '../data/unified';

// HHI = Σ(weight_i²) × 10,000  — range [0, 10,000]
// Perfect diversification at N stocks: 10,000 / N
const HHI = Math.round(ALLOCATIONS.reduce((s, a) => s + a.weight ** 2, 0) * 10_000);
const N   = ALLOCATIONS.length;
const HHI_IDEAL = Math.round(10_000 / N);

function riskLevel(hhi) {
  if (hhi >= 2_500) return { text: 'ALTA CONCENTRAZIONE',  color: '#ef4444' };
  if (hhi >= 1_500) return { text: 'MODERATA',             color: '#f97316' };
  if (hhi >= 1_000) return { text: 'BASSA',                color: '#D4AF37' };
  return                    { text: 'DIVERSIFICATO',        color: '#22c55e' };
}

const risk = riskLevel(HHI);

// Top 5 + top 10 concentration
const top5Weight  = ALLOCATIONS.slice(0, 5).reduce((s, a) => s + a.weight, 0) * 100;
const top10Weight = ALLOCATIONS.slice(0, 10).reduce((s, a) => s + a.weight, 0) * 100;

// Sector HHI
const sectorHHI = Math.round(SECTOR_ALLOCATIONS.reduce((s, a) => s + a.weight ** 2, 0) * 10_000);

function StatRow({ label, value, sub, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#141414]">
      <div>
        <div className="text-[11px] text-[#777]">{label}</div>
        {sub && <div className="text-[9px] text-[#333] mt-0.5">{sub}</div>}
      </div>
      <div className="text-[13px] font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}

function GaugeSVG({ hhi, ideal }) {
  // Simple arc gauge 0–2500 mapped to 0–180 degrees
  const max   = 2_500;
  const angle = Math.min((hhi / max) * 180, 180);
  const rad   = (angle - 180) * (Math.PI / 180);
  const cx = 70, cy = 70, r = 55;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);
  const color = hhi >= 2500 ? '#ef4444' : hhi >= 1500 ? '#f97316' : hhi >= 1000 ? '#D4AF37' : '#22c55e';

  return (
    <svg width={140} height={80} viewBox="0 0 140 80">
      {/* Background arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#1a1a1a" strokeWidth={10} strokeLinecap="round"
      />
      {/* Filled arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${angle > 90 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}`}
        fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
      />
      {/* Labels */}
      <text x={cx - r - 2} y={cy + 16} fontSize={8} fill="#333" textAnchor="middle">0</text>
      <text x={cx + r + 2} y={cy + 16} fontSize={8} fill="#333" textAnchor="middle">2.5K</text>
      {/* HHI value */}
      <text x={cx} y={cy - 4} fontSize={16} fontWeight="bold" fill={color} textAnchor="middle" fontFamily="monospace">
        {hhi.toLocaleString()}
      </text>
      <text x={cx} y={cy + 12} fontSize={7} fill="#444" textAnchor="middle">HHI</text>
    </svg>
  );
}

export default function RiskMetrics() {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Rischio Concentrazione
        </h2>
        <p className="text-[11px] text-[#444] mt-0.5">
          Herfindahl–Hirschman Index — misura di concentrazione del portafoglio
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left: gauge + HHI reading */}
        <div className="flex flex-col items-center gap-2">
          <GaugeSVG hhi={HHI} ideal={HHI_IDEAL} />

          <div
            className="text-[10px] font-bold px-3 py-1 rounded-full border"
            style={{ color: risk.color, borderColor: `${risk.color}40`, background: `${risk.color}10` }}
          >
            {risk.text}
          </div>

          <div className="grid grid-cols-2 gap-2 w-full mt-1">
            <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-2 text-center">
              <div className="text-[9px] text-[#333] mb-1">HHI ideale ({N} titoli)</div>
              <div className="text-[13px] font-bold font-mono text-[#444]">{HHI_IDEAL.toLocaleString()}</div>
            </div>
            <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-lg p-2 text-center">
              <div className="text-[9px] text-[#333] mb-1">Eccesso vs ideale</div>
              <div className="text-[13px] font-bold font-mono" style={{ color: risk.color }}>
                +{(HHI - HHI_IDEAL).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Right: stats */}
        <div>
          <StatRow
            label="HHI Portafoglio"
            sub="Herfindahl–Hirschman Index (×10,000)"
            value={HHI.toLocaleString()}
            color={risk.color}
          />
          <StatRow
            label="HHI Settoriale"
            sub={`${SECTOR_ALLOCATIONS.length} settori`}
            value={sectorHHI.toLocaleString()}
            color={sectorHHI >= 3000 ? '#ef4444' : sectorHHI >= 2000 ? '#f97316' : '#D4AF37'}
          />
          <StatRow
            label="Top 5 titoli"
            sub={ALLOCATIONS.slice(0, 5).map(a => a.ticker).join(', ')}
            value={`${top5Weight.toFixed(1)}%`}
            color={top5Weight >= 60 ? '#ef4444' : top5Weight >= 45 ? '#f97316' : '#22c55e'}
          />
          <StatRow
            label="Top 10 titoli"
            sub="concentrazione cumulata"
            value={`${top10Weight.toFixed(1)}%`}
            color={top10Weight >= 80 ? '#f97316' : '#D4AF37'}
          />
          <StatRow
            label="Titoli totali"
            sub="posizioni net positive"
            value={`${N}`}
            color="#888"
          />

          <div className="mt-3 text-[9px] text-[#2a2a2a] leading-relaxed">
            Un HHI &lt; 1,500 indica portafoglio diversificato. AMZN da sola ({(ALLOCATIONS[0]?.weight * 100).toFixed(1)}% del portafoglio) è il driver principale dell'HHI elevato.
          </div>
        </div>
      </div>
    </div>
  );
}
