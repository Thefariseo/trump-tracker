// ═══════════════════════════════════════════════════════════════
// TRUMP PORTFOLIO TRACKER — DATA FILE
// All data from public financial disclosures as of May 2026:
//   • OGE Form 278 Annual (CY2024, filed June 2025)
//   • OGE Form 278-T Periodic Transaction Reports (through Mar 2026)
//   • SEC Form 4 (insider transactions)
//   • SEC Schedule 13D (beneficial ownership)
//   • On-chain blockchain data
// ═══════════════════════════════════════════════════════════════

// ─── DJT FILING — MOST CURRENT DATA (May 2026) ───────────────
// Original acquisition: 114,750,000 shares via DWAC merger (Mar 26, 2024)
// Source: SEC Schedule 13D filed March 26, 2024
//
// KEY CHANGE — December 17, 2024:
//   Trump transferred ALL 114,750,000 shares to the
//   "Donald J. Trump Revocable Trust"
//   Trustee: Donald Trump Jr. (sole voting + investment power)
//   Source: SEC Form 4 filed ~December 20, 2024
//   DJT share price at transfer: ~$35.41/share (~$4.06B value)
//
// March 2025: 553,176 escrowed shares released → moved to brokerage
//   Total shares unchanged at 114,750,000
//
// Dilution: TMTG issued new shares; outstanding now ~276.95M
//   → Trump's % declined from 57.26% to ~41.4%
//
// No Form 4 sell transactions filed by Trump or the trust (May 2026)
// DJT stock price May 19, 2026: ~$8.00 (52-wk range $7.99–$27.00)
// ─────────────────────────────────────────────────────────────

export const DJT_FILING = {
  shares: 114750000,
  ownershipPct: 41.4,                 // Diluted post-new-share-issuances; was 57.26% at merger
  ownershipPctAtMerger: 57.26,
  totalOutstanding: 276950000,        // Per TMTG 10-Q (most recent, 2026)
  filingType: 'SEC Form 4 (Trust Transfer)',
  filingDate: '2024-12-20',           // Form 4 for trust transfer
  originalAcquisitionDate: '2024-03-26',
  originalFilingType: 'SEC Schedule 13D',
  filingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001858685&type=SC+13D&dateb=&owner=include&count=10',
  lockupExpiry: '2024-09-25',
  acquiredVia: 'DWAC Business Combination (non-cash)',
  entities: ['Donald J. Trump Revocable Trust (Dec 2024)'],
  trustee: 'Donald Trump Jr. (sole trustee, sole voting & investment power)',
  priceAtTransfer: 35.41,             // DJT price when shares moved to trust (Dec 2024)
  valueAtTransfer: 4062547500,        // 114.75M × $35.41
  escrowRelease: { date: '2025-03', shares: 553176, note: 'Escrowed shares released to brokerage account; total unchanged' },
  lastConfirmed: '2026-05',
  sellTransactions: 'None (Form 4 / Form 144) — Trump has stated publicly he will not sell during presidency',
  price52wkHigh: 27.00,              // May 27, 2025
  price52wkLow: 7.99,               // Recent weeks, March–May 2026
  currentPrice: 8.00,               // May 19, 2026
  notes: 'No sell transactions filed by Trump or the Trust since acquisition. TMTG reported $712M net loss in 2025 on minimal revenue. Shares diluted by new issuances: ownership fell from 57.26% → ~41.4%. DJT down ~68.8% in 12 months.',
};

// ─── OGE FORM 278 — ANNUAL DISCLOSURE ───────────────────────
export const OGE_FILING = {
  year: 2024,
  filedDate: '2025-06-14',           // Filed with 30-day extension (standard May deadline)
  filingUrl: 'https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/4EC9A8E6DD078F2985258CA9002C9377/$FILE/Trump,%20Donald%20J.%202025%20Annual%20278.pdf',
  totalDisclosedRange: '$1.4B – $2.1B+',
  note: 'OGE (5 U.S.C. app. § 102): values in bands up to ">$50M". Figures below use band midpoints + external sources (Forbes, Bloomberg, SEC filings). WLFI income disclosed separately.',
};

