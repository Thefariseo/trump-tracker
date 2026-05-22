// GET /api/quote?symbols=AMZN,ORCL,SPY
// Returns { quoteResponse: { result: [{ symbol, regularMarketPrice, regularMarketChangePercent }] } }
//
// Strategy (in order):
//  1. Yahoo Finance v8/spark — same infrastructure as /v8/chart, no crumb required
//  2. Yahoo Finance v7/quote with crumb (obtained fresh or from module-level cache)
//  3. Both servers tried in parallel with a short timeout (avoids Vercel 10s limit)

const BASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':          'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin':          'https://finance.yahoo.com',
  'Referer':         'https://finance.yahoo.com/',
};

// ─── Module-level crumb cache (survives warm lambda restarts) ─────────────────
let _cookie  = '';
let _crumb   = '';
let _crumbTs = 0;
const CRUMB_TTL = 55 * 60 * 1000; // 55 min

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Try fetching a URL from both YF query servers in parallel; returns first 200. */
async function raceFetch(path, headers, timeoutMs = 4_500) {
  const servers = [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ];
  const results = await Promise.allSettled(
    servers.map(async (base) => {
      const r = await fetch(base + path, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status} from ${base}`);
      return r.json();
    }),
  );
  for (const res of results) {
    if (res.status === 'fulfilled') return res.value;
  }
  throw new Error(results.map(r => r.reason?.message ?? 'unknown').join(' | '));
}

/** Convert Yahoo Finance spark response → quoteResponse format the frontend expects. */
function sparkToQuoteResponse(sparkJson) {
  const result = [];
  for (const item of sparkJson?.spark?.result ?? []) {
    const sym  = item.symbol;
    const meta = item.response?.[0]?.meta;
    if (!meta || meta.regularMarketPrice == null) continue;
    const prev         = meta.chartPreviousClose ?? meta.regularMarketPrice;
    const changePercent = prev > 0 ? ((meta.regularMarketPrice / prev) - 1) * 100 : 0;
    result.push({
      symbol:                      sym,
      regularMarketPrice:          meta.regularMarketPrice,
      regularMarketChangePercent:  changePercent,
    });
  }
  return { quoteResponse: { result, error: null } };
}

/** Obtain a fresh Yahoo Finance crumb (sets module-level _cookie and _crumb). */
async function refreshCrumb() {
  // Step 1 — pick up the GUC / A1 session cookies
  const fcRes = await fetch('https://fc.yahoo.com', {
    headers:  { ...BASE_HEADERS, Accept: 'text/html' },
    redirect: 'follow',
    signal:   AbortSignal.timeout(3_000),
  });
  const raw = fcRes.headers.get('set-cookie') ?? '';
  // Extract key=value pairs (ignore path/domain/SameSite attributes)
  _cookie = raw.split(/,(?=[^;]+=)/)
    .map(c => c.trim().split(';')[0])
    .filter(Boolean)
    .join('; ');

  // Step 2 — get the crumb using those cookies
  const crumbRes = await fetch(
    'https://query2.finance.yahoo.com/v1/test/getcrumb',
    { headers: { ...BASE_HEADERS, Cookie: _cookie }, signal: AbortSignal.timeout(3_000) },
  );
  if (!crumbRes.ok) throw new Error(`crumb fetch ${crumbRes.status}`);
  _crumb   = (await crumbRes.text()).trim();
  _crumbTs = Date.now();
  if (!_crumb || _crumb.includes('<')) throw new Error('invalid crumb response');
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const { symbols, fields = 'regularMarketPrice,regularMarketChangePercent' } = req.query;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  // ── Attempt 1: Yahoo Finance v8/spark ──────────────────────────────────────
  // Same v8 infrastructure as /chart — not blocked by Yahoo's new crumb requirement.
  try {
    const path = `/v8/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1d&interval=1d`;
    const json = await raceFetch(path, BASE_HEADERS, 4_500);
    if (json?.spark?.result?.length) {
      const out = sparkToQuoteResponse(json);
      if (out.quoteResponse.result.length) {
        res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
        return res.status(200).json(out);
      }
    }
  } catch (e) {
    console.warn('[quote] spark failed:', e.message);
  }

  // ── Attempt 2: Yahoo Finance v7/quote with crumb ───────────────────────────
  try {
    // Refresh crumb if stale or missing
    if (!_crumb || Date.now() - _crumbTs > CRUMB_TTL) {
      await refreshCrumb();
    }
    const path = `/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=${fields}&crumb=${encodeURIComponent(_crumb)}`;
    const json = await raceFetch(path, { ...BASE_HEADERS, Cookie: _cookie }, 4_000);
    if (json?.quoteResponse?.result?.length) {
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
      return res.status(200).json(json);
    }
  } catch (e) {
    console.warn('[quote] crumb/v7 failed:', e.message);
  }

  // ── All attempts failed ────────────────────────────────────────────────────
  return res.status(503).json({
    error: 'Yahoo Finance unavailable — try again shortly',
    quoteResponse: { result: [], error: 'unavailable' },
  });
}
