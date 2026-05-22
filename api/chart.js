// GET /api/chart?ticker=AMZN&interval=1d&range=6mo
// Returns Yahoo Finance v8/chart-compatible JSON so the frontend needs no changes.
//
// Strategy:
//  1. Yahoo Finance v8/chart (query1 + query2 raced in parallel, 6s timeout)
//  2. NASDAQ public API  (no auth; tries assetclass=stocks then etf)
//  Both sources are converted to the same response shape.

const YF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin':          'https://finance.yahoo.com',
  'Referer':         'https://finance.yahoo.com/',
};

const NASDAQ_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert range string → ISO fromdate string (today minus N days) */
function rangeToFromDate(range) {
  const days = { '5d': 8, '1mo': 35, '3mo': 95, '6mo': 185, '1y': 370, '2y': 740 };
  const d = days[range] ?? 185;
  const from = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
  return from.toISOString().slice(0, 10);
}

/** "05/21/2026" → Unix timestamp at noon UTC */
function nasdaqDateToTs(dateStr) {
  const [mm, dd, yyyy] = dateStr.split('/');
  return Math.floor(
    new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T12:00:00Z`).getTime() / 1000,
  );
}

function parsePrice(str) {
  if (!str) return null;
  const n = parseFloat(str.replace(/[$,]/g, ''));
  return isNaN(n) ? null : n;
}

/** Convert NASDAQ tradesTable rows → Yahoo Finance v8/chart format */
function nasdaqToYahooChart(ticker, rows) {
  // Rows are newest-first → reverse to ascending
  const sorted = [...rows].reverse();
  const timestamps = [], closes = [], opens = [], highs = [], lows = [], volumes = [];
  for (const row of sorted) {
    const close = parsePrice(row.close);
    if (!close) continue;
    timestamps.push(nasdaqDateToTs(row.date));
    closes.push(close);
    opens.push(parsePrice(row.open));
    highs.push(parsePrice(row.high));
    lows.push(parsePrice(row.low));
    volumes.push(parseInt((row.volume ?? '0').replace(/,/g, ''), 10) || 0);
  }
  return {
    chart: {
      result: [{
        meta: { symbol: ticker.toUpperCase(), currency: 'USD', exchangeTimezoneName: 'America/New_York' },
        timestamp: timestamps,
        indicators: { quote: [{ close: closes, open: opens, high: highs, low: lows, volume: volumes }] },
      }],
      error: null,
    },
  };
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/** Race Yahoo Finance query1 + query2 in parallel; returns first 200 JSON. */
async function fetchYahoo(ticker, interval, range) {
  const path = `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
  const results = await Promise.allSettled(
    ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'].map(async (base) => {
      const r = await fetch(base + path, { headers: YF_HEADERS, signal: AbortSignal.timeout(6_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }),
  );
  for (const res of results) {
    if (res.status === 'fulfilled') return res.value;
  }
  throw new Error(results.map(r => r.reason?.message ?? 'unknown').join(' | '));
}

/** Fetch from NASDAQ public API; tries stocks then etf asset class. */
async function fetchNasdaq(ticker, range) {
  const fromDate = rangeToFromDate(range);
  const toDate   = new Date().toISOString().slice(0, 10);
  for (const cls of ['stocks', 'etf']) {
    try {
      const url =
        `https://api.nasdaq.com/api/quote/${encodeURIComponent(ticker.toUpperCase())}/historical` +
        `?assetclass=${cls}&fromdate=${fromDate}&limit=500&todate=${toDate}&type=1`;
      const r = await fetch(url, { headers: NASDAQ_HEADERS, signal: AbortSignal.timeout(7_000) });
      if (!r.ok) continue;
      const json = await r.json();
      const rows = json?.data?.tradesTable?.rows;
      if (rows?.length > 0) return nasdaqToYahooChart(ticker, rows);
    } catch { /* try next class */ }
  }
  throw new Error('NASDAQ API failed for all asset classes');
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const { ticker, interval = '1d', range = '6mo' } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  // ── Attempt 1: Yahoo Finance (fast when not rate-limited) ─────────────────
  try {
    const json = await fetchYahoo(ticker, interval, range);
    if (json?.chart?.result?.[0]?.timestamp?.length) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      return res.status(200).json(json);
    }
  } catch (e) {
    console.warn('[chart] Yahoo failed:', e.message);
  }

  // ── Attempt 2: NASDAQ public API ──────────────────────────────────────────
  try {
    const json = await fetchNasdaq(ticker, range);
    if (json?.chart?.result?.[0]?.timestamp?.length) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      return res.status(200).json(json);
    }
  } catch (e) {
    console.warn('[chart] NASDAQ failed:', e.message);
  }

  // ── All attempts failed ───────────────────────────────────────────────────
  console.error('[chart] all sources failed for', ticker);
  return res.status(502).json({ error: 'Historical data unavailable' });
}
