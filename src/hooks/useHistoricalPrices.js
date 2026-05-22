import { useState, useEffect, useCallback } from 'react';

// Module-level cache: ticker:range → { data, ts }
const _cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// Raw fetcher — exported for batch use (equity curve hook)
export async function fetchHistory(ticker, range = '1y') {
  const url = `/api/yf/v8/finance/chart/${ticker}?interval=1d&range=${range}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No data');
  const { timestamp, indicators } = result;
  const closes = indicators.quote[0].close;
  return timestamp.map((ts, i) => ({
    date: new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    iso:  new Date(ts * 1000).toISOString().slice(0, 10),
    price: closes[i] != null ? +closes[i].toFixed(2) : null,
    ts,
  })).filter(d => d.price != null);
}

export function useHistoricalPrices(ticker, range = '1y') {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!ticker) return;
    const key = `${ticker}:${range}`;
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const d = await fetchHistory(ticker, range);
      _cache.set(key, { data: d, ts: Date.now() });
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [ticker, range]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}
