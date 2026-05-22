import { useState, useEffect, useCallback } from 'react';
import { HOLDINGS } from '../data/holdings';

const COINGECKO_IDS = HOLDINGS
  .filter((h) => h.coingeckoId)
  .map((h) => h.coingeckoId)
  .join(',');

const LS_KEY = 'djt_manual_price';

export function usePrices() {
  const [prices, setPrices] = useState({});
  const [changes, setChanges] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errors, setErrors] = useState({});
  const [djtManual, setDjtManualState] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? parseFloat(saved) : null;
  });

  const setDjtManual = useCallback((price) => {
    setDjtManualState(price);
    if (price !== null) localStorage.setItem(LS_KEY, String(price));
    else localStorage.removeItem(LS_KEY);
  }, []);

  const fetchCryptoPrices = useCallback(async () => {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const data = await res.json();
      const newPrices = {};
      const newChanges = {};
      for (const h of HOLDINGS) {
        if (h.coingeckoId && data[h.coingeckoId]) {
          newPrices[h.id] = data[h.coingeckoId].usd;
          newChanges[h.id] = data[h.coingeckoId].usd_24h_change;
        }
      }
      return { prices: newPrices, changes: newChanges, error: null };
    } catch (e) {
      return { prices: {}, changes: {}, error: e.message };
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const cryptoResult = await fetchCryptoPrices();
    const newPrices = { ...cryptoResult.prices };
    const newChanges = { ...cryptoResult.changes };
    const newErrors = {};

    if (cryptoResult.error) newErrors.crypto = cryptoResult.error;

    // Static assets
    for (const h of HOLDINGS) {
      if (h.priceSource === 'static') {
        newPrices[h.id] = h.staticPrice ?? 0;
        newChanges[h.id] = 0;
      }
    }

    // DJT: manual override → fallback from holdings
    const djtHolding = HOLDINGS.find((h) => h.id === 'djt');
    const currentManual = localStorage.getItem(LS_KEY);
    const djtPrice = currentManual
      ? parseFloat(currentManual)
      : (djtHolding?.fallbackPrice ?? 22.50);
    newPrices['djt'] = djtPrice;
    newPrices['djt_is_manual'] = currentManual !== null;
    newPrices['djt_is_fallback'] = currentManual === null;

    setPrices(newPrices);
    setChanges(newChanges);
    setErrors(newErrors);
    setLastUpdated(new Date());
    setLoading(false);
  }, [fetchCryptoPrices]);

  // Re-run refresh when manual price changes
  useEffect(() => {
    refresh();
  }, [refresh, djtManual]);

  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { prices, changes, loading, lastUpdated, errors, refresh, djtManual, setDjtManual };
}
