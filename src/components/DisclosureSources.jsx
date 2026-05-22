const SOURCES = [
  {
    icon: '🏛️',
    title: 'OGE Form 278',
    subtitle: 'Office of Government Ethics — Annual Public Financial Disclosure',
    desc: 'Required annual filing for federal officials. Discloses assets, income, liabilities in value bands.',
    url: 'https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/2025',
  },
  {
    icon: '📄',
    title: 'SEC Form 4',
    subtitle: 'Securities & Exchange Commission — Insider Transaction Reports',
    desc: 'Filed within 2 business days of any insider transaction. Source for DJT share quantity.',
    url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=DJT&type=4',
  },
  {
    icon: '⛓️',
    title: 'Solana On-Chain Data',
    subtitle: 'Publicly visible blockchain wallet transactions',
    desc: 'TRUMP and MELANIA token allocations to insider wallets are permanently recorded on Solana.',
    url: 'https://solscan.io',
  },
  {
    icon: '📑',
    title: 'WLFI White Paper v2',
    subtitle: 'World Liberty Financial — Protocol Documentation',
    desc: 'Describes token distribution: 75% to Trump family, 25% public sale. Trump family gets 75% of net revenue.',
    url: 'https://worldlibertyfinancial.com',
  },
  {
    icon: '📊',
    title: 'SEC 13D/13G Filings',
    subtitle: 'Beneficial Ownership Reports — >5% holders',
    desc: 'Trump\'s DJT stake reported via Schedule 13D with share counts and lock-up terms.',
    url: 'https://efts.sec.gov/LATEST/search-index?q=%22Donald+Trump%22&dateRange=custom&startdt=2024-01-01&forms=SC+13D',
  },
];

export default function DisclosureSources() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider">Data Sources</h2>
        <span className="text-xs text-[#555]">All data is public record</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SOURCES.map((s) => (
          <a
            key={s.title}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="block p-3 rounded-lg bg-[#111] border border-[#222] hover:border-[#D4AF37]/30 hover:bg-[#181510] transition-all group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{s.icon}</span>
              <div>
                <div className="text-[12px] font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                  {s.title}
                </div>
                <div className="text-[9px] text-[#444] uppercase tracking-wide">{s.subtitle}</div>
              </div>
            </div>
            <p className="text-[11px] text-[#555] leading-relaxed">{s.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
