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

function StatusBadge({ status, lang, onClick, title }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  const Tag = onClick ? 'button' : 'span';
  return <Tag onClick={onClick} title={title} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 11px', borderRadius: 99, fontSize: 12, fontWeight: 700, color: m.color, background: m.bg, whiteSpace: 'nowrap', cursor: onClick ? 'pointer' : 'default' }}>
    <span style={{ width: 6, height: 6, borderRadius: 9, background: m.dot }} /> {m[lang]}
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

function OrderDetailModal({ order, onClose, onStatus, lang, t }) {
  const isMobile = useIsMobile();
  const { getProduct } = useShop();
  const productFor = (it) => getProduct(it.pid) || { id: it.pid, cat: 'tshirt', name_en: it.productName || 'Product', name_ar: it.productName || 'منتج', colors: [it.color || 'ink'], photos: [] };
  // Force-download URL (Cloudinary fl_attachment keeps the customer's original file/format)
  const dl = (url) => (typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/upload/')) ? url.replace('/upload/', '/upload/fl_attachment/') : url;
  const designFiles = order.items.filter((i) => i.custom).flatMap((i) => ((i.customData && i.customData.placements) || []).filter((pl) => pl.type === 'image' && pl.img).map((pl) => ({ url: pl.img, side: zoneView(pl.zone) })));
  return (
    <div className="fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(10,10,10,.55)', display: 'grid', placeItems: isMobile ? 'end' : 'center', padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 720, maxWidth: '100%', maxHeight: '92vh', overflow: 'auto', animation: 'fadeUp .28s cubic-bezier(.2,.8,.2,1)', borderRadius: isMobile ? '22px 22px 0 0' : 'var(--r-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--paper-2)', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontWeight: 800, fontSize: 20 }}>{order.id}</span><StatusBadge status={order.status} lang={lang} /></div>
          <button onClick={onClose}><Icon name="close" size={22} /></button>
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>{t.adm_customer}</div>
            <div style={{ display: 'grid', gap: 11 }}>
              {[['user', order.name], ['phone', order.phone], ['pin', order.wilaya + ' · ' + order.commune]].map(([ic, v]) => (
                <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5 }}><Icon name={ic} size={17} style={{ color: 'var(--ink-3)' }} /> <span dir={ic === 'phone' ? 'ltr' : undefined} style={{ fontWeight: 600 }}>{v}</span></div>
              ))}
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
            <div className="eyebrow" style={{ margin: '22px 0 12px' }}>{t.adm_status}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {STATUS_FLOW.map((s) => (
                <button key={s} onClick={() => onStatus(order.id, s)} style={{ height: 32, padding: '0 12px', borderRadius: 99, fontSize: 12.5, fontWeight: 700, transition: 'all .15s',
                  background: order.status === s ? STATUS_META[s].bg : 'var(--paper)', color: order.status === s ? STATUS_META[s].color : 'var(--ink-3)',
                  boxShadow: order.status === s ? 'inset 0 0 0 1.5px ' + STATUS_META[s].color : 'inset 0 0 0 1.3px var(--line)' }}>{STATUS_META[s][lang]}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onSave, lang, t }) {
  const isNew = !product;
  const { removePhotoAt } = useShop();
  const [f, setF] = React.useState(product || { name_en: '', name_ar: '', cat: 'tshirt', price: 3000, colors: ['ink'], sizes: SIZES, new: true, _photos: [] });
  const [saving, setSaving] = React.useState(false);
  const addPending = (file) => setF((s) => ({ ...s, _photos: [...(s._photos || []), file] }));
  const removePending = (i) => setF((s) => ({ ...s, _photos: (s._photos || []).filter((_, idx) => idx !== i) }));
  const removeExisting = (photoId) => { removePhotoAt(f.id, photoId); setF((s) => ({ ...s, photos: (s.photos || []).filter((ph) => ph.id !== photoId) })); };
  const save = async () => { setSaving(true); try { await onSave(f); } finally { setSaving(false); } };
  return (
    <div className="fade-in" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(10,10,10,.55)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 560, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto', animation: 'fadeUp .28s cubic-bezier(.2,.8,.2,1)' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t.category}>
              <Select value={f.cat} onChange={(v) => setF({ ...f, cat: v })} ariaLabel={t.category} options={CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({ value: c.id, label: c[lang] }))} />
            </Field>
            <Field label={t.price + ' (DA)'}><input className="field" type="number" value={f.price} onChange={(e) => setF({ ...f, price: +e.target.value })} /></Field>
          </div>
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
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 24px 24px' }}>
          <button className="btn btn-ghost btn-block" onClick={onClose}>{t.adm_cancel}</button>
          <button className="btn btn-clay btn-block" disabled={saving} onClick={save}>{saving ? <span className="spin" /> : <Icon name="check" size={17} />} {isNew ? t.adm_add_product : t.adm_save}</button>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ o, isMobile, lang, onOpen, onAdvance, delay }) {
  const nxt = nextStatus(o.status);
  if (isMobile) {
    return (
      <div className="adm-row adm-in" onClick={() => onOpen(o)} style={{ borderBottom: '1px solid var(--line)', padding: 14, animationDelay: (delay || 0) + 's' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--sand)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{initials(o.name)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>{o.id} {o.custom && <Icon name="spark" size={12} style={{ color: 'var(--clay)' }} />}</div>
            <div className="muted" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name} · {o.wilaya.replace(/^\d+\s/, '')}</div>
          </div>
          <div style={{ textAlign: 'end' }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>{fmtDA(o.total, lang)}</div><StatusBadge status={o.status} lang={lang} /></div>
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
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: '#0E0E0E', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 45% at 50% 0%, rgba(255,255,255,.07), transparent 70%)' }} />
      <form onSubmit={submit} className="fade-up" style={{ position: 'relative', width: 400, maxWidth: '100%', background: 'var(--paper)', borderRadius: 'var(--r-xl)', padding: '34px 32px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--ink)', color: '#fff', display: 'grid', placeItems: 'center' }}><Icon name="lock" size={24} /></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}><Logo size={22} /></div>
        <h1 style={{ fontSize: 22, textAlign: 'center', marginTop: 14 }}>{lang === 'ar' ? 'لوحة الإدارة' : 'Admin dashboard'}</h1>
        <p className="muted center" style={{ fontSize: 13.5, marginTop: 6, marginBottom: 22 }}>{lang === 'ar' ? 'سجّل الدخول لإدارة متجرك' : 'Sign in to manage your store'}</p>

        {error && (
          <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#F8E0DD', color: 'var(--danger)', borderRadius: 'var(--r-md)', padding: '11px 14px', fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
            <Icon name="close" size={16} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: 13 }}>
          <div>
            <div className="field-label">{t.adm_username}</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', insetInlineStart: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="user" size={17} /></span>
              <input className="field" style={{ paddingInlineStart: 40 }} value={username} onChange={(e) => { setUsername(e.target.value); clear(); }} placeholder={t.adm_username} autoFocus autoComplete="username" />
            </div>
          </div>
          <div>
            <div className="field-label">{t.adm_password}</div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', insetInlineStart: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="lock" size={17} /></span>
              <input className="field" type={showPw ? 'text' : 'password'} style={{ paddingInlineStart: 40, paddingInlineEnd: 44 }} value={password} onChange={(e) => { setPassword(e.target.value); clear(); }} placeholder={t.adm_password} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw((s) => !s)} aria-label="show/hide password" style={{ position: 'absolute', insetInlineEnd: 8, top: '50%', transform: 'translateY(-50%)', color: showPw ? 'var(--ink)' : 'var(--ink-3)', padding: 6 }}><Icon name="eye" size={18} /></button>
            </div>
          </div>
          <button className="btn btn-clay btn-lg btn-block" type="submit" disabled={busy || !username || !password} style={{ marginTop: 4 }}>
            {busy ? <span className="spin" /> : <Icon name="logout" size={17} />} {t.adm_login}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18, color: 'var(--ink-3)', fontSize: 12 }}>
          <Icon name="shield" size={14} /> {lang === 'ar' ? 'منطقة آمنة · دخول مصرّح به فقط' : 'Secure area · authorized access only'}
        </div>
        <button type="button" className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 14 }} onClick={() => navigate('home')}><Icon name="arrowL" size={15} /> {t.adm_back_shop}</button>
      </form>
    </div>
  );
}

