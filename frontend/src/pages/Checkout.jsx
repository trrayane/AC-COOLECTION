/* ===========================================================
   Cart drawer · COD checkout (wired to the orders API) · confirmation
   =========================================================== */
import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { useIsMobile } from '../components/chrome/useIsMobile.js';
import { Icon } from '../components/ui/Icon.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ProductImage } from '../components/product/ProductImage.jsx';
import { Garment } from '../components/garments/Garment.jsx';
import { colorHex, colorTint, colorLabel, fmtDA, deliveryFee } from '../data/constants.js';
import { api } from '../api/client.js';

const zoneView = (zone) => (zone === 'back' ? 'back' : 'front');

// Mini preview of a custom item (front view + placements)
export function CustomMini({ item, size = 54, side = 'front' }) {
  const { getProduct } = useShop();
  const p = getProduct(item.pid);
  const cd = item.customData || {};
  if (!p) return <div style={{ width: size, height: size * 1.25, borderRadius: 9, background: 'var(--sand)', flexShrink: 0 }} />;
  const pls = (cd.placements || []).filter((pl) => zoneView(pl.zone) === side);
  const photos = (p.photos || []).map((ph) => ph.url);
  const baseImg = photos.length ? (side === 'back' ? (photos[1] || photos[0]) : photos[0]) : null;
  return (
    <div style={{ position: 'relative', width: size, height: size * 1.25, borderRadius: 9, overflow: 'hidden', background: colorTint(item.color), flexShrink: 0 }}>
      {baseImg
        ? <img src={baseImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : <Garment type={p.cat} color={colorHex(item.color)} view={side} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />}
      {pls.map((pl) => (
        <div key={pl.id} style={{ position: 'absolute', left: pl.xPct + '%', top: pl.yPct + '%', width: pl.wPct + '%', transform: `translate(-50%,-50%) rotate(${pl.rot}deg)` }}>
          {pl.type === 'image' && <img src={pl.img} style={{ width: '100%' }} />}
          {pl.type === 'text' && <div style={{ fontSize: 'calc(' + pl.wPct + ' * 0.08px + 3px)', fontWeight: 800, color: pl.color, textAlign: 'center', whiteSpace: 'nowrap' }}>{pl.text}</div>}
        </div>
      ))}
    </div>
  );
}

function CartLine({ item, idx }) {
  const { t, lang, updateQty, removeFromCart, getProduct } = useShop();
  const p = getProduct(item.pid);
  if (!p) return null;
  const unit = p.price + (item.customData && item.customData.fee ? item.customData.fee : 0);
  return (
    <div style={{ display: 'flex', gap: 13, padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
      {item.custom ? <CustomMini item={item} /> : (
        <div style={{ width: 54, height: 67, borderRadius: 9, background: colorTint(item.color), flexShrink: 0, overflow: 'hidden' }}><ProductImage p={p} color={item.color} /></div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{p['name_' + lang]}</div>
          <button onClick={() => removeFromCart(idx)} style={{ color: 'var(--ink-3)', flexShrink: 0 }}><Icon name="close" size={16} /></button>
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 11, height: 11, borderRadius: 9, background: colorHex(item.color), display: 'inline-block' }} /> {colorLabel(item.color, lang) ? colorLabel(item.color, lang) + ' · ' : ''}{item.size}
        </div>
        {item.custom && <span className="pill pill-soft" style={{ marginTop: 6 }}><Icon name="spark" size={11} /> {t.custom_badge}</span>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, boxShadow: 'inset 0 0 0 1.3px var(--line)', borderRadius: 99, padding: 2 }}>
            <button onClick={() => updateQty(idx, -1)} style={{ width: 26, height: 26, borderRadius: 99, display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}><Icon name="minus" size={14} /></button>
            <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{item.qty}</span>
            <button onClick={() => updateQty(idx, 1)} style={{ width: 26, height: 26, borderRadius: 99, display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}><Icon name="plus" size={14} /></button>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{fmtDA(unit * item.qty, lang)}</span>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { t, lang, cart, cartOpen, closeCart, navigate, cartSubtotal } = useShop();
  if (!cartOpen) return null;
  return (
    <div className="fade-in" onClick={closeCart} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(34,28,19,.45)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'absolute', insetInlineEnd: 0, top: 0, bottom: 0, width: 420, maxWidth: '92vw', background: 'var(--paper)',
        display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', animation: 'fadeIn .2s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', gap: 9 }}><Icon name="bag" size={20} /> {t.cart} <span className="muted" style={{ fontWeight: 600, fontSize: 15 }}>({cart.length})</span></span>
          <button onClick={closeCart}><Icon name="close" size={22} /></button>
        </div>
        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 30, textAlign: 'center', color: 'var(--ink-3)' }}>
            <div>
              <Icon name="bag" size={44} /><p style={{ marginTop: 14, fontSize: 16, fontWeight: 600, color: 'var(--ink-2)' }}>{t.empty_cart}</p>
              <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => { closeCart(); navigate('catalog', {}); }}>{t.see_all}</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 22px' }}>
              {cart.map((item, i) => <CartLine key={i} item={item} idx={i} />)}
            </div>
            <div style={{ padding: 22, borderTop: '1px solid var(--line)', background: 'var(--paper-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}><span className="muted">{t.co_subtotal}</span><span style={{ fontWeight: 700 }}>{fmtDA(cartSubtotal, lang)}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14 }}><Icon name="shield" size={15} /> {t.co_cod} · {lang === 'en' ? 'delivery calculated at the next step' : 'يُحسب التوصيل لاحقاً'}</div>
              <button className="btn btn-clay btn-lg btn-block" onClick={() => { closeCart(); navigate('checkout'); }}>{t.checkout} <Icon name="arrow" size={18} /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, req, err }) {
  return (
    <label style={{ display: 'block' }}>
      <span className="field-label">{label} {req && <span style={{ color: err ? 'var(--danger)' : 'var(--ink-3)' }}>*</span>}</span>
      {children}
    </label>
  );
}

export function Checkout() {
  const { t, lang, cart, cartSubtotal, navigate, placeOrder, getProduct, wilayas, communesFor, toast } = useShop();
  const isMobile = useIsMobile();
  const [form, setForm] = React.useState({ name: '', phone: '', wilaya: '', commune: '', address: '', note: '' });
  const [mode, setMode] = React.useState('home');
  const [errors, setErrors] = React.useState({});
  const [placing, setPlacing] = React.useState(false);
  const [couponInput, setCouponInput] = React.useState('');
  const [promo, setPromo] = React.useState(null);  // { code, type, value }
  const [promoErr, setPromoErr] = React.useState('');
  const [promoLoading, setPromoLoading] = React.useState(false);
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v, ...(k === 'wilaya' ? { commune: '' } : {}) }));

  const delivery = form.wilaya ? deliveryFee(form.wilaya, mode === 'desk' ? 'desk' : 'home') : 0;
  const discount = promo ? (promo.type === 'percent' ? Math.round(cartSubtotal * promo.value / 100) : Math.min(promo.value, cartSubtotal)) : 0;
  const total = cartSubtotal - discount + delivery;

  const applyPromo = async () => {
    if (!couponInput.trim()) return;
    setPromoLoading(true); setPromoErr('');
    try { const p = await api.promo.validate(couponInput); setPromo(p); setCouponInput(''); }
    catch (e) { setPromoErr(e.message); }
    finally { setPromoLoading(false); }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 1;
    // Algerian mobile: exactly 10 digits, starts with 05 / 06 / 07
    if (!/^0[567]\d{8}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 1;
    if (!form.wilaya) e.wilaya = 1;
    if (!form.commune) e.commune = 1;
    if (mode === 'home' && !form.address.trim()) e.address = 1;
    setErrors(e); return Object.keys(e).length === 0;
  };
  const submit = async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      await placeOrder({ name: form.name, phone: form.phone, wilaya: form.wilaya, commune: form.commune, address: form.address, deliveryMode: mode, note: form.note, promoCode: promo ? promo.code : undefined });
    } catch (e) {
      toast(e.message || 'Order failed', 'warn');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="wrap fade-in" style={{ padding: '80px 24px', textAlign: 'center', minHeight: '50vh' }}>
        <Icon name="bag" size={48} style={{ color: 'var(--ink-3)' }} />
        <h2 style={{ fontSize: 26, marginTop: 16 }}>{t.empty_cart}</h2>
        <button className="btn btn-clay btn-lg" style={{ marginTop: 22 }} onClick={() => navigate('catalog', {})}>{t.see_all}</button>
      </div>
    );
  }

  const errStyle = (k) => errors[k] ? { boxShadow: 'inset 0 0 0 1.8px var(--danger)' } : {};

  return (
    <div className="wrap fade-in" style={{ paddingTop: 24, minHeight: '60vh' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('catalog', {})}><Icon name="arrowL" size={15} /> {t.back}</button>
      <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', margin: '16px 0 26px' }}>{t.checkout}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 380px', gap: 32, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--clay)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>1</span> {t.co_contact}</h3>
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label={t.co_name} req err={errors.name}><input className="field" style={errStyle('name')} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={lang === 'en' ? 'e.g. Yacine Belkacem' : 'مثال: ياسين بلقاسم'} /></Field>
              <Field label={t.co_phone} req err={errors.phone}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', insetInlineStart: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="phone" size={17} /></span>
                  <input className="field" dir="ltr" type="tel" inputMode="numeric" maxLength={10}
                    style={{ paddingInlineStart: 42, ...errStyle('phone') }} value={form.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="0X XX XX XX XX" />
                </div>
                {errors.phone && <p style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 6, fontWeight: 600 }}>{lang === 'ar' ? 'رقم غير صحيح: 10 أرقام تبدأ بـ 05 أو 06 أو 07' : 'Numéro invalide : 10 chiffres commençant par 05, 06 ou 07'}</p>}
              </Field>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 17, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--clay)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>2</span> {t.co_address}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[['home', t.co_home, 'truck'], ['desk', t.co_desk, 'pin']].map(([m, label, ic]) => (
                <button key={m} onClick={() => setMode(m)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderRadius: 'var(--r-md)', textAlign: 'start',
                  background: mode === m ? 'var(--clay-wash)' : 'var(--paper-2)', boxShadow: 'inset 0 0 0 1.6px ' + (mode === m ? 'var(--clay)' : 'var(--line)'),
                }}>
                  <Icon name={ic} size={20} style={{ color: mode === m ? 'var(--clay-deep)' : 'var(--ink-3)' }} />
                  <div><div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div></div>
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <Field label={t.co_wilaya} req err={errors.wilaya}>
                <Select value={form.wilaya} onChange={(v) => set('wilaya', v)} error={errors.wilaya} searchable
                  placeholder={lang === 'en' ? 'Select…' : 'اختر…'} ariaLabel={t.co_wilaya}
                  options={wilayas.map((w) => ({ value: w, label: w }))} />
              </Field>
              <Field label={t.co_commune} req err={errors.commune}>
                <Select value={form.commune} onChange={(v) => set('commune', v)} error={errors.commune} disabled={!form.wilaya}
                  placeholder={lang === 'en' ? 'Select…' : 'اختر…'} ariaLabel={t.co_commune}
                  options={communesFor(form.wilaya).map((c) => ({ value: c, label: c }))} />
              </Field>
            </div>
            {mode === 'home' && (
              <div style={{ marginTop: 14 }}>
                <Field label={t.co_address} req err={errors.address}><input className="field" style={errStyle('address')} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder={lang === 'en' ? 'Street, neighborhood, landmark…' : 'الشارع، الحي، علامة…'} /></Field>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <Field label={t.co_note}><textarea className="field" rows="2" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder={lang === 'en' ? 'Delivery instructions…' : 'تعليمات التوصيل…'} /></Field>
            </div>
          </div>
        </div>

        <div style={{ position: isMobile ? 'static' : 'sticky', top: 84 }}>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 17, marginBottom: 14 }}>{t.co_summary}</h3>
            <div style={{ maxHeight: 240, overflow: 'auto', marginInline: -4, paddingInline: 4 }}>
              {cart.map((item, i) => {
                const p = getProduct(item.pid); if (!p) return null;
                const unit = p.price + (item.customData && item.customData.fee ? item.customData.fee : 0);
                return (
                  <div key={i} style={{ display: 'flex', gap: 11, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                    {item.custom ? <CustomMini item={item} size={42} /> : <div style={{ width: 42, height: 52, borderRadius: 8, background: colorTint(item.color), overflow: 'hidden', flexShrink: 0 }}><ProductImage p={p} color={item.color} /></div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{p['name_' + lang]}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{colorLabel(item.color, lang) ? colorLabel(item.color, lang) + ' · ' : ''}{item.size} · {t.qty} {item.qty}</div>
                      {item.custom && <span className="pill pill-soft" style={{ marginTop: 4, height: 19, fontSize: 10 }}>{t.custom_badge}</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtDA(unit * item.qty, lang)}</span>
                  </div>
                );
              })}
            </div>
            {/* ── Promo code ── */}
            <div style={{ margin: '14px 0 0', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              {promo ? (
                <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#E0F0E2', borderRadius: 10, padding: '9px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon name="tag" size={15} style={{ color: 'var(--good)' }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#2a6a2a' }}>{promo.code}</span>
                    <span style={{ fontSize: 12, color: '#2a6a2a' }}>{promo.type === 'percent' ? `-${promo.value}%` : `-${fmtDA(promo.value, lang)}`}</span>
                  </div>
                  <button onClick={() => setPromo(null)} style={{ color: '#2a6a2a', padding: 2 }}><Icon name="close" size={14} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="field" style={{ flex: 1, height: 42, fontSize: 13, textTransform: 'uppercase' }}
                    value={couponInput} onChange={(e) => { setCouponInput(e.target.value); setPromoErr(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                    placeholder={lang === 'ar' ? 'كود الخصم' : 'Promo code'} />
                  <button className="btn btn-ghost" style={{ height: 42, flexShrink: 0 }} onClick={applyPromo} disabled={promoLoading}>
                    {promoLoading ? <span className="spin" style={{ width: 14, height: 14 }} /> : (lang === 'ar' ? 'تطبيق' : 'Apply')}
                  </button>
                </div>
              )}
              {promoErr && <p className="fade-in" style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6, fontWeight: 600 }}>{promoErr}</p>}
            </div>

            <div style={{ paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}><span className="muted">{t.co_subtotal}</span><span style={{ fontWeight: 600 }}>{fmtDA(cartSubtotal, lang)}</span></div>
              {discount > 0 && <div className="fade-in" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}><span style={{ color: 'var(--good)', fontWeight: 600 }}>{lang === 'ar' ? 'تخفيض' : 'Discount'} ({promo.code})</span><span style={{ color: 'var(--good)', fontWeight: 700 }}>−{fmtDA(discount, lang)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}><span className="muted">{t.co_delivery}</span><span style={{ fontWeight: 600 }}>{form.wilaya ? fmtDA(delivery, lang) : '...'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12, borderTop: '1px solid var(--line)' }}><span style={{ fontWeight: 700 }}>{t.co_total}</span><span style={{ fontWeight: 800, fontSize: 22 }}>{fmtDA(total, lang)}</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--clay-wash)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginTop: 16 }}>
              <Icon name="shield" size={20} style={{ color: 'var(--clay-deep)', flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clay-deep)' }}>{t.co_cod}</div>
            </div>
            <button className="btn btn-clay btn-lg btn-block" style={{ marginTop: 16 }} disabled={placing} onClick={submit}>
              {placing ? <><span className="spin" /> {t.co_placing}</> : <><Icon name="check" size={18} /> {t.co_place}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Confirmation({ order }) {
  const { t, lang, navigate } = useShop();
  if (!order) { navigate('home'); return null; }
  return (
    <div className="wrap fade-in" style={{ maxWidth: 640, padding: '40px 24px 0', textAlign: 'center', minHeight: '60vh' }}>
      <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--good)', display: 'grid', placeItems: 'center', margin: '0 auto', animation: 'pop .4s' }}>
        <Icon name="check" size={46} stroke={2.6} style={{ color: '#fff' }} />
      </div>
      <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', marginTop: 26 }}>{t.co_done_t}</h1>
      <p className="muted" style={{ fontSize: 16, marginTop: 12, lineHeight: 1.6 }}>{t.co_done_s}</p>

      <div className="card" style={{ padding: 24, marginTop: 28, textAlign: 'start' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
          <div><div className="dim" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{t.co_order_no}</div><div style={{ fontSize: 24, fontWeight: 800, marginTop: 3 }}>{order.id}</div></div>
          <span className="pill pill-soft" style={{ height: 30 }}><Icon name="shield" size={13} /> {t.co_cod}</span>
        </div>
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {[[t.co_name, order.name], [t.co_phone, order.phone], [t.co_wilaya, order.wilaya + ' · ' + order.commune], [t.co_total, fmtDA(order.total, lang)]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14.5 }}><span className="muted">{k}</span><span style={{ fontWeight: 700, textAlign: lang === 'ar' ? 'left' : 'right' }} dir={k === t.co_phone ? 'ltr' : undefined}>{v}</span></div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 20, color: 'var(--ink-2)', fontSize: 14 }}>
        <Icon name="phone" size={17} style={{ color: 'var(--clay-deep)' }} /> {lang === 'en' ? 'We will call you within 24h to confirm.' : 'سنتصل بك خلال 24 ساعة للتأكيد.'}
      </div>
      <button className="btn btn-primary btn-lg" style={{ marginTop: 28 }} onClick={() => navigate('home')}>{t.co_continue}</button>
    </div>
  );
}
