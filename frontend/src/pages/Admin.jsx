/* ===========================================================
   Admin console (dark sidebar) — login · overview · orders · products · inventory
   Wired to the backend: auth (JWT), orders, product CRUD + photo upload.
   =========================================================== */
import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { useIsMobile } from '../components/chrome/useIsMobile.js';
import { Icon } from '../components/ui/Icon.jsx';
import { Logo } from '../components/ui/Logo.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ProductImage } from '../components/product/ProductImage.jsx';
import { isLight } from '../components/garments/Garment.jsx';
import { CustomMini } from './Checkout.jsx';
import { CATEGORIES, COLORS, SIZES, PRINT_ZONES, colorHex, colorTint, colorLabel, fmtDA } from '../data/constants.js';
import { api, setToken, getToken } from '../api/client.js';

const STATUS_META = {
  pending:   { en: 'Pending', ar: 'قيد الانتظار', color: '#B07A18', bg: '#FBF0D8', dot: '#D79A2B' },
  prep:      { en: 'In preparation', ar: 'قيد التحضير', color: '#3C5A86', bg: '#E1EAF6', dot: '#5B82BE' },
  shipped:   { en: 'Shipped', ar: 'تم الشحن', color: '#6A49A8', bg: '#EBE3F7', dot: '#8A66D0' },
  delivered: { en: 'Delivered', ar: 'تم التسليم', color: '#3F7349', bg: '#E0F0E2', dot: '#5AA36A' },
  cancelled: { en: 'Cancelled', ar: 'ملغى', color: '#A8423A', bg: '#F8E0DD', dot: '#C75A50' },
};
const STATUS_FLOW = ['pending', 'prep', 'shipped', 'delivered', 'cancelled'];
const nextStatus = (s) => { const o = ['pending', 'prep', 'shipped', 'delivered']; const i = o.indexOf(s); return (i >= 0 && i < o.length - 1) ? o[i + 1] : null; };
const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// Real stock helpers (from product.stock map "color:size" -> qty)
const stockForColor = (p, color) => (p.sizes || []).reduce((s, sz) => s + ((p.stock && p.stock[`${color}:${sz}`]) || 0), 0);
const totalStock = (p) => (p.colors || []).reduce((s, c) => s + stockForColor(p, c), 0);
const zoneView = (z) => (z === 'back' ? 'back' : 'front');

// Normalize an API order so the UI can use item.pid
const normOrder = (o) => ({ ...o, items: (o.items || []).map((it) => ({ pid: it.productId, color: it.color, size: it.size, qty: it.qty, custom: it.custom, customData: it.customData, productName: it.productName })) });

function CountUp({ value, fmt }) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    let raf; const start = performance.now(); const dur = 850; setV(0);
    const tick = (now) => { const p = Math.min(1, (now - start) / dur); const e = 1 - Math.pow(1 - p, 3); setV(value * e); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const safety = setTimeout(() => setV(value), dur + 120);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [value]);
  return <>{fmt ? fmt(v) : Math.round(v).toLocaleString('en-US')}</>;
}

function StatusBadge({ status, lang, onClick, title, compact }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  const Tag = onClick ? 'button' : 'span';
  return <Tag onClick={onClick} title={title} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: compact ? 24 : 26, minWidth: compact ? 0 : 122, padding: compact ? '0 10px' : '0 12px', borderRadius: 99, fontSize: compact ? 11.5 : 12, fontWeight: 700, color: m.color, background: m.bg, whiteSpace: 'nowrap', cursor: onClick ? 'pointer' : 'default' }}>
    <span style={{ width: 6, height: 6, borderRadius: 9, background: m.dot, flexShrink: 0 }} /> {m[lang]}
  </Tag>;
}

function StatCard({ label, value, fmt, trend, sub, delay }) {
  return (
    <div className="card adm-stat adm-in" style={{ padding: '22px 24px', animationDelay: (delay || 0) + 's' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow" style={{ letterSpacing: '.1em' }}>{label}</span>
        {trend != null && <span style={{ fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', color: trend >= 0 ? 'var(--good)' : 'var(--danger)' }}>{trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}%</span>}
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, marginTop: 14, letterSpacing: '-.025em' }}><CountUp value={value} fmt={fmt} /></div>
      <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function Field({ label, children }) {
  return <label style={{ display: 'block' }}><span className="field-label">{label}</span>{children}</label>;
}

function Sidebar({ tab, setTab, lang, t, navigate, onLogout, pending }) {
  const items = [
    { id: 'overview', icon: 'chart', label: t.adm_overview },
    { id: 'orders', icon: 'box', label: t.adm_orders, badge: pending },
    { id: 'products', icon: 'tag', label: t.adm_products },
    { id: 'stock', icon: 'layers', label: t.adm_stock },
    { id: 'promos', icon: 'tag', label: lang === 'ar' ? 'الكوبونات' : 'Promo codes' },
  ];
  return (
    <aside style={{ width: 244, flexShrink: 0, background: '#141414', color: '#fff', position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
      <div style={{ padding: '4px 8px 22px' }}><Logo light size={20} /></div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.18em', color: 'rgba(255,255,255,.35)', padding: '0 10px 10px' }}>{lang === 'ar' ? 'القائمة' : 'MENU'}</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((it) => {
          const on = tab === it.id;
          return (
            <button key={it.id} className="adm-nav" onClick={() => setTab(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, textAlign: 'start',
              background: on ? 'rgba(255,255,255,.12)' : 'transparent', color: on ? '#fff' : 'rgba(255,255,255,.62)', fontWeight: 600, fontSize: 14, position: 'relative',
            }}>
              {on && <span style={{ position: 'absolute', insetInlineStart: 0, top: 10, bottom: 10, width: 3, borderRadius: 9, background: '#fff' }} />}
              <Icon name={it.icon} size={18} /> <span style={{ flex: 1 }}>{it.label}</span>
              {it.badge ? <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 99, background: '#fff', color: 'var(--ink)', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{it.badge}</span> : null}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px' }}>
          <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>AC</span>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700 }}>Admin</div><div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.45)' }}>{lang === 'ar' ? 'مدير المتجر' : 'Store manager'}</div></div>
        </div>
        <button onClick={() => navigate('home')} className="adm-nav" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12, color: 'rgba(255,255,255,.62)', fontWeight: 600, fontSize: 13.5 }}>
          <Icon name="logout" size={17} /> {t.adm_back_shop}
        </button>
        <button onClick={onLogout} className="adm-nav" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12, color: 'rgba(255,255,255,.62)', fontWeight: 600, fontSize: 13.5 }}>
          <Icon name="close" size={17} /> {t.adm_logout}
        </button>
      </div>
    </aside>
  );
}

// Pending photos are File objects; existing are {id,url}.
function PhotoManager({ f, addPending, removeExisting, removePending, lang }) {
  const existing = f.photos || [];
  const pending = f._photos || [];
  const readFiles = (files) => { Array.from(files).forEach((file) => addPending(file)); };
  const tiles = [
    ...existing.map((ph) => ({ src: ph.url, kind: 'existing', key: ph.id })),
    ...pending.map((file, i) => ({ src: URL.createObjectURL(file), kind: 'pending', key: 'p' + i, i })),
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(76px,1fr))', gap: 9 }}>
        {tiles.map((tile, idx) => (
          <div key={tile.key} className="adm-in" style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 10, overflow: 'hidden', background: 'var(--sand)', animationDelay: (idx * 0.03) + 's' }}>
            <img src={tile.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {idx < 2 && <span style={{ position: 'absolute', bottom: 4, insetInlineStart: 4, fontSize: 9, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '2px 6px', borderRadius: 99 }}>{idx === 0 ? (lang === 'ar' ? 'الأمام' : 'Front') : (lang === 'ar' ? 'الخلف' : 'Back')}</span>}
            <button onClick={() => tile.kind === 'existing' ? removeExisting(tile.key) : removePending(tile.i)} style={{ position: 'absolute', top: 4, insetInlineEnd: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="close" size={13} /></button>
          </div>
        ))}
        <label style={{ aspectRatio: '4/5', borderRadius: 10, border: '2px dashed var(--line-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', color: 'var(--ink-3)', background: 'var(--paper-2)' }}>
          <Icon name="plus" size={18} /><span style={{ fontSize: 10.5, fontWeight: 600 }}>{lang === 'ar' ? 'إضافة' : 'Add'}</span>
          <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { readFiles(e.target.files); e.target.value = ''; }} />
        </label>
      </div>
      <p className="dim" style={{ fontSize: 12, marginTop: 8 }}>{lang === 'ar' ? 'أضف صورة الأمام أولاً ثم صورة الخلف (تُستعمل في التخصيص).' : 'Add the FRONT photo first, then the BACK photo (used by the customizer).'}</p>
    </div>
  );
}