// ---- Dashboard --------------------------------------------
function AdminDashboard({ onLogout }) {
  const { t, lang, navigate, products, saveProduct, deleteProduct, addPhotos, toast } = useShop();
  const isMobile = useIsMobile();
  const [tab, setTab] = React.useState('overview');
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [editing, setEditing] = React.useState(undefined);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [prodQuery, setProdQuery] = React.useState('');
  const [prodCat, setProdCat] = React.useState('all');

  const loadOrders = React.useCallback(() => {
    setLoading(true);
    api.orders.list().then((data) => setOrders(data.map(normOrder))).catch((e) => toast(e.message, 'warn')).finally(() => setLoading(false));
  }, [toast]);
  React.useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleStatus = async (id, status) => {
    try {
      const updated = await api.orders.setStatus(id, status);
      setOrders((os) => os.map((o) => (o.id === id ? normOrder(updated) : o)));
      setDetail((d) => (d && d.id === id ? { ...d, status } : d));
      toast(t.adm_status + ' → ' + STATUS_META[status][lang]);
    } catch (e) { toast(e.message, 'warn'); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const pending = orders.filter((o) => o.status === 'pending').length;
  const revDay = orders.filter((o) => o.date === today && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const lowStock = [];
  products.forEach((p) => p.colors.forEach((c) => { const st = stockForColor(p, c); if (st < 8) lowStock.push({ p, c, st }); }));
  let invUnits = 0, invLow = 0, invOut = 0;
  products.forEach((p) => p.colors.forEach((c) => { const st = stockForColor(p, c); invUnits += st; if (st === 0) invOut++; else if (st < 8) invLow++; }));

  let visProducts = prodCat === 'all' ? products : products.filter((p) => p.cat === prodCat);
  if (prodQuery.trim()) { const q = prodQuery.toLowerCase(); visProducts = visProducts.filter((p) => (p.name_en + ' ' + p.name_ar).toLowerCase().includes(q)); }

  let filteredOrders = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);
  if (query.trim()) { const q = query.toLowerCase(); filteredOrders = filteredOrders.filter((o) => (o.id + o.name + o.wilaya + o.commune).toLowerCase().includes(q)); }

  const exportCSV = () => {
    const rows = [['Order', 'Customer', 'Phone', 'Wilaya', 'Commune', 'Total', 'Status', 'Date']];
    orders.forEach((o) => rows.push([o.id, o.name, o.phone, o.wilaya, o.commune, o.total, STATUS_META[o.status].en, o.date]));
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url);
    toast(lang === 'ar' ? 'تم تصدير الطلبات' : 'Orders exported');
  };

  const titles = { overview: t.adm_overview, orders: t.adm_orders, products: t.adm_products, stock: t.adm_stock };
  const subtitles = {
    overview: lang === 'ar' ? 'ملخص أداء متجرك' : 'Your store at a glance',
    orders: orders.length + ' ' + (lang === 'ar' ? 'طلب' : 'orders') + ' · ' + pending + ' ' + STATUS_META.pending[lang].toLowerCase(),
    products: products.length + ' ' + (lang === 'ar' ? 'منتج' : 'products'),
    stock: lowStock.length + ' ' + (lang === 'ar' ? 'تنبيه' : 'low-stock alerts'),
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
              <button onClick={() => setTab('orders')} title={t.adm_pending} style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 1.3px var(--line)', color: 'var(--ink-2)' }}>
                <Icon name="bell" size={19} />
                {pending > 0 && <span style={{ position: 'absolute', top: 6, insetInlineEnd: 6, width: 8, height: 8, borderRadius: 9, background: 'var(--clay)', boxShadow: '0 0 0 2px var(--paper-2)' }} />}
              </button>
            </div>
          </div>
          {isMobile && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px' }} className="no-bar">
              {['overview', 'orders', 'products', 'stock'].map((id) => (
                <button key={id} onClick={() => setTab(id)} className={'chip' + (tab === id ? ' on' : '')} style={{ flexShrink: 0 }}>{titles[id]}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: isMobile ? 16 : 28, maxWidth: 1240, width: '100%', margin: '0 auto' }} key={tab}>
          {tab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                <StatCard label={t.adm_rev_day} value={revDay} fmt={(v) => fmtDA(v, lang)} trend={12} sub={lang === 'ar' ? 'مقارنة بالأمس' : 'vs yesterday'} delay={0} />
                <StatCard label={t.adm_orders_n} value={orders.length} trend={5} sub={lang === 'ar' ? 'الإجمالي' : 'all time'} delay={0.05} />
                <StatCard label={t.adm_pending} value={pending} sub={lang === 'ar' ? 'بانتظار المعالجة' : 'awaiting action'} delay={0.1} />
              </div>

              <div className="card adm-in" style={{ padding: 22, marginTop: 18, animationDelay: '.12s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16 }}>{lang === 'en' ? 'Recent orders' : 'الطلبات الأخيرة'}</h3>
                  <button onClick={() => setTab('orders')} style={{ fontSize: 13, fontWeight: 600, color: 'var(--clay-deep)' }}>{t.see_all}</button>
                </div>
                {loading ? <p className="dim" style={{ padding: '20px 0', fontSize: 14 }}>{t.loading}</p>
                  : orders.length === 0 ? <p className="dim" style={{ padding: '20px 0', fontSize: 14 }}>{t.adm_no_orders}</p>
                  : orders.slice(0, 6).map((o) => (
                  <div key={o.id} className="adm-row" onClick={() => setDetail(o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 8px', margin: '0 -8px', borderTop: '1px solid var(--line)' }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--sand)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{initials(o.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>{o.name} {o.custom && <Icon name="spark" size={12} style={{ color: 'var(--clay)' }} />}</div>
                      <div className="muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.id} · {o.wilaya.replace(/^\d+\s/, '')}</div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{fmtDA(o.total, lang)}</span>
                    <StatusBadge status={o.status} lang={lang} />
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
                {loading ? <div className="center dim" style={{ padding: '40px 0', fontSize: 14 }}>{t.loading}</div>
                  : filteredOrders.length === 0 ? <div className="center" style={{ padding: '54px 0', color: 'var(--ink-3)' }}><Icon name="search" size={32} /><p style={{ marginTop: 10, fontSize: 14 }}>{t.adm_no_orders}</p></div>
                  : filteredOrders.map((o, i) => <OrderRow key={o.id} o={o} isMobile={isMobile} lang={lang} delay={Math.min(i, 12) * 0.025} onOpen={setDetail} onAdvance={handleStatus} />)}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(216px,1fr))', gap: 16 }}>
                  {visProducts.map((p, idx) => {
                    const stock = totalStock(p);
                    const nPhotos = (p.photos || []).length;
                    const low = stock < 10;
                    return (
                      <div key={p.id} className="card adm-prodcard adm-in" style={{ overflow: 'hidden', animationDelay: Math.min(idx, 12) * 0.03 + 's' }}>
                        <div style={{ aspectRatio: '1/1', background: colorTint(p.colors[0]), position: 'relative' }}>
                          <ProductImage p={p} color={p.colors[0]} />
                          {p.new && <span className="pill pill-new" style={{ position: 'absolute', top: 10, insetInlineStart: 10 }}>{lang === 'en' ? 'New' : 'جديد'}</span>}
                          <div className="prod-actions" style={{ position: 'absolute', top: 10, insetInlineEnd: 10, display: 'flex', gap: 6 }}>
                            <label style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }} title={lang === 'en' ? 'Add photos' : 'إضافة صور'}>
                              <Icon name="image" size={15} />
                              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { if (e.target.files.length) addPhotos(p.id, e.target.files); e.target.value = ''; }} />
                            </label>
                            <button onClick={() => setEditing(p)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)' }}><Icon name="edit" size={15} /></button>
                            <button onClick={() => setConfirmDel(p)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)', color: 'var(--danger)' }}><Icon name="trash" size={15} /></button>
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

          {tab === 'stock' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
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
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '14px 16px' : '14px 20px', borderTop: idx ? '1px solid var(--line)' : 'none', flexWrap: 'wrap' }}>
                      <div style={{ width: 34, height: 42, borderRadius: 7, background: colorTint(p.colors[0]), overflow: 'hidden', flexShrink: 0 }}><ProductImage p={p} color={p.colors[0]} /></div>
                      <div style={{ width: 190, minWidth: 150, flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p['name_' + lang]}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{total} {t.adm_units}</div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, flex: 1, minWidth: 0 }}>
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
                      <span style={{ fontSize: 11, fontWeight: 800, color: alert.c, background: alert.bg, padding: '4px 10px', borderRadius: 99, flexShrink: 0 }}>{alert.l}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {detail && <OrderDetailModal order={detail} onClose={() => setDetail(null)} onStatus={handleStatus} lang={lang} t={t} />}
      {editing !== undefined && <ProductModal product={editing} onClose={() => setEditing(undefined)} onSave={saveAndClose} lang={lang} t={t} />}
      {confirmDel && (
        <div className="fade-in" onClick={() => setConfirmDel(null)} style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(10,10,10,.55)', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 360, padding: 24, textAlign: 'center', animation: 'fadeUp .25s' }}>
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
