// Manual Telegram notification endpoint
// POST /api/notify with JSON body { message: "..." }
// Protected by NOTIFY_SECRET env var

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = req.headers['x-notify-secret'];
  if (!secret || secret !== process.env.NOTIFY_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { message } = req.body ?? {};
  if (!message) {
    res.status(400).json({ error: 'Missing message' });
    return;
  }

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    res.status(500).json({ error: 'Telegram credentials not configured' });
    return;
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) throw new Error(tgData.description ?? 'Telegram error');
    res.json({ ok: true, message_id: tgData.result?.message_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
