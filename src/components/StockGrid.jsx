import { useState, useMemo } from 'react';
import { ALL_POSITIONS } from '../data/unified';
import StockCard from './StockCard';

const FILTERS = ['ALL', 'ACCUMULATING', 'TRIMMING', 'EXITING', 'CLOSED'];
const SORTS = [
  { key: 'net_desc',  label: 'Net flow ↓' },
  { key: 'buy_desc',  label: 'Buy volume ↓' },
  { key: 'sell_desc', label: 'Sell volume ↓' },
  { key: 'txns_desc', label: 'Txn count ↓' },
];

export default function StockGrid() {
  const [filter, setFilter] = useState('ALL');
  const [sort,   setSort]   = useState('net_desc');
  const [search, setSearch] = useState('');

  const maxValue = useMemo(
    () => Math.max(...ALL_POSITIONS.map(p => Math.max(p.estimatedBuyTotal, p.estimatedSellTotal))),
    [],
  );

  const sortFn = (a, b) => {
    if (sort === 'buy_desc')  return b.estimatedBuyTotal - a.estimatedBuyTotal;
    if (sort === 'sell_desc') return b.estimatedSellTotal - a.estimatedSellTotal;
    if (sort === 'net_desc')  return b.net - a.net;
    if (sort === 'txns_desc') return (b.buys + b.sells) - (a.buys + a.sells);
    return 0;
  };

  const needle = search.trim().toLowerCase();

  const positions = useMemo(() => {
    return ALL_POSITIONS
      .filter(p => filter === 'ALL' || p.netStatus === filter)
      .filter(p => !needle ||
        p.ticker.toLowerCase().includes(needle) ||
        p.name.toLowerCase().includes(needle) ||
        p.sector.toLowerCase().includes(needle)
      )
      .sort(sortFn);
  }, [filter, needle, sort]);

  const counts = useMemo(() => {
    const c = {};
    FILTERS.forEach(f => {
      c[f] = f === 'ALL' ? ALL_POSITIONS.length : ALL_POSITIONS.filter(p => p.netStatus === f).length;
    });
    return c;
  }, []);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-[13px] font-bold text-[#ccc] tracking-tight">
            Posizioni — {ALL_POSITIONS.length} titoli
          </h2>
          <p className="text-[11px] text-[#555] mt-1">
            Click su una card per espandere analisi, date chiave e grafico prezzi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555] text-[11px] pointer-events-none">⌕</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca ticker o nome…"
              className="pl-7 pr-7 py-1.5 bg-[#171717] border border-[#242424] rounded-lg text-[11px] text-[#bbb] placeholder-[#444] focus:outline-none focus:border-[#333] w-44 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] text-[11px] transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-[#171717] border border-[#242424] rounded-lg px-2.5 py-1.5 text-[11px] text-[#888] focus:outline-none focus:border-[#333] transition-colors appearance-none cursor-pointer"
          >
            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all tracking-wide ${
              filter === f
                ? 'bg-[#C41E3A]/15 border-[#C41E3A]/40 text-[#C41E3A]'
                : 'bg-transparent border-[#222] text-[#555] hover:border-[#333] hover:text-[#888]'
            }`}
          >
            {f}
            <span className={`ml-1.5 ${filter === f ? 'opacity-80' : 'opacity-50'}`}>
              ({counts[f]})
            </span>
          </button>
        ))}
        {needle && (
          <span className="text-[11px] text-[#666] px-2 py-1.5">
            {positions.length} risultati per &ldquo;{search}&rdquo;
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {positions.map(p => (
          <StockCard key={p.ticker} position={p} maxValue={maxValue} />
        ))}
      </div>

      {positions.length === 0 && (
        <div className="text-center text-[#333] text-sm py-8">
          {needle ? `Nessun risultato per "${search}"` : 'Nessuna posizione in questo stato'}
        </div>
      )}
    </div>
  );
}
