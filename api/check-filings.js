// Vercel Cron Job — checks OGE for new Trump 278-T filings
// Schedule in vercel.json: { "crons": [{ "path": "/api/check-filings", "schedule": "0 9 * * *" }] }
//
// Env vars required:
//   TELEGRAM_BOT_TOKEN — bot token from @BotFather
//   TELEGRAM_CHAT_ID   — target chat ID (e.g. your personal chat or a channel)
//   LAST_FILING_DATE   — set manually after deployment (e.g. "2026-05-08")

const OGE_URL = 'https://extapps2.oge.gov/201/Presiden.nsf/PAS+Index/';
const KNOWN_LAST = process.env.LAST_FILING_DATE ?? '2026-05-08';

async function getLatestFilingDate() {
  // OGE search page returns HTML — we look for the most recent 278-T entry
  const res = await fetch(
    `${OGE_URL}?OpenView&StartKey=Trump%2C+Donald+J&Count=10`,
    { signal: AbortSignal.timeout(10_000) }
  );
  if (!res.ok) throw new Error(`OGE fetch failed: ${res.status}`);
  const html = await res.text();

  // Extract dates from the table (format: MM/DD/YYYY or YYYY-MM-DD)
  const dateMatches = [...html.matchAll(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/g)];
  if (!dateMatches.length) return null;

  // Parse and find the most recent
  const dates = dateMatches
    .map(m => {
      const d = m[1];
      return d.includes('/') ? d.split('/').reverse().join('-') : d; // normalize to YYYY-MM-DD
    })
    .filter(d => d > '2025-01-01')
    .sort()
    .reverse();

  return dates[0] ?? null;
}

async function sendTelegramAlert(message) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:    chatId,
      text:       message,
      parse_mode: 'HTML',
    }),
  });
}

export default async function handler(req, res) {
  // Vercel Cron sends GET with CRON_SECRET header
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const latest = await getLatestFilingDate();
    if (!latest) {
      res.json({ ok: true, message: 'Could not parse OGE date', latest: null });
      return;
    }

    if (latest > KNOWN_LAST) {
      const msg = [
        '🚨 <b>Nuovo filing Trump OGE 278-T rilevato!</b>',
        '',
        `📅 Data filing: <b>${latest}</b>`,
        `📅 Ultimo noto: ${KNOWN_LAST}`,
        '',
        `🔗 <a href="${OGE_URL}">Visualizza su OGE.gov</a>`,
        '',
        '⚠️ Aggiorna i dati nel dashboard manualmente.',
      ].join('\n');

      await sendTelegramAlert(msg);
      res.json({ ok: true, newFiling: true, date: latest, alerted: true });
    } else {
      res.json({ ok: true, newFiling: false, latest, known: KNOWN_LAST });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
