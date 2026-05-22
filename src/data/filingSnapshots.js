// ═══════════════════════════════════════════════════════════════════════════
// FILING SNAPSHOTS — cumulative disclosed net exposure per sector at each
// of the 9 OGE 278-T filing dates.
//
// Key narrative: the Feb 26 filing revealed only the Feb 10 BLOCK SELLS
// (MSFT, META, VIG). The massive Q1 buys (AMZN, ORCL, ADBE, etc.) were
// NOT disclosed until the late May 8 filing — creating a dramatic reversal
// in the public picture of Trump's portfolio.
//
// Values in $M (net = buys - sells, can be negative). Estimates based on
// known filing notes and OGE band midpoints.
// ═══════════════════════════════════════════════════════════════════════════

// Sector colors (consistent with PortfolioComposition)
export const SECTOR_COLORS = {
  Technology:   '#6366f1',
  ETF:          '#0ea5e9',
  Consumer:     '#f59e0b',
  Industrials:  '#8b5cf6',
  Media:        '#ec4899',
  Healthcare:   '#10b981',
  Financials:   '#14b8a6',
};

export const SECTORS = Object.keys(SECTOR_COLORS);

// Each snapshot = disclosed cumulative net at that date (not incremental)
export const FILING_SNAPSHOTS = [
  {
    date: '2025-08-12',
    label: 'Aug 12',
    type: 'bonds',
    note: 'AMENDED — bond transactions only',
    net: { Technology: 0,     ETF: 0,   Consumer: 0,   Industrials: 0,   Media: 0, Healthcare: 0, Financials: 0 },
  },
  {
    date: '2025-09-03',
    label: 'Sep 3',
    type: 'bonds',
    note: 'Municipal bond purchases only',
    net: { Technology: 0,     ETF: 0,   Consumer: 0,   Industrials: 0,   Media: 0, Healthcare: 0, Financials: 0 },
  },
  {
    date: '2025-10-20',
    label: 'Oct 20',
    type: 'bonds',
    note: 'Primarily bond transactions',
    net: { Technology: 0,     ETF: 0,   Consumer: 0,   Industrials: 0,   Media: 0, Healthcare: 0, Financials: 0 },
  },
  {
    date: '2025-11-14',
    label: 'Nov 14',
    type: 'bonds',
    note: 'Municipal bond purchases only',
    net: { Technology: 0,     ETF: 0,   Consumer: 0,   Industrials: 0,   Media: 0, Healthcare: 0, Financials: 0 },
  },
  {
    date: '2025-12-18',
    label: 'Dec 18',
    type: 'mixed',
    note: '2 equity transactions confirmed',
    net: { Technology: 0.5,   ETF: 0,   Consumer: 0.3, Industrials: 0,   Media: 0, Healthcare: 0, Financials: 0 },
  },
  {
    date: '2026-01-14',
    label: 'Jan 14',
    type: 'mixed',
    note: '4 equity transactions — early Q1 buying begins',
    net: { Technology: 2.1,   ETF: 0,   Consumer: 0.8, Industrials: 0.5, Media: 0, Healthcare: 0, Financials: 0 },
  },
  {
    date: '2026-02-26',
    label: 'Feb 26',
    type: 'equity',
    note: 'Feb 10 block SELLS disclosed: MSFT (3×$5M–$25M), META (2×$5M–$25M), VIG ($5M–$25M). Buys NOT yet filed.',
    // MSFT net: -25.6M, META: -23M, VIG: -12M, PLTR early: -4M, ACN: -2.8M
    // Small existing buys from Q1 start partially offset
    net: { Technology: -49.8, ETF: -12,  Consumer: 0.8, Industrials: 0.5, Media: 0, Healthcare: 0, Financials: 0 },
  },
  {
    date: '2026-04-20',
    label: 'Apr 20',
    type: 'equity',
    note: '12 additional equity transactions — Q1 accumulation continues (still incomplete)',
    // Some buys trickling in (ORCL, AMZN partial, UNH partial) → partial offset of sells
    net: { Technology: -35,   ETF: -9,   Consumer: 4.2, Industrials: 2.1, Media: 1.5, Healthcare: 1.2, Financials: 0.5 },
  },
  {
    date: '2026-05-08',
    label: 'May 8',
    type: 'equity',
    note: '3,642 equity transactions (Jan 6 – Mar 30) fully disclosed. Filed late.',
    // Final computed from SECTOR_ALLOCATIONS (net including sellers):
    // Tech: +43.5M (buys) -55.4M (MSFT+PLTR+ACN+META sells) = -11.9M
    // ETF:  +17.9M (buys) -12M (VIG sell) = +5.9M
    net: { Technology: -11.9, ETF: 5.9,  Consumer: 11.8, Industrials: 6.9, Media: 2.7, Healthcare: 2.2, Financials: 1.7 },
  },
];
