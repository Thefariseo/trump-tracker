import { useState, useEffect, useCallback } from 'react';
import { ALLOCATIONS } from '../data/unified';

const LIVE_TICKERS = ALLOCATIONS
  .filter(s => s.ref_price > 1 && !s.ticker.includes('_'))
  .slice(0, 30)
  .map(s => s.ticker);

const CACHE_TTL = 5 * 60 * 1000;
let _cache = null;
let _cacheTs = 0;

async function fetchQuotes(tickers) {
  const symbols = tickers.join(',');
  const url = `/api/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChangePercent`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
  if (!res.ok) throw new Error(`quote ${res.status}`);
  const json = await res.json();
  const result = {};
  for (const q of json?.quoteResponse?.result ?? []) {
    if (q.regularMarketPrice != null) {
      result[q.symbol] = { price: q.regularMarketPrice, change: q.regularMarketChangePercent ?? null };
    }
  }
  return result;
}

export function useStockPrices() {
  const [prices,  setPrices]  = useState({});
  const [changes, setChanges] = useState({});
  const [live,    setLive]    = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
      setPrices(_cache.prices); setChanges(_cache.changes); setLive(true); return;
    }
    setLoading(true);
    try {
      const data = await fetchQuotes(LIVE_TICKERS);
      const p = {}, c = {};
      for (const [sym, v] of Object.entries(data)) { p[sym] = v.price; c[sym] = v.change; }
      _cache = { prices: p, changes: c }; _cacheTs = Date.now();
      setPrices(p); setChanges(c); setLive(Object.keys(p).length > 0);
    } catch {
      setLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); const iv = setInterval(refresh, CACHE_TTL); return () => clearInterval(iv); }, [refresh]);
  return { prices, changes, live, loading, refresh };
}
