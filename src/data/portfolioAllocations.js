// ═══════════════════════════════════════════════════════════════════════════
// TRUMP PORTFOLIO ALLOCATIONS — calcolate da TUTTI i filing 278-T disponibili
//
// Fonte: 9 PDF estratti (Aug 2025 – May 2026). I filing pre-2026 contengono
// principalmente obbligazioni municipali/corporate e treasury bond.
// Le posizioni azionarie sono concentrate nel Q1 2026 (May 8, 2026 filing).
//
// Metodologia:
//  • buy_total / sell_total = somma midpoint fasce OGE per ogni transazione
//  • net = buy_total - sell_total
//  • weight = net / Σ(net positivi) → percentuale portafoglio stimata
//  • I pesi < 0 (net sellers) vengono esclusi dal calcolo delle allocazioni
//
// Prezzi di riferimento: stime maggio 2026 (usati solo per calcolo quote)
// ═══════════════════════════════════════════════════════════════════════════

export const PORTFOLIO_STOCKS = [
  // ── LARGE CAP TECH ──────────────────────────────────────────────────────
  { ticker: 'AMZN', name: 'Amazon.com',          sector: 'Technology',   buy_total: 15_155_000, sell_total:    383_000, ref_price: 186,   color: '#FF9900' },
  { ticker: 'ORCL', name: 'Oracle',              sector: 'Technology',   buy_total:  4_644_000, sell_total:      8_000, ref_price: 168,   color: '#F80000' },
  { ticker: 'NVDA', name: 'Nvidia',              sector: 'Technology',   buy_total:  3_133_000, sell_total:    650_000, ref_price: 115,   color: '#76B900' },
  { ticker: 'ADBE', name: 'Adobe',               sector: 'Technology',   buy_total:  2_737_000, sell_total:          0, ref_price: 375,   color: '#FF0000' },
  { ticker: 'NOW',  name: 'ServiceNow',          sector: 'Technology',   buy_total:  2_247_000, sell_total:          0, ref_price: 110,   color: '#62D84E' }, // 10:1 split post-Jan 2026 (pre-split: 1100)
  { ticker: 'WDAY', name: 'Workday',             sector: 'Technology',   buy_total:  2_247_000, sell_total:          0, ref_price: 230,   color: '#2E9BF5' },
  { ticker: 'AVGO', name: 'Broadcom',            sector: 'Technology',   buy_total:  2_557_000, sell_total:    375_000, ref_price: 230,   color: '#CC0000' },
  { ticker: 'SNPS', name: 'Synopsys',            sector: 'Technology',   buy_total:  2_080_000, sell_total:          0, ref_price: 480,   color: '#6B3FAB' },
  { ticker: 'DELL', name: 'Dell Technologies',   sector: 'Technology',   buy_total:  2_064_000, sell_total:          0, ref_price: 120,   color: '#007DB8' },
  { ticker: 'GOOGL',name: 'Alphabet',            sector: 'Technology',   buy_total:  1_164_000, sell_total:          0, ref_price: 185,   color: '#4285F4' },
  { ticker: 'AMD',  name: 'AMD',                 sector: 'Technology',   buy_total:    996_000, sell_total:      8_000, ref_price: 108,   color: '#ED1C24' },
  { ticker: 'AMAT', name: 'Applied Materials',   sector: 'Technology',   buy_total:    975_000, sell_total:          0, ref_price: 175,   color: '#00558C' },
  { ticker: 'AXON', name: 'Axon Enterprise',     sector: 'Technology',   buy_total:  2_008_000, sell_total:     83_000, ref_price: 620,   color: '#FFC20E' },
  { ticker: 'QCOM', name: 'Qualcomm',            sector: 'Technology',   buy_total:  1_163_000, sell_total:      8_000, ref_price: 165,   color: '#3253DC' },
  { ticker: 'MCHP', name: 'Microchip Technology',sector: 'Technology',   buy_total:  1_332_000, sell_total:          0, ref_price: 60,    color: '#D4A017' },
  // ── ETF ─────────────────────────────────────────────────────────────────
  { ticker: 'SPY',  name: 'SPDR S&P 500 ETF',   sector: 'ETF',          buy_total:  3_300_000, sell_total:          0, ref_price: 560,   color: '#942828' },
  { ticker: 'IWB',  name: 'iShares Russell 1000',sector: 'ETF',          buy_total:  2_650_000, sell_total:          0, ref_price: 270,   color: '#1F5091' },
  { ticker: 'VYM',  name: 'Vanguard High Div ETF',sector:'ETF',          buy_total:  2_000_000, sell_total:          0, ref_price: 135,   color: '#C63428' },
  { ticker: 'IEMG', name: 'iShares MSCI Emerg ETF',sector:'ETF',         buy_total:  1_300_000, sell_total:          0, ref_price: 55,    color: '#1F3C88' },
  { ticker: 'IAU',  name: 'iShares Gold Trust',  sector: 'ETF / Gold',   buy_total:    825_000, sell_total:          0, ref_price: 45,    color: '#C9A84C' },
  // ── CONSUMER & RETAIL ───────────────────────────────────────────────────
  { ticker: 'COST', name: 'Costco',              sector: 'Consumer',     buy_total:  2_773_000, sell_total:          0, ref_price: 980,   color: '#005DAA' },
  { ticker: 'DIS',  name: 'Disney',              sector: 'Consumer',     buy_total:  2_327_000, sell_total:    175_000, ref_price: 95,    color: '#113CCF' },
  { ticker: 'BKNG', name: 'Booking Holdings',    sector: 'Consumer',     buy_total:  1_366_000, sell_total:          0, ref_price: 167,   color: '#003580' }, // 30:1 split post-Jan 2026 (pre-split: 5000)
  { ticker: 'HD',   name: 'Home Depot',          sector: 'Consumer',     buy_total:  1_163_000, sell_total:          0, ref_price: 380,   color: '#F96302' },
  { ticker: 'WMT',  name: 'Walmart',             sector: 'Consumer',     buy_total:  1_180_000, sell_total:     32_000, ref_price: 95,    color: '#007DC6' },
  { ticker: 'DASH', name: 'DoorDash',            sector: 'Consumer',     buy_total:    872_000, sell_total:          0, ref_price: 185,   color: '#FF3008' },
  { ticker: 'CMG',  name: 'Chipotle',            sector: 'Consumer',     buy_total:    806_000, sell_total:          0, ref_price: 52,    color: '#441500' },
  { ticker: 'CHD',  name: 'Church & Dwight',     sector: 'Consumer',     buy_total:    833_000, sell_total:          0, ref_price: 120,   color: '#003087' },
  // ── HEALTHCARE ──────────────────────────────────────────────────────────
  { ticker: 'UNH',  name: 'UnitedHealth Group',  sector: 'Healthcare',   buy_total:  2_238_000, sell_total:      8_000, ref_price: 310,   color: '#0065BD' },
  { ticker: 'BSX',  name: 'Boston Scientific',   sector: 'Healthcare',   buy_total:    924_000, sell_total:          0, ref_price: 100,   color: '#C41E3A' },
  // ── INDUSTRIALS / DEFENSE ───────────────────────────────────────────────
  { ticker: 'MSI',  name: 'Motorola Solutions',  sector: 'Industrials',  buy_total:  2_358_000, sell_total:          0, ref_price: 440,   color: '#009EDB' },
  { ticker: 'TDG',  name: 'TransDigm Group',     sector: 'Industrials',  buy_total:  2_000_000, sell_total:          0, ref_price: 1_300, color: '#1F3C88' },
  { ticker: 'BA',   name: 'Boeing',              sector: 'Industrials',  buy_total:  2_040_000, sell_total:    658_000, ref_price: 200,   color: '#004F9F' },
  { ticker: 'TXN',  name: 'Texas Instruments',   sector: 'Industrials',  buy_total:  2_147_000, sell_total:          0, ref_price: 210,   color: '#C41230' },
  { ticker: 'EME',  name: 'EMCOR Group',         sector: 'Industrials',  buy_total:  1_332_000, sell_total:          0, ref_price: 350,   color: '#003087' },
  { ticker: 'HBAN', name: 'Huntington Bancshares',sector:'Financials',   buy_total:  1_200_000, sell_total:          0, ref_price: 16,    color: '#006747' },
  // ── MEDIA & STREAMING ───────────────────────────────────────────────────
  { ticker: 'NFLX', name: 'Netflix',             sector: 'Media',        buy_total:  2_772_000, sell_total:    450_000, ref_price: 105,   color: '#E50914' }, // 10:1 split post-Jan 2026 (pre-split: 1050)
  { ticker: 'APP',  name: 'AppLovin',            sector: 'Media / AdTech',buy_total: 856_000, sell_total:          0, ref_price: 380,   color: '#000000' },
  // ── FINANCIALS ──────────────────────────────────────────────────────────
  { ticker: 'SNOXX',  name: 'Schwab Govt Money Fund', sector: 'Financials / Cash', buy_total: 2_016_000, sell_total: 8_000, ref_price: 1, color: '#1A6297' },
  { ticker: 'LII',  name: 'Lennox International',sector: 'Industrials',  buy_total:    900_000, sell_total:          0, ref_price: 450,   color: '#C41E3A' },
  // ── NET SELLERS (excluded from weight calc, shown separately) ──────────
  { ticker: 'MSFT', name: 'Microsoft',           sector: 'Technology',   buy_total: 10_400_000, sell_total: 36_000_000, ref_price: 425,   color: '#00A4EF' },
  { ticker: 'META', name: 'Meta Platforms',      sector: 'Technology',   buy_total:  1_363_000, sell_total: 24_375_000, ref_price: 590,   color: '#0866FF' },
  { ticker: 'PLTR', name: 'Palantir',            sector: 'Technology',   buy_total:  4_000_000, sell_total:  8_000_000, ref_price: 120,   color: '#000000' },
  { ticker: 'VIG',  name: 'Vanguard Div Apprec ETF', sector: 'ETF',     buy_total:          0, sell_total: 12_000_000, ref_price: 195,   color: '#942828' },
  { ticker: 'ACN',  name: 'Accenture',           sector: 'Technology',   buy_total:  5_200_000, sell_total:  8_000_000, ref_price: 290,   color: '#A100FF' },
];