function OrderDetailModal({ order, onClose, onStatus, onDelete, lang, t }) {
  const isMobile = useIsMobile();
  const { getProduct } = useShop();
  const productFor = (it) => getProduct(it.pid) || { id: it.pid, cat: 'tshirt', name_en: it.productName || 'Product', name_ar: it.productName || 'منتج', colors: [it.color || 'ink'], photos: [] };
  // Force-download URL (Cloudinary fl_attachment keeps the customer's original file/format)
  const dl = (url) => (typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/upload/')) ? url.replace('/upload/', '/upload/fl_attachment/') : url;
  const designFiles = order.items.filter((i) => i.custom).flatMap((i) => ((i.customData && i.customData.placements) || []).filter((pl) => pl.type === 'image' && pl.img).map((pl) => ({ url: pl.img, side: zoneView(pl.zone) })));
  // Phone → international (Algeria +213) for tel:/WhatsApp
  const digits = String(order.phone || '').replace(/\D/g, '');
  const intl = digits.startsWith('213') ? digits : digits.startsWith('0') ? '213' + digits.slice(1) : '213' + digits;
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Print / save-as-PDF a clean delivery note
  const printOrder = () => {
    const w = window.open('', '_blank', 'width=620,height=900');
    if (!w) return;
    const dateStr = order.date ? new Date(order.date).toLocaleDateString('fr-DZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    const rows = order.items.map((it) => {
      const lineTotal = (it.unitPrice || 0) * (it.qty || 1);
      return `<tr>
        <td>${esc(it.productName || it.pid)}${it.custom ? ' <span class="custom-badge">personnalisé</span>' : ''}<br><small>${esc([it.color, it.size].filter(Boolean).join(' / '))}</small></td>
        <td class="c">${esc(it.qty)}</td>
        <td class="r">${(it.unitPrice||0).toLocaleString('fr-DZ')} DA</td>
        <td class="r"><b>${lineTotal.toLocaleString('fr-DZ')} DA</b></td>
      </tr>`;
    }).join('');
    const subtotal = order.subtotal || (order.total - (order.deliveryFee || 0));
    const fee = order.deliveryFee || 0;
    const deliveryLabel = order.deliveryMode === 'desk' ? 'Point de retrait' : 'Livraison à domicile';
    w.document.write(`<!doctype html>
<html dir="ltr">
<head>
<meta charset="utf-8">
<title>BON-${esc(order.id)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;font-size:13px;color:#111;background:#fff;padding:18px 22px;max-width:600px;margin:auto}
  /* ---- Header ---- */
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2.5px solid #111;margin-bottom:14px}
  .brand{font-size:22px;font-weight:900;letter-spacing:.18em}
  .brand span{font-weight:400;font-size:13px;letter-spacing:.06em;display:block;color:#555;margin-top:2px}
  .bon-info{text-align:right;font-size:12px;color:#444;line-height:1.7}
  .bon-info b{font-size:14px;color:#111}
  /* ---- Two-column info ---- */
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
  .info-box{border:1px solid #ddd;border-radius:4px;padding:10px 13px}
  .info-box .title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:7px;border-bottom:1px solid #eee;padding-bottom:4px}
  .info-box .row{display:flex;justify-content:space-between;margin:3px 0;font-size:12.5px}
  .info-box .row .k{color:#777}
  .info-box .row .v{font-weight:600;text-align:right;max-width:160px}
  /* ---- Items table ---- */
  table{width:100%;border-collapse:collapse;margin-bottom:0;font-size:12.5px}
  thead tr{background:#111;color:#fff}
  thead th{padding:8px 10px;text-align:left;font-weight:700;font-size:11.5px;letter-spacing:.04em}
  thead th.c{text-align:center}
  thead th.r{text-align:right}
  tbody tr:nth-child(even){background:#f8f8f8}
  tbody td{padding:8px 10px;border-bottom:1px solid #e8e8e8;vertical-align:top}
  tbody td.c{text-align:center}
  tbody td.r{text-align:right;white-space:nowrap}
  tbody td small{color:#888;font-size:11px}
  .custom-badge{background:#f0e0d6;color:#8b3a1a;font-size:10px;font-weight:700;padding:1px 6px;border-radius:99px;letter-spacing:.04em}
  /* ---- Totals ---- */
  .totals{border:1px solid #ddd;border-radius:4px;width:220px;margin-left:auto;margin-top:0;font-size:12.5px}
  .totals .tr{display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #eee}
  .totals .tr:last-child{border-bottom:none;background:#111;color:#fff;border-radius:0 0 3px 3px;font-size:14px;font-weight:800}
  .totals .tr .k{color:inherit}
  /* ---- Note ---- */
  .note-box{margin-top:10px;border:1px dashed #ccc;border-radius:4px;padding:8px 12px;font-size:12px;color:#555}
  .note-box b{color:#111;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
  /* ---- Footer ---- */
  .footer{margin-top:16px;padding-top:12px;border-top:1.5px dashed #bbb;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:11.5px}
  .sig-box{border:1px solid #ccc;border-radius:4px;padding:8px 12px;height:60px;display:flex;flex-direction:column;justify-content:space-between}
  .sig-box .sig-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888}
  .cod-stamp{border:2px solid #111;border-radius:4px;padding:8px 12px;text-align:center;height:60px;display:flex;flex-direction:column;justify-content:center}
  .cod-stamp .amount{font-size:18px;font-weight:900}
  .cod-stamp .label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#555;margin-top:2px}
  .legal{grid-column:1/-1;text-align:center;color:#aaa;font-size:10.5px;margin-top:4px}
  @media print{
    body{padding:10px 14px}
    @page{margin:8mm;size:A5}
  }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="brand">AC COLLECTION<span>Prêt-à-porter personnalisé · Algérie</span></div>
    </div>
    <div class="bon-info">
      <b>BON DE LIVRAISON</b><br>
      N° <b>${esc(order.id)}</b><br>
      Date : ${dateStr}<br>
      Mode : ${deliveryLabel}
    </div>
  </div>

  <!-- CLIENT + LIVRAISON -->
  <div class="cols">
    <div class="info-box">
      <div class="title">Informations client</div>
      <div class="row"><span class="k">Nom</span><span class="v">${esc(order.name)}</span></div>
      <div class="row"><span class="k">Téléphone</span><span class="v" dir="ltr">${esc(order.phone)}</span></div>
    </div>
    <div class="info-box">
      <div class="title">Adresse de livraison</div>
      <div class="row"><span class="k">Wilaya</span><span class="v">${esc(order.wilaya)}</span></div>
      <div class="row"><span class="k">Commune</span><span class="v">${esc(order.commune)}</span></div>
      ${order.address ? `<div class="row"><span class="k">Adresse</span><span class="v">${esc(order.address)}</span></div>` : ''}
    </div>
  </div>

  <!-- ARTICLES -->
  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="c">Qté</th>
        <th class="r">Prix unit.</th>
        <th class="r">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr style="background:#f0f0f0">
        <td colspan="3" style="text-align:right;padding:7px 10px;font-size:12px;color:#666">Sous-total</td>
        <td class="r" style="padding:7px 10px">${subtotal.toLocaleString('fr-DZ')} DA</td>
      </tr>
      <tr style="background:#f0f0f0">
        <td colspan="3" style="text-align:right;padding:7px 10px;font-size:12px;color:#666">Frais de livraison</td>
        <td class="r" style="padding:7px 10px">${fee.toLocaleString('fr-DZ')} DA</td>
      </tr>
    </tbody>
  </table>

  <!-- TOTAL + NOTE -->
  <div class="totals">
    <div class="tr"><span class="k">TOTAL À ENCAISSER</span><span>${order.total.toLocaleString('fr-DZ')} DA</span></div>
  </div>

  ${order.note ? `<div class="note-box"><b>Remarque :</b> ${esc(order.note)}</div>` : ''}

  <!-- FOOTER: SIGNATURE + CACHET COD -->
  <div class="footer">
    <div class="sig-box">
      <div class="sig-title">Signature &amp; cachet livreur</div>
      <div style="border-bottom:1px solid #ccc;width:100%;margin-bottom:2px"></div>
    </div>
    <div class="cod-stamp">
      <div class="amount">${order.total.toLocaleString('fr-DZ')} DA</div>
      <div class="label">&#128; Paiement à la livraison (COD)</div>
    </div>
    <div class="legal">
      AC Collection · Algérie · Commande ${esc(order.id)} · Document généré automatiquement
    </div>
  </div>

</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch (e) {} }, 400);
  };
  return (
    <div className="fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(10,10,10,.55)', display: 'grid', placeItems: isMobile ? 'end' : 'center', padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: isMobile ? '100%' : 'min(720px, calc(100vw - 20px))', maxHeight: '92vh', overflow: 'auto', animation: 'fadeUp .28s cubic-bezier(.2,.8,.2,1)', borderRadius: isMobile ? '22px 22px 0 0' : 'var(--r-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--paper-2)', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontWeight: 800, fontSize: 20 }}>{order.id}</span><StatusBadge status={order.status} lang={lang} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={printOrder} title={lang === 'en' ? 'Print / PDF' : 'طباعة / PDF'} style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', color: 'var(--ink-2)', boxShadow: 'inset 0 0 0 1.3px var(--line)' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" rx="1" /></svg>
            </button>
            <button onClick={() => onDelete(order)} title={lang === 'en' ? 'Delete order' : 'حذف الطلب'} style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', color: 'var(--danger)', boxShadow: 'inset 0 0 0 1.3px var(--line)' }}><Icon name="trash" size={18} /></button>
            <button onClick={onClose}><Icon name="close" size={22} /></button>
          </div>
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t.adm_customer}</div>
            <div style={{ display: 'grid', gap: 11 }}>
              {[['user', order.name], ['phone', order.phone], ['pin', order.wilaya + ' · ' + order.commune]].map(([ic, v]) => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5 }}><Icon name={ic} size={17} style={{ color: 'var(--ink-3)' }} /> <span dir={ic === 'phone' ? 'ltr' : undefined} style={{ fontWeight: 600 }}>{v}</span></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
              <a href={`tel:+${intl}`} className="btn btn-ghost btn-sm" style={{ flex: 1, textDecoration: 'none' }}><Icon name="phone" size={15} /> {lang === 'ar' ? 'اتصال' : 'Call'}</a>
              <a href={`https://wa.me/${intl}`} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ flex: 1, textDecoration: 'none', background: '#25D366', color: '#fff', border: 'none' }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.26A10 10 0 1 0 12 2zm0 18.2c-1.5 0-2.96-.4-4.24-1.16l-.3-.18-2.85.75.76-2.78-.2-.31A8.2 8.2 0 1 1 12 20.2z" /></svg> WhatsApp
              </a>
            </div>
            <div className="eyebrow" style={{ margin: '22px 0 12px' }}>{lang === 'en' ? 'Items' : 'المنتجات'}</div>
            {order.items.map((it, i) => {
              const p = productFor(it);
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                  {it.custom ? <CustomMini item={it} size={48} /> : <div style={{ width: 48, height: 60, borderRadius: 8, background: colorTint(it.color), overflow: 'hidden', flexShrink: 0 }}><ProductImage p={p} color={it.color} /></div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p['name_' + lang]}</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{colorLabel(it.color, lang) ? colorLabel(it.color, lang) + ' · ' : ''}{it.size} · ×{it.qty}</div>
                    {it.custom && <span className="pill pill-soft" style={{ marginTop: 5 }}><Icon name="spark" size={11} /> {t.custom_badge}</span>}
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}><span style={{ fontWeight: 700 }}>{t.adm_total}</span><span style={{ fontWeight: 800, fontSize: 18 }}>{fmtDA(order.total, lang)}</span></div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t.adm_custom_design}</div>
            {order.custom ? (
              <div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {order.items.filter((i) => i.custom).map((it, i) => {
                    const pls = (it.customData && it.customData.placements) || [];
                    const hasBack = pls.some((pl) => zoneView(pl.zone) === 'back');
                    return (
                      <React.Fragment key={i}>
                        <div style={{ textAlign: 'center' }}><CustomMini item={it} size={120} side="front" /><div className="dim" style={{ fontSize: 11, marginTop: 4 }}>{lang === 'ar' ? 'الأمام' : 'Front'}</div></div>
                        {hasBack && <div style={{ textAlign: 'center' }}><CustomMini item={it} size={120} side="back" /><div className="dim" style={{ fontSize: 11, marginTop: 4 }}>{lang === 'ar' ? 'الخلف' : 'Back'}</div></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
                {order.items.filter((i) => i.customData && i.customData.zone).map((it, i) => {
                  const zones = PRINT_ZONES[productFor(it).cat] || [];
                  return (
                    <div key={i} style={{ marginTop: 12, fontSize: 13 }}><span className="chip on" style={{ height: 26 }}>{(zones.find((z) => z.id === it.customData.zone) || {})[lang] || it.customData.zone}</span></div>
                  );
                })}
                {order.note && (
                  <div style={{ marginTop: 16, background: 'var(--clay-wash)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: 'var(--clay-deep)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.06em' }}><Icon name="note" size={14} /> {t.cfg_note}</div>
                    <p style={{ fontSize: 14, lineHeight: 1.55 }}>{order.note}</p>
                  </div>
                )}
                {designFiles.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div className="eyebrow" style={{ marginBottom: 10 }}>{lang === 'ar' ? 'ملفات التصميم (للتحميل)' : 'Design files (download)'}</div>
                    {designFiles.map((df, i) => (
                      <a key={i} href={dl(df.url)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm btn-block" style={{ marginBottom: 8, justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="image" size={15} /> {lang === 'ar' ? 'تحميل التصميم' : 'Download design'} · {df.side === 'back' ? t.cfg_back : t.cfg_front}</span>
                        <Icon name="upload" size={16} style={{ transform: 'rotate(180deg)' }} />
                      </a>
                    ))}
                    <p className="dim" style={{ fontSize: 12, marginTop: 4 }}>{lang === 'ar' ? 'الملف الأصلي للزبون بنفس الصيغة' : "The customer's original file, in its original format"}</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'var(--sand)', borderRadius: 'var(--r-md)', padding: '30px 20px', textAlign: 'center', color: 'var(--ink-3)' }}><Icon name="image" size={32} /><p style={{ marginTop: 10, fontSize: 13.5, fontWeight: 600 }}>{t.cfg_clean}</p></div>
            )}
            <div className="eyebrow" style={{ margin: '22px 0 14px' }}>{t.adm_status}</div>
            {order.status === 'cancelled' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F8E0DD', borderRadius: 'var(--r-md)', padding: '13px 15px' }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#C75A50', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="close" size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--danger)' }}>{STATUS_META.cancelled[lang]}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--danger)', opacity: .75 }}>{lang === 'ar' ? 'تم إلغاء هذا الطلب' : 'This order was cancelled'}</div>
                </div>
                <button onClick={() => onStatus(order.id, 'pending')} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>{lang === 'ar' ? 'إعادة تفعيل' : 'Reactivate'}</button>
              </div>
            ) : (() => {
              const flow = STATUS_FLOW.slice(0, 4);
              const cur = flow.indexOf(order.status);
              return (
                <>
                  <div style={{ display: 'flex' }}>
                    {flow.map((s, i) => (
                      <button key={s} onClick={() => onStatus(order.id, s)} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        {i > 0 && <span style={{ position: 'absolute', top: 16, insetInlineStart: '-50%', width: '100%', height: 3, background: cur >= i ? 'var(--ink)' : 'var(--line)', transition: 'background .3s', zIndex: 0 }} />}
                        <span style={{ position: 'relative', zIndex: 1, width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, transition: 'all .2s',
                          background: i <= cur ? 'var(--ink)' : 'var(--paper-2)', color: i <= cur ? '#fff' : 'var(--ink-3)',
                          boxShadow: i <= cur ? 'none' : 'inset 0 0 0 1.6px var(--line-2)' }}>
                          {i < cur ? <Icon name="check" size={15} /> : i + 1}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: i === cur ? 800 : 600, color: i === cur ? 'var(--ink)' : 'var(--ink-3)', textAlign: 'center', lineHeight: 1.2 }}>{STATUS_META[s][lang]}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => onStatus(order.id, 'cancelled')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', marginTop: 18, height: 38, borderRadius: 10, color: 'var(--danger)', boxShadow: 'inset 0 0 0 1.3px #F0C9C4', fontSize: 13, fontWeight: 700, transition: 'background .15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#FBEBE9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <Icon name="close" size={15} /> {lang === 'ar' ? 'إلغاء الطلب' : 'Cancel order'}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onSave, lang, t }) {
  const isNew = !product;
  const isMobile = useIsMobile();
  const { removePhotoAt } = useShop();
  const [f, setF] = React.useState(product || { name_en: '', name_ar: '', cat: 'tshirt', price: 3000, colors: ['ink'], sizes: SIZES, new: true, customizable: true, _photos: [] });
  const [saving, setSaving] = React.useState(false);
  const addPending = (file) => setF((s) => ({ ...s, _photos: [...(s._photos || []), file] }));
  const removePending = (i) => setF((s) => ({ ...s, _photos: (s._photos || []).filter((_, idx) => idx !== i) }));
  const removeExisting = (photoId) => { removePhotoAt(f.id, photoId); setF((s) => ({ ...s, photos: (s.photos || []).filter((ph) => ph.id !== photoId) })); };
  const save = async () => { setSaving(true); try { await onSave(f); } finally { setSaving(false); } };
  return (
    <div className="fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(10,10,10,.55)', display: 'grid', placeItems: isMobile ? 'end center' : 'center', padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: isMobile ? '100%' : 'min(560px, calc(100vw - 20px))', maxHeight: isMobile ? '94vh' : '90vh', overflow: 'auto', borderRadius: isMobile ? '22px 22px 0 0' : 'var(--r-lg)', animation: 'fadeUp .28s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--paper-2)', zIndex: 2 }}>
          <span style={{ fontWeight: 800, fontSize: 19 }}>{isNew ? t.adm_add_product : (lang === 'en' ? 'Edit product' : 'تعديل المنتج')}</span>
          <button onClick={onClose}><Icon name="close" size={22} /></button>
        </div>
        <div style={{ padding: 24, display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <input className="field" placeholder={t.adm_name_en} value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} />
            <input className="field" dir="rtl" placeholder={t.adm_name_ar} value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} />
          </div>
          <div>
            <div className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="image" size={14} /> {t.adm_photos}</div>
            <PhotoManager f={f} addPending={addPending} removeExisting={removeExisting} removePending={removePending} lang={lang} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label={t.category}>
              <Select value={f.cat} onChange={(v) => setF({ ...f, cat: v })} ariaLabel={t.category} options={CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({ value: c.id, label: c[lang] }))} />
            </Field>
            <Field label={t.price + ' (DA)'}><input className="field" type="number" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label={lang === 'ar' ? 'السعر القديم (تخفيض)' : 'Old price / promo (DA)'}>
              <input className="field" type="number" value={f.oldPrice || ''} placeholder={lang === 'ar' ? 'فارغ = بدون تخفيض' : 'Empty = no discount'} onChange={(e) => setF({ ...f, oldPrice: e.target.value === '' ? null : +e.target.value })} />
            </Field>
            <Field label={lang === 'ar' ? 'وسم' : 'Tag'}>
              <button type="button" onClick={() => setF({ ...f, new: !f.new })} style={{ width: '100%', height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700, fontSize: 14, background: f.new ? 'var(--ink)' : 'var(--paper-2)', color: f.new ? 'var(--paper)' : 'var(--ink-2)', boxShadow: f.new ? 'none' : 'inset 0 0 0 1.4px var(--line)' }}>
                <Icon name={f.new ? 'check' : 'spark'} size={16} /> {lang === 'ar' ? 'منتج جديد' : 'Mark as New'}
              </button>
            </Field>
          </div>
          <Field label={lang === 'ar' ? 'قابل للتخصيص' : 'Customizable'}>
            <button type="button" onClick={() => setF({ ...f, customizable: !(f.customizable !== false) })} style={{ width: '100%', height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700, fontSize: 14, background: f.customizable !== false ? 'var(--clay)' : 'var(--paper-2)', color: f.customizable !== false ? '#fff' : 'var(--ink-2)', boxShadow: f.customizable !== false ? 'none' : 'inset 0 0 0 1.4px var(--line)' }}>
              <Icon name="spark" size={16} /> {f.customizable !== false ? (lang === 'ar' ? 'قابل للتخصيص ✓' : 'Customizable ✓') : (lang === 'ar' ? 'غير قابل للتخصيص' : 'Not customizable')}
            </button>
          </Field>
          {f.oldPrice > 0 && f.oldPrice <= f.price && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: -8, fontWeight: 600 }}>{lang === 'ar' ? 'السعر القديم يجب أن يكون أكبر من السعر الحالي' : 'Old price should be higher than the price to show a discount.'}</p>}
          <Field label={t.color}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <label title={lang === 'ar' ? 'انقر لاختيار اللون' : 'Click to pick a colour'} style={{ position: 'relative', width: 54, height: 54, borderRadius: '50%', background: colorHex(f.colors[0] || '#111111'), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.18)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Icon name="edit" size={15} style={{ color: isLight(colorHex(f.colors[0] || '#111111')) ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.85)' }} />
                <input type="color" value={colorHex(f.colors[0] || '#111111')} onChange={(e) => setF({ ...f, colors: [e.target.value] })}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} aria-label="Pick a colour" />
              </label>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{lang === 'ar' ? 'لون المنتج' : 'Product colour'}</div>
                <div className="dim" style={{ fontSize: 12 }}>{lang === 'ar' ? 'انقر الدائرة لاختيار أي لون' : 'Click the circle to choose any colour'}{(colorLabel(f.colors[0], lang) || f.colors[0]) ? ' · ' + (colorLabel(f.colors[0], lang) || f.colors[0]) : ''}</div>
              </div>
            </div>
          </Field>
          <Field label={t.size}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SIZES.map((s) => {
                const on = (f.sizes || []).includes(s);
                return <button key={s} type="button" onClick={() => setF({ ...f, sizes: SIZES.filter((x) => (on ? ((f.sizes || []).includes(x) && x !== s) : ((f.sizes || []).includes(x) || x === s))) })}
                  style={{ minWidth: 44, height: 40, borderRadius: 10, fontWeight: 700, fontSize: 13, background: on ? 'var(--ink)' : 'var(--paper-2)', color: on ? 'var(--paper)' : 'var(--ink)', boxShadow: on ? 'none' : 'inset 0 0 0 1.4px var(--line)' }}>{s}</button>;
              })}
            </div>
            <p className="dim" style={{ fontSize: 12, marginTop: 7 }}>{lang === 'ar' ? 'المقاسات المتاحة لهذا المنتج' : 'Sizes available for this product'}</p>
          </Field>
          {(f.sizes || []).length > 0 && (
            <Field label={lang === 'ar' ? 'المخزون لكل مقاس' : 'Stock per size'}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(f.sizes || []).map((s) => {
                  const key = `${f.colors[0]}:${s}`;
                  const val = (f.stock && f.stock[key] != null) ? f.stock[key] : '';
                  return (
                    <div key={s} style={{ width: 60 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>{s}</div>
                      <input className="field" type="number" min="0" value={val} placeholder="∞"
                        onChange={(e) => { const raw = e.target.value; setF((cur) => { const stock = { ...(cur.stock || {}) }; if (raw === '') delete stock[key]; else stock[key] = Math.max(0, parseInt(raw, 10) || 0); return { ...cur, stock }; }); }}
                        style={{ height: 42, textAlign: 'center', padding: '0 6px' }} />
                    </div>
                  );
                })}
              </div>
              <p className="dim" style={{ fontSize: 12, marginTop: 7 }}>{lang === 'ar' ? 'الكمية لكل مقاس · فارغ = غير محدود · 0 = نفد' : 'Quantity per size · empty = unlimited · 0 = sold out'}</p>
            </Field>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 24px 24px' }}>
          <button className="btn btn-ghost btn-block" onClick={onClose}>{t.adm_cancel}</button>
          <button className="btn btn-clay btn-block" disabled={saving} onClick={save}>{saving ? <span className="spin" /> : <Icon name="check" size={17} />} {isNew ? t.adm_add_product : t.adm_save}</button>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ o, isMobile, lang, onOpen, onAdvance, onDelete, delay }) {
  const nxt = nextStatus(o.status);
  if (isMobile) {
    return (
      <div className="adm-row adm-in" onClick={() => onOpen(o)} style={{ borderBottom: '1px solid var(--line)', padding: 14, animationDelay: (delay || 0) + 's' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--sand)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{initials(o.name)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name} {o.custom && <Icon name="spark" size={12} style={{ color: 'var(--clay)', flexShrink: 0 }} />}</div>
            <div className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.id} · {o.wilaya.replace(/^\d+\s/, '')} · {(o.date || '').slice(5).split('-').reverse().join('/')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}><div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap' }}>{fmtDA(o.total, lang)}</div><StatusBadge status={o.status} lang={lang} compact /></div>
        </div>
      </div>
    );
  }
  return (
    <div className="adm-row adm-in" onClick={() => onOpen(o)} style={{ borderBottom: '1px solid var(--line)', padding: '12px 22px', display: 'grid', gridTemplateColumns: '1.4fr 1fr 100px 110px 130px 80px', gap: 12, alignItems: 'center', animationDelay: (delay || 0) + 's' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
        <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--sand)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{initials(o.name)}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>{o.name} {o.custom && <Icon name="spark" size={12} style={{ color: 'var(--clay)' }} />}</div>
          <div className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.id} · {o.wilaya.replace(/^\d+\s/, '')}</div>
        </div>
      </div>
      <span className="muted" style={{ fontSize: 13 }}>{o.commune}</span>
      <span className="muted" style={{ fontSize: 12.5 }}>{(o.date || '').slice(5).split('-').reverse().join('/')}</span>
      <span style={{ fontWeight: 800, fontSize: 14 }}>{fmtDA(o.total, lang)}</span>
      <StatusBadge status={o.status} lang={lang} />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
        {nxt && <button onClick={() => onAdvance(o.id, nxt)} title={STATUS_META[nxt][lang]} style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--ink)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="check" size={15} /></button>}
        <button onClick={() => onOpen(o)} style={{ width: 30, height: 30, borderRadius: 9, boxShadow: 'inset 0 0 0 1.3px var(--line)', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}><Icon name="eye" size={15} /></button>
        <button onClick={() => onDelete(o)} title={lang === 'en' ? 'Delete' : 'حذف'} style={{ width: 30, height: 30, borderRadius: 9, boxShadow: 'inset 0 0 0 1.3px var(--line)', display: 'grid', placeItems: 'center', color: 'var(--danger)' }}><Icon name="trash" size={15} /></button>
      </div>
    </div>
  );
}

// ---- Login gate -------------------------------------------
function AdminLogin({ onAuthed }) {
  const { t, lang, navigate } = useShop();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError(lang === 'ar' ? 'أدخل اسم المستخدم وكلمة المرور' : 'Enter your username and password'); return; }
    setBusy(true); setError('');
    try {
      const { token } = await api.auth.login(username.trim(), password);
      setToken(token);
      onAuthed();
    } catch (err) {
      setError(err.message || (lang === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed'));
    } finally { setBusy(false); }
  };
  const clear = () => setError('');
  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#09090B', display: 'grid', placeItems: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      {/* layered monochrome ambient */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 55% at 50% -12%, rgba(255,255,255,.14), transparent 55%), radial-gradient(60% 45% at 50% 118%, rgba(255,255,255,.05), transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.045) 1px, transparent 1px)', backgroundSize: '26px 26px', WebkitMaskImage: 'radial-gradient(80% 62% at 50% 36%, #000, transparent)', maskImage: 'radial-gradient(80% 62% at 50% 36%, #000, transparent)' }} />

      <div className="fade-up" style={{ position: 'relative', width: 'min(400px, calc(100vw - 16px))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}><Logo size={24} light /></div>

        <form onSubmit={submit} style={{ position: 'relative', background: 'var(--paper)', borderRadius: 26, padding: '46px clamp(22px,6vw,34px) 30px', boxShadow: '0 40px 90px -30px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.06)' }}>
          {/* floating lock badge */}
          <div style={{ position: 'absolute', top: -27, insetInlineStart: '50%', transform: 'translateX(-50%)', width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(145deg, #353535, #0d0d0d)', display: 'grid', placeItems: 'center', boxShadow: '0 12px 26px -8px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.14)' }}>
            <Icon name="lock" size={23} style={{ color: '#fff' }} />
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <h1 style={{ fontSize: 22, letterSpacing: '-.02em' }}>{lang === 'ar' ? 'لوحة الإدارة' : 'Admin dashboard'}</h1>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>{lang === 'ar' ? 'سجّل الدخول لإدارة متجرك' : 'Sign in to manage your store'}</p>
          </div>

          {error && (
            <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#F8E0DD', color: 'var(--danger)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13.5, fontWeight: 600, marginBottom: 16 }}>
              <Icon name="close" size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: 15 }}>
            <div>
              <div className="field-label">{t.adm_username}</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', insetInlineStart: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="user" size={17} /></span>
                <input className="field" style={{ height: 52, paddingInlineStart: 42 }} value={username} onChange={(e) => { setUsername(e.target.value); clear(); }} placeholder={t.adm_username} autoFocus autoComplete="username" />
              </div>
            </div>
            <div>
              <div className="field-label">{t.adm_password}</div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', insetInlineStart: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="lock" size={17} /></span>
                <input className="field" type={showPw ? 'text' : 'password'} style={{ height: 52, paddingInlineStart: 42, paddingInlineEnd: 46 }} value={password} onChange={(e) => { setPassword(e.target.value); clear(); }} placeholder={t.adm_password} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw((s) => !s)} aria-label="show/hide password" style={{ position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)', color: showPw ? 'var(--ink)' : 'var(--ink-3)', padding: 6 }}><Icon name="eye" size={18} /></button>
              </div>
            </div>
            <button className="btn btn-clay btn-lg btn-block" type="submit" disabled={busy || !username || !password} style={{ marginTop: 6, height: 54 }}>
              {busy ? <span className="spin" /> : <Icon name="logout" size={17} />} {t.adm_login}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)', color: 'var(--ink-3)', fontSize: 12 }}>
            <Icon name="shield" size={14} /> {lang === 'ar' ? 'منطقة آمنة · دخول مصرّح به فقط' : 'Secure area · authorized access only'}
          </div>
        </form>

        <button type="button" onClick={() => navigate('home')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, margin: '20px auto 0', color: 'rgba(255,255,255,.55)', fontSize: 13, fontWeight: 600, transition: 'color .15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.55)')}>
          <Icon name="arrowL" size={15} /> {t.adm_back_shop}
        </button>
      </div>
    </div>
  );
}

// ---- Dashboard --------------------------------------------
function AdminDashboard({ onLogout }) {
  const { t, lang, setLang, navigate, products, saveProduct, deleteProduct, addPhotos, toast } = useShop();
  const isMobile = useIsMobile();
  const [tab, setTab] = React.useState('overview');
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [editing, setEditing] = React.useState(undefined);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [delOrder, setDelOrder] = React.useState(null);
  const [promos, setPromos] = React.useState([]);
  const [promoForm, setPromoForm] = React.useState(null);
 // null=hidden, {}=new, {...}=editing
  const [prodQuery, setProdQuery] = React.useState('');
  const [prodCat, setProdCat] = React.useState('all');

  const loadOrders = React.useCallback(() => {
    setLoading(true);
    api.orders.list().then((data) => setOrders(data.map(normOrder))).catch((e) => toast(e.message, 'warn')).finally(() => setLoading(false));
  }, [toast]);
  React.useEffect(() => { loadOrders(); }, [loadOrders]);
  React.useEffect(() => { if (tab === 'promos') api.promo.list().then(setPromos).catch(() => {}); }, [tab]);

  // ── New-order check (silent, polls every 30s) — auto-refresh + toast ──
  const knownIds = React.useRef(null);
  React.useEffect(() => {
    const poll = async () => {
      try {
        const fresh = await api.orders.list();
        const ids = new Set(fresh.map((o) => o.id));
        if (knownIds.current === null) { knownIds.current = ids; return; }
        const newOnes = [...ids].filter((id) => !knownIds.current.has(id));
        if (newOnes.length > 0) {
          knownIds.current = ids;
          setOrders(fresh.map(normOrder));
          toast((lang === 'ar' ? '🛒 طلب جديد!' : '🛒 New order!'), 'ok');
        }
      } catch (e) {}
    };
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [toast, lang]);

  const handleStatus = async (id, status) => {
    // Optimistic: update the UI instantly, sync the server in the background.
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    setDetail((d) => (d && d.id === id ? { ...d, status } : d));
    try {
      await api.orders.setStatus(id, status);
    } catch (e) {
      toast(e.message, 'warn');
      loadOrders(); // revert to server truth on failure
    }
  };

  const removeOrder = async (id) => {
    try {
      await api.orders.remove(id);
      setOrders((os) => os.filter((o) => o.id !== id));
      setDetail((d) => (d && d.id === id ? null : d));
      toast(lang === 'ar' ? 'تم حذف الطلب' : 'Order deleted');
    } catch (e) { toast(e.message, 'warn'); }
  };
  const clearByStatus = async (status) => {
    try {
      const r = await api.orders.clear(status);
      setOrders((os) => os.filter((o) => o.status !== status));
      toast((lang === 'ar' ? 'تم حذف ' : 'Deleted ') + (r.deleted ?? 0) + (lang === 'ar' ? ' طلب' : ''));
    } catch (e) { toast(e.message, 'warn'); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const pending = orders.filter((o) => o.status === 'pending').length;
  const valid = orders.filter((o) => o.status !== 'cancelled'); // revenue excludes cancelled
  const revDay = valid.filter((o) => o.date === today).reduce((s, o) => s + o.total, 0);

  // ── Dashboard analytics ──────────────────────────────────
  const revTotal = valid.reduce((s, o) => s + o.total, 0);
  const avgOrder = valid.length ? Math.round(revTotal / valid.length) : 0;
  const delivered = orders.filter((o) => o.status === 'delivered').length;

  // 7-day revenue series (oldest → today)
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const rev = valid.filter((o) => o.date === key).reduce((s, o) => s + o.total, 0);
    return { key, rev, label: d.toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { weekday: 'short' }) };
  });
  const max7 = Math.max(1, ...days7.map((d) => d.rev));
  const rev7 = days7.reduce((s, d) => s + d.rev, 0);

  const lowStock = [];
  products.forEach((p) => p.colors.forEach((c) => { const st = stockForColor(p, c); if (st < 8) lowStock.push({ p, c, st }); }));
  let invUnits = 0, invLow = 0, invOut = 0;
  products.forEach((p) => p.colors.forEach((c) => { const st = stockForColor(p, c); invUnits += st; if (st === 0) invOut++; else if (st < 8) invLow++; }));

  let visProducts = prodCat === 'all' ? products : products.filter((p) => p.cat === prodCat);
  if (prodQuery.trim()) { const q = prodQuery.toLowerCase(); visProducts = visProducts.filter((p) => (p.name_en + ' ' + p.name_ar).toLowerCase().includes(q)); }

  let filteredOrders = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);
  if (query.trim()) { const q = query.toLowerCase(); filteredOrders = filteredOrders.filter((o) => (o.id + o.name + o.wilaya + o.commune).toLowerCase().includes(q)); }
  const statusCount = statusFilter === 'all' ? 0 : orders.filter((o) => o.status === statusFilter).length;

  const exportCSV = () => {
    const rows = [['Order', 'Customer', 'Phone', 'Wilaya', 'Commune', 'Total', 'Status', 'Date']];
    orders.forEach((o) => rows.push([o.id, o.name, o.phone, o.wilaya, o.commune, o.total, STATUS_META[o.status].en, o.date]));
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url);
    toast(lang === 'ar' ? 'تم تصدير الطلبات' : 'Orders exported');
  };

  const titles = { overview: t.adm_overview, orders: t.adm_orders, products: t.adm_products, stock: t.adm_stock, promos: lang === 'ar' ? 'الكوبونات' : 'Promo codes' };
  const subtitles = {
    overview: lang === 'ar' ? 'ملخص أداء متجرك' : 'Your store at a glance',
    orders: orders.length + ' ' + (lang === 'ar' ? 'طلب' : 'orders') + ' · ' + pending + ' ' + STATUS_META.pending[lang].toLowerCase(),
    products: products.length + ' ' + (lang === 'ar' ? 'منتج' : 'products'),
    stock: lowStock.length + ' ' + (lang === 'ar' ? 'تنبيه' : 'low-stock alerts'),
    promos: lang === 'ar' ? 'كوبونات الخصم' : 'Discount coupons',
  };

  const saveAndClose = async (f) => { await saveProduct(f); setEditing(undefined); };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ display: 'flex', minHeight: '100vh', background: '#F4F4F3' }}>
      {!isMobile && <Sidebar tab={tab} setTab={setTab} lang={lang} t={t} navigate={navigate} onLogout={onLogout} pending={pending} />}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '14px 16px' : '16px 28px' }}>
            {isMobile && <Logo onClick={() => navigate('home')} size={18} />}
            {!isMobile && (
              <div>
                <h1 style={{ fontSize: 21, fontWeight: 800 }}>{titles[tab]}</h1>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 1 }}>{subtitles[tab]}</div>
              </div>
            )}
            <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              {!isMobile && <span className="chip" style={{ cursor: 'default', gap: 8 }}><Icon name="calendar" size={15} /> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
              <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} title={lang === 'en' ? 'العربية' : 'English'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, width: isMobile ? 40 : 'auto', padding: isMobile ? 0 : '0 14px', borderRadius: isMobile ? '50%' : 999, boxShadow: 'inset 0 0 0 1.3px var(--line)', color: 'var(--ink)', fontSize: 13, fontWeight: 700, letterSpacing: '.03em', flexShrink: 0 }}>
                <Icon name="globe" size={16} /> {!isMobile && (lang === 'en' ? 'عربية' : 'EN')}
              </button>
              <button onClick={() => setTab('orders')} title={t.adm_pending} style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 1.3px var(--line)', color: 'var(--ink-2)' }}>
                <Icon name="bell" size={19} />
                {pending > 0 && <span style={{ position: 'absolute', top: 6, insetInlineEnd: 6, width: 8, height: 8, borderRadius: 9, background: 'var(--clay)', boxShadow: '0 0 0 2px var(--paper-2)' }} />}
              </button>
              {isMobile && (
                <button onClick={onLogout} title={lang === 'ar' ? 'خروج' : 'Logout'} style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 1.3px var(--line)', color: 'var(--danger)' }}>
                  <Icon name="logout" size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? '16px 16px 104px' : 28, maxWidth: 1240, width: '100%', margin: '0 auto' }} key={tab}>
          {tab === 'overview' && (
            <div>
              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${isMobile ? 142 : 180}px,1fr))`, gap: isMobile ? 10 : 14 }}>
                <StatCard label={t.adm_rev_day} value={revDay} fmt={(v) => fmtDA(v, lang)} sub={lang === 'ar' ? 'اليوم' : 'today'} delay={0} />
                <StatCard label={lang === 'ar' ? 'مداخيل 7 أيام' : 'Revenue · 7 days'} value={rev7} fmt={(v) => fmtDA(v, lang)} sub={lang === 'ar' ? 'آخر أسبوع' : 'last week'} delay={0.05} />
                <StatCard label={lang === 'ar' ? 'متوسط الطلب' : 'Avg. order'} value={avgOrder} fmt={(v) => fmtDA(v, lang)} sub={lang === 'ar' ? 'لكل طلب' : 'per order'} delay={0.1} />
                <StatCard label={t.adm_pending} value={pending} sub={lang === 'ar' ? 'بانتظار المعالجة' : 'awaiting action'} delay={0.15} />
              </div>

              {/* 7-day sales chart */}
              <div className="card adm-in" style={{ padding: 22, marginTop: 18, animationDelay: '.12s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
                  <h3 style={{ fontSize: 16 }}>{lang === 'ar' ? 'المبيعات · 7 أيام' : 'Sales · last 7 days'}</h3>
                  <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{fmtDA(rev7, lang)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 6 : 12, height: 150 }}>
                  {days7.map((d, i) => (
                    <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)' }}>{d.rev ? Math.round(d.rev / 1000) + 'k' : ''}</span>
                      <div title={fmtDA(d.rev, lang)} style={{ width: '100%', maxWidth: 46, height: Math.max(4, (d.rev / max7) * 110), background: d.key === today ? 'var(--ink)' : 'var(--sand-deep)', borderRadius: 6, transition: 'height .5s cubic-bezier(.2,.8,.2,1)' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: d.key === today ? 'var(--ink)' : 'var(--ink-3)', textTransform: 'capitalize' }}>{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent orders */}
              <div className="card adm-in" style={{ padding: 22, marginTop: 16, animationDelay: '.28s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16 }}>{lang === 'en' ? 'Recent orders' : 'الطلبات الأخيرة'}</h3>
                  <button onClick={() => setTab('orders')} style={{ fontSize: 13, fontWeight: 600, color: 'var(--clay-deep)' }}>{t.see_all}</button>
                </div>
                {loading ? <div className="center" style={{ padding: '24px 0' }}><div className="dots" style={{ display: 'inline-flex' }}><span /><span /><span /></div></div>
                  : orders.length === 0 ? <p className="dim" style={{ padding: '20px 0', fontSize: 14 }}>{t.adm_no_orders}</p>
                  : orders.slice(0, 6).map((o) => (
                  <div key={o.id} className="adm-row" onClick={() => setDetail(o)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 8px', margin: '0 -8px', borderTop: '1px solid var(--line)' }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--sand)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{initials(o.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name} {o.custom && <Icon name="spark" size={12} style={{ color: 'var(--clay)', flexShrink: 0 }} />}</div>
                      <div className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.id} · {o.wilaya.replace(/^\d+\s/, '')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap' }}>{fmtDA(o.total, lang)}</span>
                      <StatusBadge status={o.status} lang={lang} compact={isMobile} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
                  <span style={{ position: 'absolute', insetInlineStart: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="search" size={17} /></span>
                  <input className="field" style={{ height: 46, paddingInlineStart: 40 }} placeholder={t.adm_search_orders} value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <button className="btn btn-ghost" onClick={exportCSV}><Icon name="upload" size={15} /> {t.adm_export}</button>
                {statusFilter !== 'all' && statusCount > 0 && (
                  <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setDelOrder({ bulk: true, status: statusFilter, count: statusCount })}><Icon name="trash" size={15} /> {(lang === 'ar' ? 'حذف الكل' : 'Delete all')} ({statusCount})</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
                <button className={'chip' + (statusFilter === 'all' ? ' on' : '')} onClick={() => setStatusFilter('all')}>{lang === 'en' ? 'All' : 'الكل'} ({orders.length})</button>
                {STATUS_FLOW.map((s) => { const n = orders.filter((o) => o.status === s).length; return <button key={s} className={'chip' + (statusFilter === s ? ' on' : '')} onClick={() => setStatusFilter(s)}>{STATUS_META[s][lang]} ({n})</button>; })}
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {!isMobile && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 100px 110px 130px 80px', gap: 12, padding: '13px 22px', borderBottom: '1px solid var(--line)', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', background: 'var(--sand)' }}>
                    <span>{t.adm_customer}</span><span>{t.co_commune}</span><span>{t.adm_date}</span><span>{t.adm_total}</span><span>{t.adm_status}</span><span></span>
                  </div>
                )}
                {loading ? <div className="center" style={{ padding: '48px 0' }}><div className="dots" style={{ display: 'inline-flex' }}><span /><span /><span /></div></div>
                  : filteredOrders.length === 0 ? <div className="center" style={{ padding: '54px 0', color: 'var(--ink-3)' }}><Icon name="search" size={32} /><p style={{ marginTop: 10, fontSize: 14 }}>{t.adm_no_orders}</p></div>
                  : filteredOrders.map((o, i) => <OrderRow key={o.id} o={o} isMobile={isMobile} lang={lang} delay={Math.min(i, 12) * 0.025} onOpen={setDetail} onAdvance={handleStatus} onDelete={setDelOrder} />)}
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 0 }}>
                  <span style={{ position: 'absolute', insetInlineStart: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="search" size={17} /></span>
                  <input className="field" style={{ height: 46, paddingInlineStart: 40 }} placeholder={lang === 'ar' ? 'ابحث عن منتج…' : 'Search products…'} value={prodQuery} onChange={(e) => setProdQuery(e.target.value)} />
                </div>
                <button className="btn btn-clay" onClick={() => setEditing(null)}><Icon name="plus" size={17} /> {t.adm_add_product}</button>
              </div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
                {CATEGORIES.map((c) => { const n = c.id === 'all' ? products.length : products.filter((p) => p.cat === c.id).length; return <button key={c.id} className={'chip' + (prodCat === c.id ? ' on' : '')} onClick={() => setProdCat(c.id)}>{c[lang]} ({n})</button>; })}
              </div>
              {visProducts.length === 0 ? (
                <div className="center" style={{ padding: '54px 0', color: 'var(--ink-3)' }}><Icon name="tag" size={32} /><p style={{ marginTop: 10, fontSize: 14 }}>{lang === 'ar' ? 'لا توجد منتجات' : 'No products found'}</p></div>
              ) : (
                <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 10 } : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(216px,1fr))', gap: 16 }}>
                  {visProducts.map((p, idx) => {
                    const stock = totalStock(p);
                    const nPhotos = (p.photos || []).length;
                    const low = stock < 10;
                    const photoBtn = (
                      <label style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }} title={lang === 'en' ? 'Add photos' : 'إضافة صور'}>
                        <Icon name="image" size={15} />
                        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { if (e.target.files.length) addPhotos(p.id, e.target.files); e.target.value = ''; }} />
                      </label>
                    );
                    const editBtn = <button onClick={() => setEditing(p)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)' }}><Icon name="edit" size={15} /></button>;
                    const delBtn = <button onClick={() => setConfirmDel(p)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)', color: 'var(--danger)' }}><Icon name="trash" size={15} /></button>;

                    // ── Mobile: horizontal row card ──
                    if (isMobile) {
                      return (
                        <div key={p.id} className="card adm-in" style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center', animationDelay: Math.min(idx, 12) * 0.03 + 's' }}>
                          <div style={{ width: 60, height: 74, borderRadius: 10, background: colorTint(p.colors[0]), overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                            <ProductImage p={p} color={p.colors[0]} />
                            {p.new && <span className="pill pill-new" style={{ position: 'absolute', top: 4, insetInlineStart: 4, height: 17, fontSize: 9, padding: '0 6px' }}>{lang === 'en' ? 'New' : 'جديد'}</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p['name_' + lang]}</div>
                            <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>{(CATEGORIES.find((c) => c.id === p.cat) || {})[lang]}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 800, fontSize: 14.5 }}>{fmtDA(p.price, lang)}</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: low ? '#F8E0DD' : 'var(--sand)', color: low ? 'var(--danger)' : 'var(--ink-2)' }}><Icon name="layers" size={11} /> {stock}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>{editBtn}{delBtn}{photoBtn}</div>
                        </div>
                      );
                    }

                    // ── Desktop: vertical card ──
                    return (
                      <div key={p.id} className="card adm-prodcard adm-in" style={{ overflow: 'hidden', animationDelay: Math.min(idx, 12) * 0.03 + 's' }}>
                        <div style={{ aspectRatio: '1/1', background: colorTint(p.colors[0]), position: 'relative' }}>
                          <ProductImage p={p} color={p.colors[0]} />
                          {p.new && <span className="pill pill-new" style={{ position: 'absolute', top: 10, insetInlineStart: 10 }}>{lang === 'en' ? 'New' : 'جديد'}</span>}
                          <div className="prod-actions" style={{ position: 'absolute', top: 10, insetInlineEnd: 10, display: 'flex', gap: 6 }}>
                            {photoBtn}{editBtn}{delBtn}
                          </div>
                          {nPhotos > 0 && <span className="pill" style={{ position: 'absolute', bottom: 10, insetInlineStart: 10, background: 'var(--ink)', color: 'var(--paper)' }}><Icon name="image" size={11} /> {nPhotos}</span>}
                          {nPhotos === 0 && <span className="pill" style={{ position: 'absolute', bottom: 10, insetInlineStart: 10, background: 'rgba(255,255,255,.85)', color: 'var(--ink-3)' }}><Icon name="image" size={11} /> {lang === 'ar' ? 'رسم' : 'Mockup'}</span>}
                        </div>
                        <div style={{ padding: '13px 15px 15px' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p['name_' + lang]}</div>
                          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{(CATEGORIES.find((c) => c.id === p.cat) || {})[lang]}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }}>
                            <span style={{ fontWeight: 800, fontSize: 15 }}>{fmtDA(p.price, lang)}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 99, background: low ? '#F8E0DD' : 'var(--sand)', color: low ? 'var(--danger)' : 'var(--ink-2)' }}><Icon name="layers" size={12} /> {stock}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 5, marginTop: 11, flexWrap: 'wrap' }}>{p.colors.map((c) => <span key={c} style={{ width: 15, height: 15, borderRadius: 9, background: colorHex(c), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)' }} />)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'promos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn-clay" onClick={() => setPromoForm({ code: '', type: 'percent', value: 10, active: true, usageLimit: '', expiresAt: '' })}><Icon name="plus" size={17} /> {lang === 'ar' ? 'كود جديد' : 'New code'}</button>
              </div>
              {promos.length === 0
                ? <div className="center card" style={{ padding: '48px 0', color: 'var(--ink-3)' }}><Icon name="tag" size={36} /><p style={{ marginTop: 12, fontSize: 14 }}>{lang === 'ar' ? 'لا توجد كوبونات بعد' : 'No promo codes yet'}</p></div>
                : <div className="card" style={{ overflow: 'hidden' }}>
                    {!isMobile && <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .6fr .8fr .6fr .7fr 80px', gap: 12, padding: '11px 20px', background: 'var(--sand)', borderBottom: '1px solid var(--line)', fontSize: 11.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      <span>{lang === 'ar' ? 'الكود' : 'Code'}</span><span>{lang === 'ar' ? 'النوع' : 'Type'}</span><span>{lang === 'ar' ? 'القيمة' : 'Value'}</span><span>{lang === 'ar' ? 'الاستخدام' : 'Uses'}</span><span>{lang === 'ar' ? 'الحالة' : 'Status'}</span><span />
                    </div>}
                    {promos.map((p, i) => {
                      const toggle = async () => { await api.promo.update(p.id, { active: !p.active }); setPromos((ps) => ps.map((x) => x.id === p.id ? { ...x, active: !p.active } : x)); };
                      const statusBtn = (
                        <button onClick={toggle} style={{ height: 26, padding: '0 11px', borderRadius: 99, fontSize: 12, fontWeight: 700, flexShrink: 0, background: p.active ? '#E0F0E2' : '#f4f4f3', color: p.active ? '#2a6a2a' : 'var(--ink-3)' }}>{p.active ? (lang === 'ar' ? 'فعّال' : 'Active') : (lang === 'ar' ? 'موقوف' : 'Off')}</button>
                      );
                      const editBtn = <button onClick={() => setPromoForm({ ...p, usageLimit: p.usageLimit || '', expiresAt: p.expiresAt || '' })} style={{ width: 30, height: 30, borderRadius: 9, boxShadow: 'inset 0 0 0 1.3px var(--line)', display: 'grid', placeItems: 'center' }}><Icon name="edit" size={14} /></button>;
                      const delBtn = <button onClick={async () => { await api.promo.remove(p.id); setPromos((ps) => ps.filter((x) => x.id !== p.id)); toast(lang === 'ar' ? 'تم الحذف' : 'Deleted'); }} style={{ width: 30, height: 30, borderRadius: 9, boxShadow: 'inset 0 0 0 1.3px var(--line)', display: 'grid', placeItems: 'center', color: 'var(--danger)' }}><Icon name="trash" size={14} /></button>;

                      if (isMobile) {
                        return (
                          <div key={p.id} className="adm-in" style={{ padding: '14px 16px', borderTop: i ? '1px solid var(--line)' : 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '.04em', fontFamily: 'monospace' }}>{p.code}</span>
                              {statusBtn}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13 }}>
                              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--clay-deep)' }}>{p.type === 'percent' ? `-${p.value}%` : `-${p.value} DA`}</span>
                              <span className="muted">{lang === 'ar' ? 'استُخدم' : 'Used'}: {p.usedCount}{p.usageLimit ? `/${p.usageLimit}` : ''}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => setPromoForm({ ...p, usageLimit: p.usageLimit || '', expiresAt: p.expiresAt || '' })} className="btn btn-ghost btn-sm btn-block"><Icon name="edit" size={14} /> {lang === 'ar' ? 'تعديل' : 'Edit'}</button>
                              <button onClick={async () => { await api.promo.remove(p.id); setPromos((ps) => ps.filter((x) => x.id !== p.id)); toast(lang === 'ar' ? 'تم الحذف' : 'Deleted'); }} className="btn btn-ghost btn-sm btn-block" style={{ color: 'var(--danger)' }}><Icon name="trash" size={14} /> {t.adm_delete}</button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={p.id} className="adm-row adm-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr .6fr .8fr .6fr .7fr 80px', gap: 12, alignItems: 'center', padding: '13px 20px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '.04em', fontFamily: 'monospace' }}>{p.code}</span>
                          <span className="muted" style={{ fontSize: 13 }}>{p.type === 'percent' ? '%' : 'DA'}</span>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--clay-deep)' }}>{p.type === 'percent' ? `-${p.value}%` : `-${p.value} DA`}</span>
                          <span className="muted" style={{ fontSize: 13 }}>{p.usedCount}{p.usageLimit ? `/${p.usageLimit}` : ''}</span>
                          <span>{statusBtn}</span>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>{editBtn}{delBtn}</div>
                        </div>
                      );
                    })}
                  </div>}
              {promoForm !== null && (
                <div className="fade-in" onClick={() => setPromoForm(null)} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(10,10,10,.55)', display: 'grid', placeItems: 'center', padding: 24 }}>
                  <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 'min(420px, calc(100vw - 20px))', padding: 24, animation: 'fadeUp .25s' }}>
                    <h3 style={{ fontSize: 17, marginBottom: 18 }}>{promoForm.id ? (lang === 'ar' ? 'تعديل الكود' : 'Edit code') : (lang === 'ar' ? 'كود جديد' : 'New promo code')}</h3>
                    <div style={{ display: 'grid', gap: 13 }}>
                      {!promoForm.id && <div><div className="field-label">{lang === 'ar' ? 'الكود' : 'Code'}</div><input className="field" style={{ textTransform: 'uppercase' }} value={promoForm.code} onChange={(e) => setPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EX: SUMMER20" /></div>}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><div className="field-label">{lang === 'ar' ? 'النوع' : 'Type'}</div>
                          <select className="field" value={promoForm.type} onChange={(e) => setPromoForm((f) => ({ ...f, type: e.target.value }))}><option value="percent">Percent (%)</option><option value="fixed">Fixed (DA)</option></select>
                        </div>
                        <div><div className="field-label">{lang === 'ar' ? 'القيمة' : 'Value'}</div><input className="field" type="number" min="1" value={promoForm.value} onChange={(e) => setPromoForm((f) => ({ ...f, value: +e.target.value }))} /></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><div className="field-label">{lang === 'ar' ? 'حد الاستخدام' : 'Usage limit'}</div><input className="field" type="number" min="0" value={promoForm.usageLimit} onChange={(e) => setPromoForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder={lang === 'ar' ? 'فارغ = غير محدود' : 'Empty = unlimited'} /></div>
                        <div><div className="field-label">{lang === 'ar' ? 'تاريخ الانتهاء' : 'Expires'}</div><input className="field" type="date" value={promoForm.expiresAt} onChange={(e) => setPromoForm((f) => ({ ...f, expiresAt: e.target.value }))} /></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                      <button className="btn btn-ghost btn-block" onClick={() => setPromoForm(null)}>{t.adm_cancel}</button>
                      <button className="btn btn-clay btn-block" onClick={async () => {
                        try {
                          if (promoForm.id) { const u = await api.promo.update(promoForm.id, promoForm); setPromos((ps) => ps.map((x) => x.id === promoForm.id ? u : x)); }
                          else { const c = await api.promo.create(promoForm); setPromos((ps) => [c, ...ps]); }
                          toast(lang === 'ar' ? 'تم الحفظ' : 'Saved'); setPromoForm(null);
                        } catch (e) { toast(e.message, 'warn'); }
                      }}><Icon name="check" size={16} /> {t.adm_save}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'stock' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${isMobile ? 142 : 180}px,1fr))`, gap: isMobile ? 10 : 14, marginBottom: 18 }}>
                {[
                  { icon: 'layers', label: lang === 'ar' ? 'إجمالي الوحدات' : 'Total units', value: invUnits, tone: 'ink' },
                  { icon: 'box', label: lang === 'ar' ? 'مخزون منخفض' : 'Low stock', value: invLow, tone: 'warn' },
                  { icon: 'tag', label: lang === 'ar' ? 'نفد المخزون' : 'Out of stock', value: invOut, tone: 'danger' },
                ].map((s, i) => (
                  <div key={i} className="card adm-stat adm-in" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, animationDelay: i * 0.05 + 's' }}>
                    <span style={{ width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center', background: s.tone === 'ink' ? 'var(--ink)' : s.tone === 'warn' ? '#FBF0D8' : '#F8E0DD', color: s.tone === 'ink' ? 'var(--paper)' : s.tone === 'warn' ? '#B07A18' : 'var(--danger)' }}><Icon name={s.icon} size={22} /></span>
                    <div><div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}><CountUp value={s.value} /></div><div className="muted" style={{ fontSize: 12.5 }}>{s.label}</div></div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {products.map((p, idx) => {
                  const variants = p.colors.map((c) => ({ c, st: stockForColor(p, c) }));
                  const total = variants.reduce((s, v) => s + v.st, 0);
                  const out = variants.some((v) => v.st === 0), low = variants.some((v) => v.st > 0 && v.st < 8);
                  const alert = out ? { l: lang === 'ar' ? 'نفد' : 'Out', c: 'var(--danger)', bg: '#F8E0DD' } : low ? { l: lang === 'ar' ? 'منخفض' : 'Low', c: '#B07A18', bg: '#FBF0D8' } : { l: lang === 'ar' ? 'متوفر' : 'In stock', c: 'var(--good)', bg: '#E0F0E2' };
                  const variantPills = (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, flex: isMobile ? 'none' : 1, minWidth: 0, width: isMobile ? '100%' : undefined, marginTop: isMobile ? 11 : 0 }}>
                      {variants.map((v) => {
                        const lowv = v.st < 8;
                        return (
                          <span key={v.c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 99, background: lowv ? '#F8E0DD' : 'var(--sand)' }}>
                            <span style={{ width: 10, height: 10, borderRadius: 9, background: colorHex(v.c), flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.12)' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{colorLabel(v.c, lang)}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: lowv ? 'var(--danger)' : 'var(--ink)' }}>{v.st}</span>
                          </span>
                        );
                      })}
                    </div>
                  );
                  return (
                    <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? 0 : 14, rowGap: 0, padding: isMobile ? '14px 16px' : '14px 20px', borderTop: idx ? '1px solid var(--line)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: isMobile ? '100%' : 'auto', flex: isMobile ? 'none' : '0 0 auto' }}>
                        <div style={{ width: 34, height: 42, borderRadius: 7, background: colorTint(p.colors[0]), overflow: 'hidden', flexShrink: 0 }}><ProductImage p={p} color={p.colors[0]} /></div>
                        <div style={{ flex: 1, minWidth: 0, width: isMobile ? 'auto' : 190 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p['name_' + lang]}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{total} {t.adm_units}</div>
                        </div>
                        {isMobile && <span style={{ fontSize: 11, fontWeight: 800, color: alert.c, background: alert.bg, padding: '4px 10px', borderRadius: 99, flexShrink: 0 }}>{alert.l}</span>}
                      </div>
                      {variantPills}
                      {!isMobile && <span style={{ fontSize: 11, fontWeight: 800, color: alert.c, background: alert.bg, padding: '4px 10px', borderRadius: 99, flexShrink: 0 }}>{alert.l}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {isMobile && (
          <nav style={{ position: 'fixed', insetInline: 14, bottom: 14, zIndex: 50, background: 'var(--paper-2)', borderRadius: 26, display: 'flex', padding: '8px 6px', boxShadow: '0 12px 34px -8px rgba(0,0,0,.28), 0 0 0 1px rgba(0,0,0,.04)' }}>
            {[
              { id: 'overview', icon: 'chart', label: lang === 'ar' ? 'لوحة' : 'Home' },
              { id: 'orders', icon: 'bag', label: lang === 'ar' ? 'طلبات' : 'Orders', badge: pending },
              { id: 'products', icon: 'tag', label: lang === 'ar' ? 'منتجات' : 'Products' },
              { id: 'stock', icon: 'layers', label: lang === 'ar' ? 'مخزون' : 'Stock' },
              { id: 'promos', icon: 'spark', label: lang === 'ar' ? 'كوبونات' : 'Promos' },
            ].map((it) => {
              const on = tab === it.id;
              return (
                <button key={it.id} onClick={() => setTab(it.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 2px', borderRadius: 18, background: on ? 'var(--ink)' : 'transparent', color: on ? '#fff' : 'var(--ink-3)', transition: 'background .2s, color .2s' }}>
                  <span style={{ position: 'relative' }}>
                    <Icon name={it.icon} size={20} />
                    {it.badge > 0 && <span style={{ position: 'absolute', top: -5, insetInlineEnd: -7, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 99, background: 'var(--clay)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'grid', placeItems: 'center', boxShadow: on ? '0 0 0 2px var(--ink)' : 'none' }}>{it.badge}</span>}
                  </span>
                  <span style={{ fontSize: 9.5, fontWeight: on ? 800 : 600 }}>{it.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {detail && <OrderDetailModal order={detail} onClose={() => setDetail(null)} onStatus={handleStatus} onDelete={setDelOrder} lang={lang} t={t} />}
      {editing !== undefined && <ProductModal product={editing} onClose={() => setEditing(undefined)} onSave={saveAndClose} lang={lang} t={t} />}
      {confirmDel && (
        <div className="fade-in" onClick={() => setConfirmDel(null)} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(10,10,10,.55)', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 'min(360px, calc(100vw - 20px))', padding: 24, textAlign: 'center', animation: 'fadeUp .25s' }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#F8E0DD', color: 'var(--danger)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}><Icon name="trash" size={24} /></span>
            <h3 style={{ fontSize: 18 }}>{lang === 'ar' ? 'حذف المنتج؟' : 'Delete product?'}</h3>
            <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>{confirmDel['name_' + lang]}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost btn-block" onClick={() => setConfirmDel(null)}>{t.adm_cancel}</button>
              <button className="btn btn-block" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => { deleteProduct(confirmDel.id); setConfirmDel(null); }}>{t.adm_delete}</button>
            </div>
          </div>
        </div>
      )}
      {delOrder && (
        <div className="fade-in" onClick={() => setDelOrder(null)} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(10,10,10,.55)', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 'min(360px, calc(100vw - 20px))', padding: 24, textAlign: 'center', animation: 'fadeUp .25s' }}>
            <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#F8E0DD', color: 'var(--danger)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}><Icon name="trash" size={24} /></span>
            <h3 style={{ fontSize: 18 }}>{delOrder.bulk ? (lang === 'ar' ? `حذف ${delOrder.count} طلب؟` : `Delete ${delOrder.count} orders?`) : (lang === 'ar' ? 'حذف الطلب؟' : 'Delete this order?')}</h3>
            <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>{delOrder.bulk ? (lang === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء' : 'This cannot be undone.') : (delOrder.id + ' · ' + delOrder.name)}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost btn-block" onClick={() => setDelOrder(null)}>{t.adm_cancel}</button>
              <button className="btn btn-block" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => { delOrder.bulk ? clearByStatus(delOrder.status) : removeOrder(delOrder.id); setDelOrder(null); }}>{t.adm_delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Admin() {
  const [authed, setAuthed] = React.useState(() => !!getToken());
  React.useEffect(() => {
    if (getToken()) api.auth.me().then(() => setAuthed(true)).catch(() => { setToken(null); setAuthed(false); });
  }, []);
  const logout = () => { setToken(null); setAuthed(false); };
  return authed ? <AdminDashboard onLogout={logout} /> : <AdminLogin onAuthed={() => setAuthed(true)} />;
}
