// GET /api/chart?ticker=AMZN&interval=1d&range=6mo
// Proxies Yahoo Finance chart endpoint server-to-server (no CORS)

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept':          'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer':         'https://finance.yahoo.com/',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const { ticker, interval = '1d', range = '6mo' } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });

  for (const base of [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ]) {
    try {
      const url = `${base}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(9_000) });
      if (r.ok) {
        const data = await r.json();
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
        return res.status(200).json(data);
      }
    } catch (_) {}
  }

  res.status(502).json({ error: 'Yahoo Finance unavailable' });
}
