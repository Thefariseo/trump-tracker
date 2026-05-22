import { useState, useEffect } from 'react';
import { ALLOCATIONS } from '../data/unified';
import { fetchHistory } from './useHistoricalPrices';

// Fetch top N positions + SPY + QQQ and compute a weighted portfolio curve
const TOP_N      = 12;
const BENCHMARKS = ['SPY', 'QQQ'];
const BASE_DATE  = '2026-01-06'; // first Trump buy date in Q1

let _cache   = null;
let _cacheTs = 0;
const TTL = 30 * 60 * 1000;

export function useEquityCurve() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    async function compute() {
      if (_cache && Date.now() - _cacheTs < TTL) { setData(_cache); return; }
      setLoading(true);
      try {
        // Top positions by weight (skip MMF / synthetic tickers)
        const topPos = ALLOCATIONS
          .filter(a => a.ref_price > 1 && !a.ticker.includes('_'))
          .slice(0, TOP_N);

        const posMap = Object.fromEntries(topPos.map(a => [a.ticker, a]));
        const benchSet = new Set(BENCHMARKS.filter(b => !posMap[b]));

        const allTickers = [...topPos.map(a => a.ticker), ...benchSet];

        // Fetch all price histories in parallel (6mo captures Jan–May 2026)
        const results = await Promise.allSettled(
          allTickers.map(t => fetchHistory(t, '6mo'))
        );

        // Build price maps: ticker → {iso: price}
        const priceMaps = {};
        allTickers.forEach((ticker, i) => {
          if (results[i].status === 'fulfilled') {
            priceMaps[ticker] = Object.fromEntries(
              results[i].value.map(d => [d.iso, d.price])
            );
          }
        });

        // Find base price for each ticker (nearest date ≥ BASE_DATE)
        const basePrices = {};
        for (const ticker of allTickers) {
          const pm = priceMaps[ticker];
          if (!pm) continue;
          const dates = Object.keys(pm).sort();
          const bd = dates.find(d => d >= BASE_DATE) ?? dates[0];
          basePrices[ticker] = pm[bd];
        }

        // Collect all dates from BASE_DATE onwards (union of portfolio ticker dates)
        const dateSet = new Set();
        topPos.forEach(p => {
          const pm = priceMaps[p.ticker];
          if (pm) Object.keys(pm).filter(d => d >= BASE_DATE).forEach(d => dateSet.add(d));
        });
        const sortedDates = [...dateSet].sort();

        // Fill-forward last known price and build curve
        const lastP = {};
        const curveData = [];
        // Sum of all top position weights (subset may not add to 1)
        const totalWeight = topPos.reduce((s, p) => s + p.weight, 0);

        for (const date of sortedDates) {
          // Portfolio
          let portSum = 0, portW = 0;
          for (const pos of topPos) {
            const t = pos.ticker;
            const pm = priceMaps[t];
            if (!pm || !basePrices[t]) continue;
            const price = pm[date] ?? lastP[t];
            if (price == null) continue;
            lastP[t] = price;
            const norm = (price / basePrices[t]) * 100;
            portSum += (pos.weight / totalWeight) * norm;
            portW   += pos.weight / totalWeight;
          }

          // Benchmarks
          const getBench = (sym) => {
            const pm = priceMaps[sym];
            const bp = basePrices[sym];
            if (!pm || !bp) return null;
            const p = pm[date] ?? lastP[sym];
            if (p == null) return null;
            lastP[sym] = p;
            return +(p / bp * 100).toFixed(2);
          };

          curveData.push({
            date,
            label: new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            portfolio: portW > 0 ? +(portSum / portW).toFixed(2) : null,
            spy: getBench('SPY'),
            qqq: getBench('QQQ'),
          });
        }

        _cache   = curveData;
        _cacheTs = Date.now();
        setData(curveData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    compute();
  }, []);

  return { data, loading, error };
}
