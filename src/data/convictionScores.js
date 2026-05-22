// ═══════════════════════════════════════════════════════════════════════
// CONVICTION SCORE — 0–100 algorithm
//
// Measures how "convicted" a buy signal appears given:
//   • Number of buy transactions (breadth)
//   • Max buy band size (size conviction)
//   • Clean buy record (no sell penalty)
//
// Score = (buys_pct × 35) + (band_rank × 35) + (no-sell bonus 20) − (sell_drag max 20)
// All components clamped to range, final score clamped 0–100.
// ═══════════════════════════════════════════════════════════════════════

import { ALLOCATIONS } from './unified';

const BAND_RANKS = {
  '$1K–$15K':    1,
  '$15K–$50K':   2,
  '$50K–$100K':  3,
  '$100K–$250K': 4,
  '$250K–$500K': 5,
  '$500K–$1M':   6,
  '$1M–$5M':     7,
  '$5M–$25M':    8,
  '$25M–$50M':   9,
};

const MAX_BAND = 9;

function computeScore(position, maxBuys) {
  const { buys, sells, maxBuyBand } = position;

  const buysPct     = maxBuys > 0 ? buys / maxBuys : 0;
  const buysPoints  = Math.round(buysPct * 35);

  const bandRank    = BAND_RANKS[maxBuyBand] ?? 0;
  const bandPoints  = Math.round((bandRank / MAX_BAND) * 35);

  const noSellBonus = sells === 0 ? 20 : 0;
  const sellDrag    = Math.min(sells * 3, 20);

  const raw = buysPoints + bandPoints + noSellBonus - sellDrag;
  return Math.max(0, Math.min(100, raw));
}

function getLabel(score) {
  if (score >= 80) return { text: 'ULTRA HIGH',   color: '#22c55e' };
  if (score >= 65) return { text: 'HIGH',          color: '#86efac' };
  if (score >= 45) return { text: 'MEDIUM',        color: '#D4AF37' };
  if (score >= 25) return { text: 'LOW',           color: '#f97316' };
  return               { text: 'MINIMAL',        color: '#6b7280' };
}

// Pre-compute scores for all positive-net allocations
const maxBuys = Math.max(...ALLOCATIONS.map(a => a.buys ?? 0), 1);

export const CONVICTION_SCORES = ALLOCATIONS.map(pos => {
  const score = computeScore(pos, maxBuys);
  const label = getLabel(score);
  return {
    ticker:  pos.ticker,
    name:    pos.name,
    color:   pos.color,
    sector:  pos.sector,
    score,
    label:   label.text,
    labelColor: label.color,
    breakdown: {
      buys:      pos.buys,
      band:      pos.maxBuyBand ?? '—',
      sells:     pos.sells,
      weight:    pos.weight,
    },
  };
}).sort((a, b) => b.score - a.score);

// Quick lookup by ticker
export const CONVICTION_BY_TICKER = Object.fromEntries(
  CONVICTION_SCORES.map(c => [c.ticker, c])
);