// ─── COMPUTED PORTFOLIO WEIGHTS ────────────────────────────────────────────
export const ALLOCATIONS = (() => {
  const withNet = PORTFOLIO_STOCKS.map(s => ({
    ...s,
    net: s.buy_total - s.sell_total,
  }));

  // Only include stocks with positive net (accumulating or trimming but still net positive)
  const positive = withNet.filter(s => s.net > 0);
  const totalNet = positive.reduce((sum, s) => sum + s.net, 0);

  return positive
    .map(s => ({ ...s, weight: s.net / totalNet }))
    .sort((a, b) => b.weight - a.weight);
})();

export const NET_SELLERS = PORTFOLIO_STOCKS.filter(s => (s.buy_total - s.sell_total) <= 0);

export const TOTAL_ESTIMATED_NET = ALLOCATIONS.reduce((s, a) => s + a.net, 0);
export const TOTAL_ESTIMATED_BUY = PORTFOLIO_STOCKS.reduce((s, a) => s + a.buy_total, 0);
export const TOTAL_ESTIMATED_SELL = PORTFOLIO_STOCKS.reduce((s, a) => s + a.sell_total, 0);

// Sector groupings for pie chart
export const SECTOR_ALLOCATIONS = (() => {
  const sectors = {};
  for (const a of ALLOCATIONS) {
    const s = a.sector.split('/')[0].trim();
    if (!sectors[s]) sectors[s] = { sector: s, weight: 0, tickers: [], color: a.color };
    sectors[s].weight += a.weight;
    sectors[s].tickers.push(a.ticker);
  }
  return Object.values(sectors).sort((a, b) => b.weight - a.weight);
})();

