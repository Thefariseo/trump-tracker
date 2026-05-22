import { ALLOCATIONS, SECTOR_ALLOCATIONS, TOTAL_ESTIMATED_NET } from '../data/unified';

// HHI = Σ(weight_i²) × 10,000
const HHI       = Math.round(ALLOCATIONS.reduce((s, a) => s + a.weight ** 2, 0) * 10_000);
const N         = ALLOCATIONS.length;
const HHI_IDEAL = Math.round(10_000 / N);

function riskLevel(hhi) {
  if (hhi >= 2_500) return { text: 'ALTA',        color: '#ef4444' };
  if (hhi >= 1_500) return { text: 'MODERATA',    color: '#f97316' };
  if (hhi >= 1_000) return { text: 'BASSA',       color: '#D4AF37' };
  return                    { text: 'DIVERSIFICATO', color: '#22c55e' };
}

const risk         = riskLevel(HHI);
const top5Weight   = ALLOCATIONS.slice(0, 5).reduce((s, a) => s + a.weight, 0) * 100;
const top10Weight  = ALLOCATIONS.slice(0, 10).reduce((s, a) => s + a.weight, 0) * 100;
const sectorHHI    = Math.round(SECTOR_ALLOCATIONS.reduce((s, a) => s + a.weight ** 2, 0) * 10_000);

function StatRow({ label, value, sub, color }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a] last:border-0">
      <div>
        <div className="text-[12px] text-[#888]">{label}</div>
        {sub && <div className="text-[10px] text-[#555] mt-0.5">{sub}</div>}
      </div>
      <div className="text-[16px] font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}

function GaugeSVG({ hhi }) {
  const max   = 2_500;
  const angle = Math.min((hhi / max) * 180, 180);
  const rad   = (angle - 180) * (Math.PI / 180);
  const cx = 80, cy = 72, r = 58;
  const x   = cx + r * Math.cos(rad);
  const y   = cy + r * Math.sin(rad);
  const big = angle > 90 ? 1 : 0;
  const color = hhi >= 2500 ? '#ef4444' : hhi >= 1500 ? '#f97316' : hhi >= 1000 ? '#D4AF37' : '#22c55e';

  return (
    <svg width="160" height="88" viewBox="0 0 160 88" role="img" aria-label={`HHI gauge: ${hhi}`}>
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#1e1e1e" strokeWidth={12} strokeLinecap="round"
      />
      {/* Fill */}
      {hhi > 0 && (
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${big} 1 ${x.toFixed(2)} ${y.toFixed(2)}`}
          fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
        />
      )}
      {/* Scale labels */}
      <text x={cx - r - 4} y={cy + 18} fontSize={9} fill="#555" textAnchor="middle">0</text>
      <text x={cx + r + 4} y={cy + 18} fontSize={9} fill="#555" textAnchor="middle">2.5K</text>
      {/* HHI value */}
      <text x={cx} y={cy - 6} fontSize={20} fontWeight="900" fill={color} textAnchor="middle" fontFamily="ui-monospace, monospace">
        {hhi.toLocaleString()}
      </text>
      <text x={cx} y={cy + 12} fontSize={9} fill="#555" textAnchor="middle" letterSpacing="2">
        HHI
      </text>
    </svg>
  );
}

export default function RiskMetrics() {
  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-[13px] font-bold text-[#ccc] tracking-tight">Rischio Concentrazione</h2>
        <p className="text-[11px] text-[#555] mt-1">
          Herfindahl–Hirschman Index — misura di concentrazione del portafoglio
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Gauge column */}
        <div className="flex flex-col items-center gap-3">
          <GaugeSVG hhi={HHI} />

          {/* Risk badge */}
          <div
            className="text-[11px] font-bold px-4 py-1.5 rounded-full"
            style={{
              color:      risk.color,
              border:     `1px solid ${risk.color}35`,
              background: `${risk.color}10`,
            }}
          >
            CONCENTRAZIONE {risk.text}
          </div>

          {/* Small chips */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <div className="panel rounded-xl p-3 text-center">
              <div className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1.5">
                Ideale ({N} titoli)
              </div>
              <div className="text-[16px] font-bold font-mono text-[#555]">
                {HHI_IDEAL.toLocaleString()}
              </div>
            </div>
            <div className="panel rounded-xl p-3 text-center">
              <div className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-1.5">
                Eccesso
              </div>
              <div className="text-[16px] font-bold font-mono" style={{ color: risk.color }}>
                +{(HHI - HHI_IDEAL).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats column */}
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
            sub={ALLOCATIONS.slice(0, 5).map(a => a.ticker).join(' · ')}
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
            label="Posizioni totali"
            sub="net accumulating"
            value={`${N}`}
            color="#888"
          />

          <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-[10px] text-[#444] leading-relaxed">
            HHI &lt; 1,500 = portafoglio diversificato.{' '}
            {ALLOCATIONS[0]?.ticker} ({(ALLOCATIONS[0]?.weight * 100).toFixed(1)}% del portafoglio)
            è il driver principale dell'HHI elevato.
          </div>
        </div>
      </div>
    </div>
  );
}
