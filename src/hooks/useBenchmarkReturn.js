import { useState, useEffect } from 'react';
import { fetchHistory } from './useHistoricalPrices';

// Jan 6, 2026 = first Trump trade date = our baseline
const BASE_DATE = '2026-01-06';
const TTL       = 30 * 60 * 1000;

let _cache   = null;
let _cacheTs = 0;

/**
 * Returns SPY and QQQ returns from Jan 6, 2026 to today.
 * {
 *   spy: { base, current, returnPct },
 *   qqq: { base, current, returnPct },
 * }
 */
export function useBenchmarkReturn() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (_cache && Date.now() - _cacheTs < TTL) { setData(_cache); return; }
    setLoading(true);

    Promise.all([
      fetchHistory('SPY', '6mo'),
      fetchHistory('QQQ', '6mo'),
    ])
      .then(([spy, qqq]) => {
        const findBase = (history) => {
          // Find first price at or after BASE_DATE
          const hit = history.find(d => d.iso >= BASE_DATE);
          return hit ?? history[0];
        };

        const spyBase = findBase(spy);
        const qqqBase = findBase(qqq);
        const spyLast = spy[spy.length - 1];
        const qqqLast = qqq[qqq.length - 1];

        const result = {
          spy: {
            base:      spyBase.price,
            current:   spyLast.price,
            returnPct: (spyLast.price / spyBase.price - 1) * 100,
            baseDate:  spyBase.iso,
            lastDate:  spyLast.iso,
          },
          qqq: {
            base:      qqqBase.price,
            current:   qqqLast.price,
            returnPct: (qqqLast.price / qqqBase.price - 1) * 100,
            baseDate:  qqqBase.iso,
            lastDate:  qqqLast.iso,
          },
        };

        _cache   = result;
        _cacheTs = Date.now();
        setData(result);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