// Filing history for context
export const FILING_HISTORY = [
  { date: '2025-08-12', label: 'Aug 12, 2025', type: 'amended', note: 'AMENDED — primarily bond transactions (encoded, partially unreadable)', url: null },
  { date: '2025-09-03', label: 'Sep 3, 2025',  type: 'bonds',   note: 'Municipal bond purchases only — no equity transactions', url: null },
  { date: '2025-10-20', label: 'Oct 20, 2025', type: 'bonds',   note: 'Primarily bond transactions', url: null },
  { date: '2025-11-14', label: 'Nov 14, 2025', type: 'bonds',   note: 'Municipal bond purchases', url: null },
  { date: '2025-12-18', label: 'Dec 18, 2025', type: 'mixed',   note: '2 equity transactions confirmed', url: null },
  { date: '2026-01-14', label: 'Jan 14, 2026', type: 'mixed',   note: '4 equity transactions — early Q1 2026 buying begins', url: null },
  { date: '2026-02-26', label: 'Feb 26, 2026', type: 'equity',  note: '8 equity transactions — Feb 10 block sales (MSFT, META, VIG) filed', url: 'https://www.whitehouse.gov/wp-content/uploads/2026/03/President-Donald-J.-Trump-Periodic-Transaction-Report-2.26.26-1.pdf' },
  { date: '2026-04-20', label: 'Apr 20, 2026', type: 'equity',  note: '12 equity transactions — Q1 continuation', url: null },
  { date: '2026-05-08', label: 'May 8, 2026',  type: 'equity',  note: '3,642 equity + 69 bond transactions covering Jan 6–Mar 30, 2026. Filed late, fees paid.', url: 'https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/405E4EC4E27BE8D185258DF7002DD1C0/$FILE/Trump,%20Donald%20J.-05.08.2026-278T(2).pdf' },
];
