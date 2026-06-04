/* ===========================================================
   New-order notification by EMAIL (SMTP via nodemailer).
   Recipient + credentials are read from .env. OPTIONAL:
   if SMTP is not configured it stays dormant (does nothing).
   Never throws (a failed email must not break the order).

   .env keys:
     SMTP_HOST   e.g. smtp.gmail.com
     SMTP_PORT   587 (or 465 for SSL)
     SMTP_USER   the sending account (e.g. your Gmail)
     SMTP_PASS   the password / Gmail "App Password"
     NOTIFY_EMAIL  where alerts are sent (defaults to SMTP_USER)
     NOTIFY_FROM   "From" header (defaults to SMTP_USER)
   =========================================================== */
const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) { transporter = null; return null; }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function buildEmail(order) {
  const rows = (order.items || []).map((it) => `
    <tr>
      <td style="padding:6px 0;border-bottom:1px solid #eee">${it.productName || it.productId} ${it.custom ? '🎨' : ''}</td>
      <td style="padding:6px 0;border-bottom:1px solid #eee;color:#666">${[it.color, it.size].filter(Boolean).join(' · ')}</td>
      <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">×${it.qty}</td>
    </tr>`).join('');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#111">
    <h2 style="margin:0 0 4px">🛒 New order — ${order.id}</h2>
    <p style="margin:0 0 16px;color:#666">Cash on delivery${order.custom ? ' · 🎨 customized (see admin for the design)' : ''}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
      <tr><td style="color:#666;padding:3px 0">Customer</td><td style="padding:3px 0"><b>${order.name}</b></td></tr>
      <tr><td style="color:#666;padding:3px 0">Phone</td><td style="padding:3px 0">${order.phone}</td></tr>
      <tr><td style="color:#666;padding:3px 0">Address</td><td style="padding:3px 0">${order.wilaya} · ${order.commune}${order.address ? ' · ' + order.address : ''}</td></tr>
      <tr><td style="color:#666;padding:3px 0">Delivery</td><td style="padding:3px 0">${order.deliveryMode === 'desk' ? 'Pickup point' : 'Home'}</td></tr>
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    <p style="font-size:18px;font-weight:bold;margin:16px 0 0">Total: ${order.total} DA</p>
    ${order.note ? `<p style="background:#f4f4f3;padding:12px;border-radius:8px;font-size:14px"><b>Note:</b> ${order.note}</p>` : ''}
  </div>`;

  const text = `New order ${order.id}\n${order.name} · ${order.phone}\n${order.wilaya} · ${order.commune}\nTotal: ${order.total} DA (COD)${order.custom ? '\nCustomized — see admin.' : ''}`;
  return { subject: `🛒 New order ${order.id} — ${order.total} DA`, html, text };
}

async function notifyNewOrder(order) {
  try {
    const t = getTransporter();
    if (!t) return; // dormant until SMTP is configured in .env
    const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;
    const from = process.env.NOTIFY_FROM || process.env.SMTP_USER;
    const { subject, html, text } = buildEmail(order);
    await t.sendMail({ from, to, subject, html, text });
  } catch (e) {
    console.error('notifyNewOrder (email) failed:', e.message);
  }
}

module.exports = { notifyNewOrder };
