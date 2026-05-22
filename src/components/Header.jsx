export default function Header({ lastUpdated, loading, onRefresh }) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <header className="border-b border-[#2a2a2a] bg-[#111] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C41E3A] flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-red-900/30">
            T
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">
              Trump Portfolio Tracker
            </h1>
            <p className="text-[10px] text-[#555] font-medium tracking-wider uppercase">
              Based on public financial disclosures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] pulse-gold" />
            <span className="text-[11px] text-[#666]">
              {loading ? 'Updating...' : timeStr ? `Updated ${timeStr}` : 'Loading...'}
            </span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-[11px] text-[#888] hover:text-white border border-[#2a2a2a] hover:border-[#444] rounded-full px-3 py-1 transition-all disabled:opacity-40"
          >
            {loading ? '↻' : '↻ Refresh'}
          </button>
          <a
            href="https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/2025"
            target="_blank"
            rel="noreferrer"
            className="hidden md:block text-[11px] text-[#D4AF37] hover:text-yellow-300 transition-colors"
          >
            OGE Disclosure ↗
          </a>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="bg-[#D4AF37]/10 border-t border-[#D4AF37]/20 px-4 py-1.5">
        <p className="text-[10px] text-[#D4AF37]/80 text-center max-w-7xl mx-auto">
          ⚠️ Estimates only — based on public OGE Form 278, SEC Form 4, and on-chain data. Quantities and values are approximate. Not financial advice.
        </p>
      </div>
    </header>
  );
}
