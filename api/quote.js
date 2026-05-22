// GET /api/quote?symbols=AMZN,ORCL,SPY
// Returns { quoteResponse: { result: [{ symbol, regularMarketPrice, regularMarketChangePercent }] } }
//
// Primary: stooq.com batch CSV — no auth, no crumb, works from any server IP.
// Stooq returns last trading day OHLCV. Change% = intraday (close vs open).
// Fallback: 503 with empty result (graceful degradation).

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'text/plain, text/csv, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ─── Stooq helpers ─────────────────────────────────────────────────────────────

/** Convert "AMZN" → "amzn.us", "BRK/B" → "brk-b.us" */
function toStooq(sym) {
  return sym.replace('/', '-').toLowerCase() + '.us';
}

/** Convert "AMZN.US" → "AMZN", "BRK-B.US" → "BRK/B" */
function fromStooq(sym) {
  return sym.replace(/\.US$/i, '').replace('-', '/').toUpperCase();
}

/** Parse stooq CSV → quoteResponse result array */
function parseStooqCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const result = [];
  for (const line of lines.slice(1)) {
    const parts = line.split(',');
    if (parts.length < 7) continue;
    const [sym, , , open, , , close] = parts;
    const closePrice = parseFloat(close);
    const openPrice  = parseFloat(open);
    // N/D = no data (e.g. money market funds)
    if (!closePrice || isNaN(closePrice) || closePrice <= 0) continue;
    const changePercent = openPrice > 0
      ? ((closePrice - openPrice) / openPrice) * 100
      : 0;
    result.push({
      symbol:                     fromStooq(sym),
      regularMarketPrice:         +closePrice.toFixed(4),
      regularMarketChangePercent: +changePercent.toFixed(4),
    });
  }
  return result;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  const tickers = symbols.split(',').map(s => s.trim()).filter(Boolean);
  const stooqQuery = tickers.map(toStooq).join('+');

  try {
    const url = `https://stooq.com/q/l/?s=${stooqQuery}&f=sd2t2ohlcv&h&e=csv`;
    const r = await fetch(url, {
      headers: HEADERS,
      signal:  AbortSignal.timeout(6_000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    const result = parseStooqCSV(text);
    if (result.length === 0) throw new Error('empty result from stooq');

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ quoteResponse: { result, error: null } });
  } catch (e) {
    console.error('[quote] stooq failed:', e.message);
  }

  return res.status(503).json({
    error:         'Price data unavailable — try again shortly',
    quoteResponse: { result: [], error: 'unavailable' },
  });
}
