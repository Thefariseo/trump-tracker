/**
 * Vercel serverless proxy for Yahoo Finance
 * Routes: /api/yf/v8/finance/chart/:ticker  →  historical prices
 *         /api/yf/v7/finance/quote?symbols=  →  live quotes
 *
 * Server-to-server calls bypass CORS entirely.
 * Tries query1 then query2 as fallback.
 */

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer':         'https://finance.yahoo.com/',
  'Origin':          'https://finance.yahoo.com',
};

const SERVERS = [
  'https://query1.finance.yahoo.com',
  'https://query2.finance.yahoo.com',
];

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // Reconstruct path: req.query.path is ['v8','finance','chart','AAPL'] for catch-all
  const segments = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path ?? ''];
  const yPath = segments.join('/');

  // Forward all query params except the internal 'path' catch-all
  const { path: _ignored, ...forwardParams } = req.query;
  const qs = new URLSearchParams(forwardParams).toString();

  let lastStatus = 502;
  let lastBody   = null;

  for (const base of SERVERS) {
    try {
      const url = `${base}/${yPath}${qs ? `?${qs}` : ''}`;
      const upstream = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(9_000),
      });

      lastStatus = upstream.status;

      if (upstream.ok) {
        const data = await upstream.json();
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        return res.status(200).json(data);
      }

      // Keep body for debugging
      try { lastBody = await upstream.text(); } catch {}

    } catch (err) {
      lastBody = err.message;
    }
  }

  // Both servers failed
  res.status(lastStatus).json({
    error:   'Yahoo Finance unavailable',
    status:  lastStatus,
    details: lastBody,
  });
}
