// GET /api/chart?ticker=AMZN&interval=1d&range=6mo
// Proxies Yahoo Finance v8/chart server-to-server (no CORS, no crumb needed).
// Both query1 and query2 are tried in parallel; first success wins.

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin':          'https://finance.yahoo.com',
  'Referer':         'https://finance.yahoo.com/',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const { ticker, interval = '1d', range = '6mo' } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  const path = `/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;

  // Race query1 and query2 in parallel — first 200 wins, no sequential waiting
  const results = await Promise.allSettled([
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ].map(async (base) => {
    const r = await fetch(base + path, {
      headers: HEADERS,
      signal:  AbortSignal.timeout(7_000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }));

  for (const result of results) {
    if (result.status === 'fulfilled') {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      return res.status(200).json(result.value);
    }
  }

  const errors = results.map(r => r.reason?.message ?? 'unknown').join(' | ');
  console.error('[chart] all servers failed:', errors);
  return res.status(502).json({ error: 'Yahoo Finance unavailable' });
}
