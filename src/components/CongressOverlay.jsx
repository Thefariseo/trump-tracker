// Congressional trade data from House Stock Watcher
// Fetches from the public S3 dataset via Vite/Vercel proxy

import { useState, useEffect } from 'react';

const PROXY_URL = '/api/congress-data';
const FALLBACK  = 'https://house-stock-watcher-data.s3-us-east-2.amazonaws.com/data/all_transactions.json';
const SINCE     = '2026-01-01';

// Module-level cache (full dataset, shared across ticker instances)
let _allData   = null;
let _dataTs    = 0;
const TTL      = 60 * 60 * 1000; // 1 hour

async function loadCongressData() {
  if (_allData && Date.now() - _dataTs < TTL) return _allData;
  const res = await fetch(PROXY_URL, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  // Normalize to array
  _allData = Array.isArray(json) ? json : json.data ?? json.transactions ?? [];
  _dataTs  = Date.now();
  return _allData;
}

function typeColor(type) {
  if (!type) return '#888';
  const t = type.toLowerCase();
  if (t.includes('purchase') || t.includes('buy')) return '#22c55e';
  if (t.includes('sale') || t.includes('sell'))    return '#ef4444';
  return '#888';
}

function amtLabel(amount) {
  if (!amount) return '—';
  return amount.replace(/\$(\d+),(\d+)\s*-\s*\$(\d+),(\d+)/, (_, a, b, c, d) =>
    `$${Number(a + b).toLocaleString()} – $${Number(c + d).toLocaleString()}`
  );
}

export default function CongressOverlay({ ticker }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    loadCongressData()
      .then(all => {
        const filtered = all
          .filter(t =>
            t.ticker === ticker &&
            t.transaction_date >= SINCE
          )
          .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
          .slice(0, 30);
        setData(filtered);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-[#333] py-4">
        <span className="animate-spin">↻</span> Caricamento dati Congressional trades…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[10px] text-[#333] py-2">
        Dati Congresso non disponibili (CORS/API). Fonte: house-stock-watcher-data.s3.
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-[10px] text-[#444] py-2">
        Nessun trade parlamentare trovato per {ticker} dal {SINCE}.
      </div>
    );
  }

  return (
    <div>
      <div className="text-[9px] text-[#333] mb-2">
        {data.length} trade parlamentari trovati per {ticker} · 2026 · House of Representatives
      </div>
      <div className="space-y-1">
        {data.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-1.5 border-b border-[#141414] last:border-0"
          >
            <span className="text-[10px] font-mono text-[#555] w-20 flex-shrink-0">
              {t.transaction_date}
            </span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                color: typeColor(t.type),
                background: `${typeColor(t.type)}18`,
                border: `1px solid ${typeColor(t.type)}30`,
              }}
            >
              {t.type?.toUpperCase().slice(0, 4) ?? '—'}
            </span>
            <span className="text-[10px] text-[#777] flex-1 truncate">{t.representative}</span>
            <span className="text-[10px] font-mono text-[#555] flex-shrink-0">
              {amtLabel(t.amount)}
            </span>
          </div>
        ))}
      </div>
      <div className="text-[8px] text-[#1e1e1e] mt-2">
        Fonte: House Stock Watcher / efts.senate.gov — dati di disclosure parlamentare
      </div>
    </div>
  );
}