// ─── OGE FORM 278-T PERIODIC TRANSACTION REPORTS ─────────────
// Multiple 278-T filings through Q1 2026 reveal highly active trading account
// Q1 2026 (Jan 6 – Mar 30, 2026): 3,642 stock transactions + 69 bond purchases
// Sources:
//   • Feb 26, 2026 filing: https://www.whitehouse.gov/wp-content/uploads/2026/03/President-Donald-J.-Trump-Periodic-Transaction-Report-2.26.26-1.pdf
//   • May 8, 2026 filing: https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/405E4EC4E27BE8D185258DF7002DD1C0/$FILE/Trump,%20Donald%20J.-05.08.2026-278T(2).pdf
export const PTR_FILINGS = [
  { date: '2025-08-12', description: 'Summer 2025 transactions' },
  { date: '2025-10-17', description: 'Transactions through October 2025' },
  { date: '2025-11-14', description: 'Transactions through November 2025' },
  { date: '2026-02-26', description: 'Transactions through February 2026', url: 'https://www.whitehouse.gov/wp-content/uploads/2026/03/President-Donald-J.-Trump-Periodic-Transaction-Report-2.26.26-1.pdf' },
  { date: '2026-05-08', description: 'Q1 2026 — equities: 3,642 transactions (~$247.7M buys, ~$159.1M sells); bonds: 69 purchases (~$21.4M). Filed late; late fees paid.', url: 'https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/405E4EC4E27BE8D185258DF7002DD1C0/$FILE/Trump,%20Donald%20J.-05.08.2026-278T(2).pdf' },
];

// Top disclosed stock positions from Q1 2026 OGE 278-T (May 8, 2026)
// Source: /Downloads/Trump, Donald J.-05.08.2026-278T(2).pdf — fully extracted
// Covers Jan 6 – Mar 30, 2026. Buy/sell counts and ranges from actual PDF entries.
// Amount bands per OGE disclosure: each transaction falls in a statutory $ range.
export const ACTIVE_PORTFOLIO_STOCKS = [
  // ── MEGA BUYS ($5M–$25M band) ────────────────────────────────
  { ticker: 'AMZN',  name: 'Amazon',               buys: 18, sells: 2,  buyRange: 'up to $5M–$25M',  sellRange: '$250K–$500K', note: 'Largest single-txn buyer; 18 purchase entries' },

  // ── HEAVY BUYS ($1M–$5M band) ────────────────────────────────
  { ticker: 'ORCL',  name: 'Oracle',               buys: 14, sells: 0,  buyRange: '$1M–$5M',          sellRange: '—',          note: 'Consistent accumulation all Q1' },
  { ticker: 'NFLX',  name: 'Netflix',              buys: 14, sells: 2,  buyRange: '$1M–$5M',          sellRange: '$250K–$500K', note: '14 buys across Q1 2026' },
  { ticker: 'ADBE',  name: 'Adobe',                buys: 12, sells: 0,  buyRange: '$1M–$5M',          sellRange: '—',          note: 'Heavy accumulation' },
  { ticker: 'WDAY',  name: 'Workday',              buys: 11, sells: 0,  buyRange: '$1M–$5M',          sellRange: '—',          note: 'Active buy-side' },
  { ticker: 'AVGO',  name: 'Broadcom',             buys: 11, sells: 1,  buyRange: '$1M–$5M',          sellRange: '$250K–$500K', note: 'Net buyer despite one trim' },
  { ticker: 'COST',  name: 'Costco',               buys: 11, sells: 1,  buyRange: '$1M–$5M',          sellRange: '$1M–$5M',    note: 'Active both sides in Q1' },
  { ticker: 'UNH',   name: 'UnitedHealth',         buys: 10, sells: 0,  buyRange: '$1M–$5M',          sellRange: '—',          note: 'Significant accumulation; policy proximity scrutiny' },
  { ticker: 'MSI',   name: 'Motorola Solutions',   buys: 9,  sells: 0,  buyRange: '$1M–$5M',          sellRange: '—',          note: 'Consistent Q1 buyer' },
  { ticker: 'SNPS',  name: 'Synopsys',             buys: 8,  sells: 0,  buyRange: '$1M–$5M',          sellRange: '—',          note: 'EDA/semiconductor software' },
  { ticker: 'BA',    name: 'Boeing',               buys: 5,  sells: 2,  buyRange: '$1M–$5M',          sellRange: '$500K–$1M',  note: 'Net buyer' },
  { ticker: 'TDG',   name: 'TransDigm Group',      buys: 4,  sells: 0,  buyRange: '$1M–$5M',          sellRange: '—',          note: 'Defense/aerospace components' },

  // ── ACTIVE BUYS ($500K–$1M band) ─────────────────────────────
  { ticker: 'MSFT',  name: 'Microsoft',            buys: 16, sells: 3,  buyRange: '$500K–$1M',        sellRange: '$5M–$25M',   note: '⚠️ Net SELLER — 3 large Feb 10 block sales' },
  { ticker: 'AMD',   name: 'AMD',                  buys: 14, sells: 1,  buyRange: '$500K–$1M',        sellRange: '$1K–$15K',   note: 'Heavy accumulation in semiconductors' },
  { ticker: 'NVDA',  name: 'Nvidia',               buys: 11, sells: 4,  buyRange: '$500K–$1M',        sellRange: '$500K–$1M',  note: 'Bought and trimmed across Q1' },
  { ticker: 'GOOGL', name: 'Alphabet',             buys: 10, sells: 0,  buyRange: '$500K–$1M',        sellRange: '—',          note: 'Consistent buyer, no sells' },
  { ticker: 'PAYX',  name: 'Paychex',              buys: 9,  sells: 0,  buyRange: '$500K–$1M',        sellRange: '—',          note: 'Recurring buy position' },
  { ticker: 'DASH',  name: 'DoorDash',             buys: 9,  sells: 0,  buyRange: '$500K–$1M',        sellRange: '—',          note: 'New Q1 2026 accumulation' },
  { ticker: 'APP',   name: 'AppLovin',             buys: 9,  sells: 0,  buyRange: '$500K–$1M',        sellRange: '—',          note: 'AdTech growth bet' },
  { ticker: 'FTNT',  name: 'Fortinet',             buys: 8,  sells: 0,  buyRange: '$500K–$1M',        sellRange: '—',          note: 'Cybersecurity accumulation' },
  { ticker: 'ACN',   name: 'Accenture',            buys: 8,  sells: 4,  buyRange: '$500K–$1M',        sellRange: '$1M–$5M',    note: '⚠️ Net SELLER — sold 4 large lots' },
  { ticker: 'SYK',   name: 'Stryker',              buys: 7,  sells: 1,  buyRange: '$500K–$1M',        sellRange: '$100K–$250K', note: 'Medical devices' },
  { ticker: 'CMG',   name: 'Chipotle',             buys: 6,  sells: 0,  buyRange: '$500K–$1M',        sellRange: '—',          note: 'Consumer growth play' },
  { ticker: 'PLTR',  name: 'Palantir',             buys: 2,  sells: 4,  buyRange: '$1M–$5M',          sellRange: '$1M–$5M',    note: '⚠️ Net SELLER — 4 sell lots despite earlier buys' },

  // ── KEY SELLS (no corresponding buy activity) ─────────────────
  { ticker: 'META',  name: 'Meta Platforms',       buys: 0,  sells: 2,  buyRange: '—',                sellRange: '$5M–$25M',   note: '⚠️ Large Feb 10 block sale; position exited' },
  { ticker: 'VIG',   name: 'Vanguard Div Apprectn ETF', buys: 0, sells: 1, buyRange: '—',            sellRange: '$5M–$25M',   note: '⚠️ Large Feb 10 block sale' },
];

