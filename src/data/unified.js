// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED DATA LAYER
// Merges portfolioAllocations.js (financial ground truth from all 9 PDFs)
// with stockPositions.js (rich per-ticker metadata + policy analysis).
// All components should import from here — not from the two source files.
// ═══════════════════════════════════════════════════════════════════════════

import { PORTFOLIO_STOCKS, FILING_HISTORY } from './portfolioAllocations';
import { STOCK_POSITIONS, POLICY_EVENTS, Q1_STATS, BAND_MIDPOINTS } from './stockPositions';

// ─── Metadata lookup by ticker ──────────────────────────────────────────────
const META = {};
for (const sp of STOCK_POSITIONS) META[sp.ticker] = sp;

// ─── Derive netStatus from financial net (fallback) ─────────────────────────
function deriveStatus(net, buys, sells, meta) {
  if (meta?.netStatus) return meta.netStatus;
  if (net <= 0) return sells > 0 ? 'EXITING' : 'CLOSED';
  if (buys > 0 && sells > 0) return 'TRIMMING';
  return 'ACCUMULATING';
}

// ─── Build unified position from a PORTFOLIO_STOCKS entry ───────────────────
function enrich(s) {
  const net = s.buy_total - s.sell_total;
  const m = META[s.ticker] ?? null;
  // For buy/sell count: prefer metadata, estimate from totals if missing
  const buysCount  = m?.buys  ?? (s.buy_total  > 0 ? Math.max(1, Math.round(s.buy_total  / 1_500_000)) : 0);
  const sellsCount = m?.sells ?? (s.sell_total > 0 ? Math.max(1, Math.round(s.sell_total / 1_500_000)) : 0);

  return {
    // ── Identity
    ticker:   s.ticker,
    name:     s.name,
    color:    s.color,
    // ── Classification
    sector:    s.sector,
    subsector: m?.subsector ?? s.sector,
    // ── Financial (portfolioAllocations = ground truth)
    buy_total:  s.buy_total,
    sell_total: s.sell_total,
    net,
    ref_price:  s.ref_price,
    // ── Transaction metadata (stockPositions = ground truth for known tickers)
    estimatedBuyTotal:  m ? m.estimatedBuyTotal  : s.buy_total,
    estimatedSellTotal: m ? m.estimatedSellTotal : s.sell_total,
    buys:        buysCount,
    sells:       sellsCount,
    maxBuyBand:  m?.maxBuyBand  ?? null,
    maxSellBand: m?.maxSellBand ?? null,
    netStatus:   deriveStatus(net, buysCount, sellsCount, m),
    // ── Dates & analysis
    keyBuyDates:    m?.keyBuyDates  ?? [],
    keySellDates:   m?.keySellDates ?? [],
    policyEventIds: m?.policyEventIds ?? [],
    analysis:       m?.analysis ?? null,
    flag:           m?.flag     ?? null,
    // ── Links & display
    refPrice:     m?.refPrice     ?? s.ref_price,
    refPriceDate: m?.refPriceDate ?? '2026-05',
    yahooUrl:     m?.yahooUrl ?? `https://finance.yahoo.com/quote/${s.ticker}/`,
  };
}

// ─── ALL POSITIONS (positive net + sellers) ──────────────────────────────────
export const ALL_POSITIONS = PORTFOLIO_STOCKS.map(enrich);

// ─── ALLOCATIONS — positive-net positions with portfolio weights ─────────────
const _positive = ALL_POSITIONS.filter(s => s.net > 0);
const _totalNet  = _positive.reduce((sum, s) => sum + s.net, 0);

export const ALLOCATIONS = _positive
  .map(s => ({ ...s, weight: s.net / _totalNet }))
  .sort((a, b) => b.weight - a.weight);

// ─── NET SELLERS ─────────────────────────────────────────────────────────────
export const NET_SELLERS = ALL_POSITIONS.filter(s => s.net <= 0);

// ─── SECTOR ALLOCATIONS ──────────────────────────────────────────────────────
export const SECTOR_ALLOCATIONS = (() => {
  const map = {};
  for (const a of ALLOCATIONS) {
    const key = a.sector.split('/')[0].trim();
    if (!map[key]) map[key] = { sector: key, weight: 0, net: 0, tickers: [], color: a.color };
    map[key].weight  += a.weight;
    map[key].net     += a.net;
    map[key].tickers.push(a.ticker);
  }
  return Object.values(map).sort((a, b) => b.weight - a.weight);
})();

// ─── TOTALS ──────────────────────────────────────────────────────────────────
export const TOTAL_ESTIMATED_NET  = _totalNet;
export const TOTAL_ESTIMATED_BUY  = ALL_POSITIONS.reduce((s, a) => s + a.buy_total,  0);
export const TOTAL_ESTIMATED_SELL = ALL_POSITIONS.reduce((s, a) => s + a.sell_total, 0);

// ─── RE-EXPORTS (so components only need one import) ─────────────────────────
export { POLICY_EVENTS, Q1_STATS, BAND_MIDPOINTS, FILING_HISTORY };

// Legacy compat for components that use byStatus()
export const byStatus = (status) => ALL_POSITIONS.filter(p => p.netStatus === status);
