import { ALL_POSITIONS, Q1_STATS } from '../data/unified';

function KPI({ label, value, sub, accent, icon }) {
  return (
    <div className={`bg-[#111] border rounded-xl p-3.5 ${accent ? 'border-[#C41E3A]/25' : 'border-[#1a1a1a]'}`}>
      <div className="text-[9px] text-[#444] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold leading-tight ${accent ? 'text-[#C41E3A]' : 'text-white'}`}>
        {icon && <span className="mr-1">{icon}</span>}{value}
      </div>
      {sub && <div className="text-[10px] text-[#444] mt-0.5">{sub}</div>}
    </div>
  );
}

export default function StockKPIs() {
  const accumulating = ALL_POSITIONS.filter(p => p.netStatus === 'ACCUMULATING').length;
  const exiting = ALL_POSITIONS.filter(p => p.netStatus === 'EXITING' || p.netStatus === 'CLOSED').length;
  const totalBuys = ALL_POSITIONS.reduce((s, p) => s + p.estimatedBuyTotal, 0);
  const totalSells = ALL_POSITIONS.reduce((s, p) => s + p.estimatedSellTotal, 0);
  const bigSellers = ALL_POSITIONS.filter(p => p.maxSellBand === '$5M–$25M').map(p => p.ticker);

  return (
    <div className="space-y-3">
      {/* Main stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KPI
          label="Transazioni Q1 2026"
          value={Q1_STATS.totalTransactions.toLocaleString()}
          sub={`${Q1_STATS.equityTransactions.toLocaleString()} azionarie + ${Q1_STATS.bondTransactions} bond`}
        />
        <KPI
          label="Volume acquisti OGE"
          value="~$247.7M"
          sub={`${Q1_STATS.coveragePeriod}`}
        />
        <KPI
          label="Volume vendite OGE"
          value="~$159.1M"
          sub={`Incl. ${bigSellers.join(', ')} block Feb 10`}
          accent
        />
        <KPI
          label="Net flow stimato"
          value="~+$88M"
          sub="Acquirente netto in Q1 (est.)"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <KPI label="Posizioni analizzate" value={`${ALL_POSITIONS.length}`} sub="da PDF 278-T" />
        <KPI label="In Accumulo" value={accumulating} sub="netStatus ACCUMULATING" />
        <KPI label="In Uscita / Chiuse" value={exiting} sub="net seller o posizione chiusa" />
        <KPI
          label="Filing"
          value="8 Mag 2026"
          sub="Tardivo · late fees pagati"
        />
      </div>

      {/* Source banner */}
      <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="text-[11px] text-[#444] leading-relaxed">
          <span className="text-[#D4AF37]/70">Fonte primaria:</span> OGE Form 278-T — Trump, Donald J., 05.08.2026 (113 pagine, estratto completo).
          Valori stimati con midpoint delle fasce OGE. Dati non sostituiscono consulenza finanziaria o legale.
        </div>
        <a
          href={Q1_STATS.sourceUrl}
          target="_blank" rel="noreferrer"
          className="text-[11px] text-[#D4AF37]/70 hover:text-[#D4AF37] flex-shrink-0 transition-colors"
        >
          PDF ↗
        </a>
      </div>
    </div>
  );
}