// ─── HOLDINGS ────────────────────────────────────────────────
export const HOLDINGS = [
  // ── PUBLIC EQUITY — DJT ───────────────────────────────────
  {
    id: 'djt',
    name: 'Trump Media & Technology Group',
    ticker: 'DJT',
    type: 'stock',
    category: 'Public Equity',
    quantity: 114750000,
    priceSource: 'manual',
    fallbackPrice: 8.00,              // ACTUAL price May 19, 2026 (~$8.00)
    fallbackDate: '2026-05',
    costBasis: 0,
    color: '#C41E3A',
    icon: '📺',
    source: 'SEC Form 4 — Dec 20, 2024 (trust transfer); SEC 13D — Mar 26, 2024',
    sourceUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001858685&type=SC+13D&dateb=&owner=include&count=10',
    notes: 'Shares held via Donald J. Trump Revocable Trust (Donald Trump Jr., sole trustee). 553,176 escrowed shares released Mar 2025. Ownership diluted to ~41.4% as TMTG issued new shares (276.95M outstanding). No sell transactions. TMTG reported $712M net loss in 2025.',
    liquid: true,
    liquidQuantity: 114750000,
    ogeDisclosed: 'DJT shares reported in OGE Form 278 (CY2024 annual, filed June 2025)',
    highlight: true,
  },

  // ── ACTIVE BROKERAGE ACCOUNT ──────────────────────────────
  {
    id: 'brokerage',
    name: 'Active Stock Portfolio (Personal Brokerage)',
    ticker: 'MKTBL',
    type: 'stock',
    category: 'Public Equity',
    quantity: 1,
    priceSource: 'static',
    // Q1 2026: ~$247.7M purchases, ~$159.1M sales; net position estimated ~$400–750M
    // Estimate from 278-T disclosures; exact portfolio value not disclosed
    staticPrice: 500000000,
    costBasis: null,
    color: '#8b1a1a',
    icon: '📊',
    source: 'OGE Form 278-T — May 8, 2026 (Q1 2026: 3,642 trades) + Feb 26, 2026',
    sourceUrl: 'https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/405E4EC4E27BE8D185258DF7002DD1C0/$FILE/Trump,%20Donald%20J.-05.08.2026-278T(2).pdf',
    notes: 'Highly active personal brokerage account disclosed via periodic 278-T filings. Q1 2026: 3,642 equity transactions (~$247.7M buys, ~$159.1M sells) + 69 bond purchases (~$21.4M). Top positions: MSFT, AMZN, NVDA, ORCL, GOOGL, AMD. Contradicts Trump team\'s "blind trust" claims. Portfolio size estimated at $400M–$750M.',
    liquid: true,
    liquidQuantity: 1,
    ogeDisclosed: 'Disclosed via Form 278-T (periodic transaction reports). Annual Form 278 does not itemize all holdings.',
  },

  // ── DIGITAL ASSETS ────────────────────────────────────────
  {
    id: 'trump-meme',
    name: 'TRUMP Memecoin',
    ticker: 'TRUMP',
    type: 'crypto',
    category: 'Digital Assets',
    quantity: 800000000,
    // May 2026: circulating supply ~237M total (of which ~200M was initial + vesting tranches)
    // Insider wallets (CIC Digital + Fight Fight Fight) hold majority of circulating
    liquidQuantity: 237000000,        // ~237M circulating out of 800M team allocation
    coingeckoId: 'official-trump',
    priceSource: 'coingecko',
    costBasis: 0,
    color: '#D4AF37',
    icon: '🪙',
    source: 'On-chain: CIC Digital LLC wallet (Solana)',
    sourceUrl: 'https://solscan.io/token/6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN',
    notes: '80% of 1B TRUMP allocated to Trump entities. Launched Jan 17, 2025. Circulating supply May 2026: ~237M total (23.74% of supply). Still locked: ~762.6M. Apr 2025: 90-day delay applied to major unlock cliffs. May 11, 2026: 7M tokens moved to Bitgo institutional custody (3rd Bitgo transfer, typically precedes selling).',
    liquid: true,
    ogeDisclosed: 'Not yet in OGE annual form (launched Jan 2025; OGE CY2025 form due May 2026)',
  },
  {
    id: 'melania-meme',
    name: 'MELANIA Memecoin',
    ticker: 'MELANIA',
    type: 'crypto',
    category: 'Digital Assets',
    quantity: 300000000,
    liquidQuantity: 75000000,
    coingeckoId: 'melania-meme',
    priceSource: 'coingecko',
    costBasis: 0,
    color: '#A88B6B',
    icon: '👑',
    source: 'On-chain: MKT Foundation wallet (Solana)',
    sourceUrl: 'https://solscan.io/token/FUAfBo2jgks6gB4Z4LfZkqSZgzNucisEHqnNebaRxM1X',
    notes: "30% of 1B MELANIA held by MKT Foundation. Launched Jan 19, 2025. Down ~95%+ from peak.",
    liquid: true,
    ogeDisclosed: 'Not yet in OGE annual form',
  },
  {
    id: 'wlfi',
    name: 'World Liberty Financial (WLFI)',
    ticker: 'WLFI',
    type: 'crypto',
    category: 'Digital Assets',
    quantity: 22500000000,
    liquidQuantity: 0,
    coingeckoId: null,
    priceSource: 'static',
    staticPrice: 0,
    costBasis: 0,
    color: '#1E3A5F',
    icon: '🏛️',
    source: 'OGE Form 278 (CY2024); WLFI White Paper; on-chain governance contract',
    sourceUrl: 'https://worldlibertyfinancial.com',
    notes: 'DT Marks Defi LLC holds 60% of WLFI. Trump family entitled to 75% of net proceeds from token sales ($550M raised → ~$412M to Trump family). USD1 stablecoin: $4.6B circulating (Apr 2026). Jan 2026: UAE Royal Family (Tahnoun bin Zayed) acquired 49% stake for $500M. Apr 2026: Justin Sun lawsuit filed.',
    liquid: false,
    ogeDisclosed: 'DT Marks Defi LLC listed in OGE Form 278. Revenue share classified as income.',
    revenueNote: '75% of WLFI net proceeds (~$412M estimated received, ~$1B total by Dec 2025)',
  },

  // ── PRIVATE BUSINESS ──────────────────────────────────────
  {
    id: 'trump-org',
    name: 'Trump Organization (Private)',
    ticker: 'PRIV',
    type: 'private',
    category: 'Private Business',
    quantity: 1,
    priceSource: 'static',
    staticPrice: 3200000000,
    costBasis: null,
    color: '#8B7355',
    icon: '🏌️',
    source: 'OGE Form 278 (CY2024, filed Jun 2025); Forbes 2025; Bloomberg estimates',
    sourceUrl: 'https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/4EC9A8E6DD078F2985258CA9002C9377/$FILE/Trump,%20Donald%20J.%202025%20Annual%20278.pdf',
    notes: 'Includes Mar-a-Lago Club LLC, golf courses, hotels, Trump Tower, 40 Wall Street, licensing. OGE annual report total disclosed asset range: $1.4B–$2.1B+. Forbes 2025 estimated ~$3.2B in operating business assets.',
    liquid: false,
    ogeAssets: [
      { name: 'Mar-a-Lago Club, Palm Beach FL', ogeValue: '>$50M', estimate: 300000000 },
      { name: 'Trump National Doral, Miami FL', ogeValue: '>$50M', estimate: 300000000 },
      { name: 'Trump Tower (commercial), NYC', ogeValue: '>$50M', estimate: 430000000 },
      { name: '40 Wall Street, NYC', ogeValue: '>$50M', estimate: 160000000 },
      { name: 'Trump International Hotel & Tower, Chicago', ogeValue: '>$50M', estimate: 80000000 },
      { name: 'Trump National Golf Club, Bedminster NJ', ogeValue: '>$50M', estimate: 50000000 },
      { name: 'Trump National Golf Club, Washington DC', ogeValue: '>$50M', estimate: 50000000 },
      { name: 'International Hotels & Licensing (revenue share)', ogeValue: '>$50M', estimate: 130000000 },
      { name: 'Other properties, LLCs, licensing', ogeValue: 'Various', estimate: 1700000000 },
    ],
  },

  // ── LIQUID / CASH ─────────────────────────────────────────
  {
    id: 'cash-mm',
    name: 'Cash & Money Market Funds',
    ticker: 'CASH',
    type: 'cash',
    category: 'Liquid Assets',
    quantity: 1,
    priceSource: 'static',
    staticPrice: 350000000,
    costBasis: null,
    color: '#2d7a4f',
    icon: '💵',
    source: 'OGE Form 278 (CY2024, filed Jun 2025) — Schedule A, Part I',
    sourceUrl: 'https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/4EC9A8E6DD078F2985258CA9002C9377/$FILE/Trump,%20Donald%20J.%202025%20Annual%20278.pdf',
    notes: 'Multiple accounts disclosed in OGE. Each in ">$50M" or "$25M–$50M" bands. Estimate from band midpoints. Includes Goldman Sachs Money Market, Fidelity, JPMorgan accounts.',
    liquid: true,
    liquidQuantity: 1,
    ogeAccounts: [
      { institution: 'Goldman Sachs Money Market', ogeValue: '>$50M', estimate: 100000000 },
      { institution: 'Fidelity Money Market', ogeValue: '>$50M', estimate: 100000000 },
      { institution: 'JPMorgan Chase accounts', ogeValue: '$25M–$50M', estimate: 37500000 },
      { institution: 'Other cash accounts', ogeValue: 'Various', estimate: 112500000 },
    ],
    ogeDisclosed: 'Disclosed in OGE Form 278 annual (CY2024)',
  },
];

export const CATEGORIES = [
  { name: 'Public Equity', color: '#C41E3A' },
  { name: 'Digital Assets', color: '#D4AF37' },
  { name: 'Private Business', color: '#8B7355' },
  { name: 'Liquid Assets', color: '#2d7a4f' },
];
