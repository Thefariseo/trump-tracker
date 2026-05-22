// Vercel catch-all serverless proxy for Yahoo Finance
// Intercepts /api/yf/v8/finance/chart/AAPL?interval=1d&range=6mo
// Handles session crumb automatically so 401s never reach the client.
//
// When deployed on Vercel this file takes precedence over the /api/yf rewrite
// in vercel.json (serverless functions > rewrites). In local dev the Vite proxy
// is still used (this file is ignored by Vite).

let _crumb   = null;
let _cookies = null;
let _crumbTs = 0;
const CRUMB_TTL = 55 * 60 * 1000; // 55 min (Yahoo crumbs expire in ~1h)

const BASE_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer':         'https://finance.yahoo.com/',
};

async function obtainCrumb() {
  // 1. Fetch Yahoo Finance homepage to collect session cookies
  const home = await fetch('https://finance.yahoo.com/', {
    headers: BASE_HEADERS,
    redirect: 'follow',
    signal: AbortSignal.timeout(8_000),
  });

  // Collect all Set-Cookie values → single Cookie header string
  const raw = home.headers.get('set-cookie') ?? '';
  _cookies = raw
    .split(/,(?=[^;]+=)/)          // split on commas that start a new cookie
    .map(c => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');

  // 2. Exchange cookies for a crumb token
  const crumbRes = await fetch(
    'https://query1.finance.yahoo.com/v1/test/getcrumb',
    { headers: { ...BASE_HEADERS, Cookie: _cookies }, signal: AbortSignal.timeout(5_000) }
  );
  const text = await crumbRes.text();
  if (!text || text.length < 3) throw new Error('Empty crumb response');
  _crumb   = text.trim();
  _crumbTs = Date.now();
}

async function proxyYahoo(path, params) {
  const qs = new URLSearchParams({ ...params, crumb: _crumb }).toString();
  const url = `https://query1.finance.yahoo.com/${path}?${qs}`;

  return fetch(url, {
    headers: { ...BASE_HEADERS, Cookie: _cookies },
    signal: AbortSignal.timeout(10_000),
  });
}

export default async function handler(req, res) {
  // CORS — allow any origin (this is public market data)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // Reconstruct the upstream path from the catch-all [...path] param
  // Vercel populates req.query.path as an array, e.g. ['v8','finance','chart','AAPL']
  const pathSegments = req.query.path ?? [];
  const yPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  // Strip internal Vercel routing params, keep real query params
  const { path: _p, ...queryParams } = req.query;

  try {
    // Ensure we have a fresh crumb
    if (!_crumb || Date.now() - _crumbTs > CRUMB_TTL) {
      await obtainCrumb();
    }

    let response = await proxyYahoo(yPath, queryParams);

    // If stale crumb → refresh once and retry
    if (response.status === 401 || response.status === 403) {
      await obtainCrumb();
      response = await proxyYahoo(yPath, queryParams);
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo Finance ${response.status}` });
    }

    const data = await response.json();
    // Cache aggressively — market data changes every minute at most
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.status(200).json(data);

  } catch (err) {
    // Graceful degradation — client will fall back to static prices
    res.status(502).json({ error: err.message });
  }
}
