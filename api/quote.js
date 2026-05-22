// GET /api/quote?symbols=AMZN,ORCL,SPY&fields=regularMarketPrice,regularMarketChangePercent
// Proxies Yahoo Finance v7 quote endpoint server-to-server (no CORS)

const HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept':          'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer':         'https://finance.yahoo.com/',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const { symbols, fields = 'regularMarketPrice,regularMarketChangePercent' } = req.query;
  if (!symbols) return res.status(400).json({ error: 'Missing symbols' });

  for (const base of [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ]) {
    try {
      const url = `${base}/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=${fields}`;
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(9_000) });
      if (r.ok) {
        const data = await r.json();
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
        return res.status(200).json(data);
      }
    } catch (_) {}
  }

  res.status(502).json({ error: 'Yahoo Finance unavailable' });
}
