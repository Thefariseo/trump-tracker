import { useState, useMemo } from 'react';
import { ALLOCATIONS } from '../data/unified';
import { useStockPrices } from '../hooks/useStockPrices';

function fmt$(n) {
  if (n >= 1_000_000) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1000)      return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `$${n.toFixed(2)}`;
}
function fmtPct(n) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

const PRESETS = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000];

export default function MirrorInvestment({ selectedSector }) {
  const [raw,       setRaw]       = useState('10000');
  const [filterPct, setFilterPct] = useState(0.5);
  const [copied,    setCopied]    = useState(false);
  const [activeTab, setActiveTab] = useState('mirror'); // 'mirror' | 'whatif'

  const { prices: livePrices, changes: liveChanges, live } = useStockPrices();

  const amount = useMemo(() => {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
    return isNaN(n) || n <= 0 ? 0 : n;
  }, [raw]);

  const rows = useMemo(() => {
    return ALLOCATIONS
      .filter(s => s.weight * 100 >= filterPct)
      .filter(s => !selectedSector || s.sector.split('/')[0].trim() === selectedSector)
      .map(s => {
        const livePrice = livePrices[s.ticker];
        const price     = livePrice ?? s.ref_price;
        const dollarAlloc = s.weight * amount;
        const shares    = price > 1 ? dollarAlloc / price : null;
        // What-if: ref_price = price at time of buy (approx), live price = today
        const roi = livePrice && s.ref_price > 1
          ? ((livePrice / s.ref_price) - 1) * 100
          : null;
        return {
          ticker:       s.ticker,
          name:         s.name,
          sector:       s.sector.split('/')[0].trim(),
          weight:       s.weight,
          color:        s.color,
          dollarAlloc,
          refPrice:     s.ref_price,
          price,
          isLive:       livePrice != null,
          change:       liveChanges[s.ticker] ?? null,
          shares:       s.ref_price === 1 ? null : shares,
          isMMF:        s.ref_price === 1,
          roi,
          // What-if value: what $dollarAlloc invested at ref_price is worth today
          currentValue: roi != null ? dollarAlloc * (1 + roi / 100) : null,
        };
      });
  }, [amount, filterPct, selectedSector, livePrices, liveChanges]);

  const totalAlloc   = rows.reduce((s, r) => s + r.dollarAlloc,   0);
  const totalCurrent = rows.reduce((s, r) => s + (r.currentValue ?? r.dollarAlloc), 0);
  const totalROI     = totalAlloc > 0 ? ((totalCurrent / totalAlloc) - 1) * 100 : null;
  const coveredWeight = rows.reduce((s, r) => s + r.weight, 0);

  function copyCSV() {
    const header = 'Ticker,Name,Sector,Weight %,Allocation ($),Price,Shares,ROI %\n';
    const lines  = rows.map(r =>
      `${r.ticker},${r.name},${r.sector},${(r.weight * 100).toFixed(2)},${r.dollarAlloc.toFixed(2)},${r.price},${r.shares != null ? r.shares.toFixed(3) : ''},${r.roi != null ? r.roi.toFixed(1) : ''}`
    ).join('\n');
    navigator.clipboard.writeText(header + lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {activeTab === 'mirror' ? 'Mirror Investment Calculator' : '"What If" — ROI Stimato'}
          </h2>
          <p className="text-[11px] text-[#444] mt-0.5">
            {activeTab === 'mirror'
              ? 'Inserisci qualsiasi importo per replicare il portafoglio stimato'
              : 'Rendimento stimato se avessi investito insieme a Trump'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {live ? (
            <span className="text-[9px] px-2 py-0.5 rounded border border-[#22c55e]/30 text-[#22c55e]/70 bg-[#22c55e]/5">● live</span>
          ) : (
            <span className="text-[9px] px-2 py-0.5 rounded border border-[#D4AF37]/20 text-[#D4AF37]/60 bg-[#D4AF37]/5">ref. mag 2026</span>
          )}
          <div className="flex gap-0.5">
            {[['mirror', '💰'], ['whatif', '📈']].map(([v, icon]) => (
              <button key={v} onClick={() => setActiveTab(v)}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  activeTab === v ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'border-transparent text-[#444] hover:text-[#666]'
                }`}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sector filter badge */}
      {selectedSector && (
        <div className="mb-3 text-[10px] text-[#D4AF37]/70 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded px-2.5 py-1">
          Filtrato per settore: <strong className="text-[#D4AF37]">{selectedSector}</strong>
          <span className="ml-1 text-[#555]">· {rows.length} posizioni · {(coveredWeight * 100).toFixed(1)}% peso</span>
        </div>
      )}

      {/* Input + presets */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2">
          <span className="text-[#555] text-sm font-mono">$</span>
          <input
            type="text"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder="10000"
            className="w-28 bg-transparent text-white text-sm font-mono focus:outline-none placeholder-[#333]"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map(p => (
            <button key={p} onClick={() => setRaw(String(p))}
              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                amount === p ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]' : 'border-[#1a1a1a] text-[#444] hover:border-[#2a2a2a] hover:text-[#666]'
              }`}>
              ${p.toLocaleString('en-US')}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select value={filterPct} onChange={e => setFilterPct(Number(e.target.value))}
            className="text-[10px] bg-[#111] border border-[#1a1a1a] rounded px-2 py-1 text-[#666] focus:outline-none">
            <option value={0}>Tutti</option>
            <option value={0.5}>≥ 0.5%</option>
            <option value={1}>≥ 1%</option>
            <option value={2}>≥ 2%</option>
          </select>
          <button onClick={copyCSV}
            className="text-[10px] px-2.5 py-1 rounded border border-[#2a2a2a] text-[#444] hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-colors">
            {copied ? '✓' : '⬇ CSV'}
          </button>
        </div>
      </div>

      {/* Table */}
      {amount > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-separate border-spacing-y-0.5">
            <thead>
              <tr>
                <th className="text-left text-[9px] text-[#333] uppercase tracking-wider pb-2 pr-3 font-normal">Ticker</th>
                <th className="text-left text-[9px] text-[#333] uppercase tracking-wider pb-2 pr-3 font-normal hidden sm:table-cell">Nome</th>
                <th className="text-right text-[9px] text-[#333] uppercase tracking-wider pb-2 pr-3 font-normal">Peso</th>
                <th className="text-right text-[9px] text-[#333] uppercase tracking-wider pb-2 pr-3 font-normal">Alloc.</th>
                {activeTab === 'mirror' ? (
                  <>
                    <th className="text-right text-[9px] text-[#333] uppercase tracking-wider pb-2 pr-3 font-normal hidden sm:table-cell">Prezzo</th>
                    <th className="text-right text-[9px] text-[#333] uppercase tracking-wider pb-2 font-normal">Azioni est.</th>
                  </>
                ) : (
                  <>
                    <th className="text-right text-[9px] text-[#333] uppercase tracking-wider pb-2 pr-3 font-normal hidden sm:table-cell">Valore oggi</th>
                    <th className="text-right text-[9px] text-[#333] uppercase tracking-wider pb-2 font-normal">ROI est.</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.ticker} className="hover:bg-[#111] rounded transition-colors group">
                  <td className="py-1.5 pr-3 rounded-l">
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                      style={{ background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}30` }}>
                      {r.ticker}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-[#666] truncate max-w-[120px] hidden sm:table-cell">{r.name}</td>
                  <td className="py-1.5 pr-3 text-right">
                    <span className="text-[#888] font-mono">{(r.weight * 100).toFixed(2)}%</span>
                  </td>
                  <td className="py-1.5 pr-3 text-right">
                    <span className="text-white font-semibold font-mono">{fmt$(r.dollarAlloc)}</span>
                  </td>

                  {activeTab === 'mirror' ? (
                    <>
                      <td className="py-1.5 pr-3 text-right hidden sm:table-cell">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.change != null && (
                            <span className={`text-[9px] ${r.change >= 0 ? 'text-[#22c55e]/70' : 'text-[#ef4444]/70'}`}>
                              {r.change >= 0 ? '+' : ''}{r.change.toFixed(1)}%
                            </span>
                          )}
                          <span className={`font-mono text-[11px] ${r.isLive ? 'text-[#aaa]' : 'text-[#555]'}`}>
                            {r.price > 0 ? `$${r.price.toLocaleString('en-US')}` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 text-right rounded-r">
                        {r.isMMF ? (
                          <span className="text-[9px] text-[#555] font-mono">MMF</span>
                        ) : r.shares != null ? (
                          <span className={`font-mono font-semibold ${r.shares >= 1 ? 'text-[#22c55e]' : 'text-[#84cc16]'}`}>
                            {r.shares >= 100 ? r.shares.toFixed(0) : r.shares >= 1 ? r.shares.toFixed(2) : r.shares.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-1.5 pr-3 text-right hidden sm:table-cell">
                        <span className="font-mono text-[11px] text-[#aaa]">
                          {r.currentValue != null ? fmt$(r.currentValue) : '—'}
                        </span>
                      </td>
                      <td className="py-1.5 text-right rounded-r">
                        {r.roi != null ? (
                          <span className={`font-mono font-semibold text-[11px] ${r.roi >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                            {fmtPct(r.roi)}
                          </span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#1a1a1a]">
                <td colSpan={3} className="pt-2 text-[10px] text-[#444]">{rows.length} posizioni</td>
                <td className="pt-2 text-right text-white font-bold font-mono">{fmt$(totalAlloc)}</td>
                {activeTab === 'mirror' ? (
                  <td colSpan={2} />
                ) : (
                  <>
                    <td className="pt-2 text-right font-mono text-[#aaa] hidden sm:table-cell">{fmt$(totalCurrent)}</td>
                    <td className="pt-2 text-right font-bold font-mono">
                      {totalROI != null && (
                        <span className={totalROI >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                          {fmtPct(totalROI)}
                        </span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-[#333] text-[12px]">Inserisci un importo per calcolare le allocazioni</div>
      )}

      <div className="mt-4 pt-3 border-t border-[#1a1a1a] text-[9px] text-[#2a2a2a] leading-relaxed">
        {activeTab === 'whatif'
          ? '⚠️ ROI calcolato su prezzi di riferimento OGE mag 2026 vs prezzi live. Approssimazione — i prezzi OGE non sono i prezzi esatti di acquisto. Non è consulenza finanziaria.'
          : '⚠️ Basato su midpoint fasce OGE 278-T — valori approssimativi. Non è consulenza finanziaria.'}
      </div>
    </div>
  );
}
