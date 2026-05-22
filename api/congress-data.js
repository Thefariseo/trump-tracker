// Vercel serverless proxy for House Stock Watcher data
// Avoids CORS issues when fetching from client

const SOURCE = 'https://house-stock-watcher-data.s3-us-east-2.amazonaws.com/data/all_transactions.json';

export default async function handler(req, res) {
  try {
    const upstream = await fetch(SOURCE, {
      headers: { 'Accept-Encoding': 'gzip' },
      signal: AbortSignal.timeout(20_000),
    });
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream ${upstream.status}` });
      return;
    }
    const data = await upstream.json();

    // Filter only 2026+ trades to reduce payload
    const filtered = Array.isArray(data)
      ? data.filter(t => t.transaction_date >= '2026-01-01')
      : [];

    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
