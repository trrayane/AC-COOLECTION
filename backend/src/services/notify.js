/* ===========================================================
   New-order notifications — Telegram and/or Email (Resend).
   Both are OPTIONAL: a channel only fires if its env vars are set.
   Never throws (a failed notification must not break the order).
   =========================================================== */

const TIMEOUT = 5000;

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
}

async function sendEmail(subject, html) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  const from = process.env.NOTIFY_FROM || 'AC Collection <onboarding@resend.dev>';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
}

function buildSummary(order) {
  const items = (order.items || [])
    .map((it) => `• ${it.productName || it.productId} (${[it.color, it.size].filter(Boolean).join(' ')}) ×${it.qty}${it.custom ? ' 🎨' : ''}`)
    .join('\n');
  return [
    `🛒 New order ${order.id}`,
    `${order.name} · ${order.phone}`,
    `${order.wilaya} · ${order.commune}`,
    '',
    items,
    '',
    `Total: ${order.total} DA  (Cash on delivery)`,
    order.custom ? '🎨 Customized — open the admin to see the design.' : '',
  ].filter((l) => l !== undefined).join('\n');
}

// Fire all configured channels; await so it runs before the serverless
// function freezes. Failures are swallowed.
async function notifyNewOrder(order) {
  try {
    const text = buildSummary(order);
    const html = text.replace(/\n/g, '<br>');
    const subject = `New order ${order.id} — ${order.total} DA`;
    const results = await Promise.allSettled([sendTelegram(text), sendEmail(subject, html)]);
    results.forEach((r) => { if (r.status === 'rejected') console.error('notify channel failed:', r.reason && r.reason.message); });
  } catch (e) {
    console.error('notifyNewOrder failed:', e.message);
  }
}

module.exports = { notifyNewOrder };
