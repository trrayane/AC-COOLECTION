/* ===========================================================
   Product detail — gallery, colours, sizes, CTAs, related
   =========================================================== */
import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { useIsMobile } from '../components/chrome/useIsMobile.js';
import { Icon } from '../components/ui/Icon.jsx';
import { Stars } from '../components/ui/Stars.jsx';
import { SectionHead } from '../components/ui/SectionHead.jsx';
import { ProductCard } from '../components/product/ProductCard.jsx';
import { Garment, shade } from '../components/garments/Garment.jsx';
import { colorHex, colorTint, colorLabel, fmtDA, cdn } from '../data/constants.js';

export function ProductDetail({ params }) {
  const { t, lang, navigate, addToCart, openCart, products, getProduct } = useShop();
  const isMobile = useIsMobile();
  const p = getProduct(params.id) || products[0];
  const [color, setColor] = React.useState(params.color || (p && p.colors[0]));
  const [size, setSize] = React.useState(null);
  const [view, setView] = React.useState('front');
  const [err, setErr] = React.useState(false);
  const [gi, setGi] = React.useState(0);
  const [sizeGuide, setSizeGuide] = React.useState(false);
  const [qty, setQty] = React.useState(1);
  const touchX = React.useRef(null);
  React.useEffect(() => { setGi(0); setColor(params.color || (p && p.colors[0])); setQty(1); }, [params.id]);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e, total) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return; // too short
    setGi((i) => dx < 0 ? Math.min(i + 1, total - 1) : Math.max(i - 1, 0));
  };
  // If the selected size is out of stock for the chosen colour, deselect it
  React.useEffect(() => { if (p && size && p.stock && p.stock[`${color}:${size}`] === 0) setSize(null); }, [color]);

  if (!p) return <div className="wrap dim" style={{ padding: '80px 24px' }}>{t.loading}</div>;

  const photoArr = (p.photos || []).map((ph) => ph.url);
  const hasPhotos = photoArr.length > 0;
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);

  // How many units are available for the selected color:size variant
  const stockAvail = size && p.stock && typeof p.stock[`${color}:${size}`] === 'number'
    ? p.stock[`${color}:${size}`]
    : null; // null = unlimited / not tracked

  const add = () => {
    if (!size) { setErr(true); return; }
    addToCart({ pid: p.id, color, size, qty, custom: false });
    openCart();
  };

  return (
    <div className="fade-in">
      <div className="wrap" style={{ paddingTop: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('catalog', { cat: p.cat })}><Icon name="arrowL" size={15} /> {t.back}</button>
      </div>
      <div className="wrap" style={{ paddingTop: 18, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 40, alignItems: 'start' }}>
        {/* gallery */}
        <div style={{ position: isMobile ? 'static' : 'sticky', top: 84 }}>
          <div style={{ borderRadius: 'var(--r-xl)', aspectRatio: '1/1', background: `radial-gradient(120% 120% at 50% 20%, ${colorTint(color)}, ${shade(colorTint(color), -10)})`, position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}
            onTouchStart={hasPhotos ? onTouchStart : undefined}
            onTouchEnd={hasPhotos ? (e) => onTouchEnd(e, photoArr.length) : undefined}>
            {p.new && <span className="pill pill-new" style={{ position: 'absolute', top: 18, insetInlineStart: 18, zIndex: 2 }}>{lang === 'en' ? 'New' : 'جديد'}</span>}
            {hasPhotos
              ? <img key={gi} src={cdn(photoArr[gi], 1000)} alt={p['name_' + lang]} decoding="async" className="fade-in" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <Garment type={p.cat} color={colorHex(color)} view={view} style={{ width: '100%', height: '100%', padding: 40 }} />}
            {/* Swipe dots indicator (mobile, multiple photos) */}
            {hasPhotos && photoArr.length > 1 && (
              <div style={{ position: 'absolute', bottom: 14, insetInline: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 3 }}>
                {photoArr.map((_, i) => (
                  <span key={i} onClick={() => setGi(i)} style={{ width: i === gi ? 18 : 7, height: 7, borderRadius: 99, background: '#fff', opacity: i === gi ? 1 : 0.5, transition: 'all .2s', cursor: 'pointer' }} />
                ))}
              </div>
            )}
          </div>
          {hasPhotos ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              {photoArr.map((src, i) => (
                <button key={i} onClick={() => setGi(i)} style={{
                  width: 76, height: 76, borderRadius: 'var(--r-md)', overflow: 'hidden', background: colorTint(color),
                  boxShadow: gi === i ? '0 0 0 2px var(--ink)' : 'inset 0 0 0 1px var(--line)', transition: 'box-shadow .15s',
                }}><img src={cdn(src, 160)} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              {['front', 'back'].map((v) => (
                <button key={v} onClick={() => setView(v)} style={{
                  width: 80, height: 80, borderRadius: 'var(--r-md)', overflow: 'hidden', background: colorTint(color),
                  boxShadow: view === v ? '0 0 0 2px var(--ink)' : 'inset 0 0 0 1px var(--line)',
                }}><Garment type={p.cat} color={colorHex(color)} view={v} style={{ width: '100%', height: '100%' }} /></button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Stars value={p.rating} size={15} />
            <span className="muted" style={{ fontSize: 13 }}>{p.rating} · {p.sold} {lang === 'en' ? 'sold' : 'مبيع'}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', marginTop: 12 }}>{p['name_' + lang]}</h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 14 }}>
            <span style={{ fontSize: 28, fontWeight: 800 }}>{fmtDA(p.price, lang)}</span>
            {p.oldPrice && <span className="dim" style={{ fontSize: 18, textDecoration: 'line-through' }}>{fmtDA(p.oldPrice, lang)}</span>}
            {discount > 0 && <span className="pill pill-soft">-{discount}%</span>}
          </div>
          <p className="muted" style={{ fontSize: 15.5, lineHeight: 1.65, marginTop: 18 }}>{p['desc_' + lang]}</p>

          {p.colors.length > 1 && (
            <div style={{ marginTop: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{t.select_color}</span>
                <span className="muted" style={{ fontSize: 14 }}>{colorLabel(color, lang)}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {p.colors.map((c) => (
                  <button key={c} onClick={() => setColor(c)} title={colorLabel(c, lang)} style={{
                    width: 36, height: 36, borderRadius: '50%', background: colorHex(c),
                    boxShadow: color === c ? '0 0 0 2px var(--paper), 0 0 0 4px var(--ink)' : 'inset 0 0 0 1px rgba(0,0,0,.12)',
                  }} />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{t.select_size}</span>
              <button onClick={() => setSizeGuide(true)} style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="note" size={14} /> {lang === 'ar' ? 'دليل المقاسات' : 'Size guide'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {p.sizes.map((s) => {
                const soldOut = p.stock && p.stock[`${color}:${s}`] === 0;
                return (
                  <button key={s} disabled={soldOut} onClick={() => { if (!soldOut) { setSize(s); setErr(false); setQty(1); } }}
                    title={soldOut ? (lang === 'en' ? 'Out of stock' : 'نفد المخزون') : undefined} style={{
                    minWidth: 52, height: 50, borderRadius: 12, fontWeight: 700, fontSize: 14,
                    background: size === s ? 'var(--ink)' : 'var(--paper-2)', color: soldOut ? 'var(--ink-3)' : (size === s ? 'var(--paper)' : 'var(--ink)'),
                    boxShadow: size === s ? 'none' : 'inset 0 0 0 1.5px ' + (err && !soldOut ? 'var(--danger)' : 'var(--line)'),
                    opacity: soldOut ? 0.5 : 1, cursor: soldOut ? 'not-allowed' : 'pointer', textDecoration: soldOut ? 'line-through' : 'none',
                    transition: 'all .15s',
                  }}>{s}</button>
                );
              })}
            </div>
            {err && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8, fontWeight: 600 }}>{lang === 'en' ? 'Please select a size.' : 'يرجى اختيار المقاس.'}</p>}

            {/* Stock urgency badge — only when tracked AND low */}
            {stockAvail !== null && (
              <div className="fade-in" style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700,
                color: stockAvail === 0 ? 'var(--danger)' : stockAvail <= 3 ? '#9A3A00' : '#5A6A00',
                background: stockAvail === 0 ? '#F8E0DD' : stockAvail <= 3 ? '#FBF0D8' : '#F4F8E0',
                padding: '5px 13px', borderRadius: 99 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                {stockAvail === 0
                  ? (lang === 'ar' ? 'نفد المخزون' : 'Out of stock')
                  : stockAvail <= 3
                  ? (lang === 'ar' ? `لم يتبق سوى ${stockAvail} قطعة!` : `Only ${stockAvail} left in stock!`)
                  : (lang === 'ar' ? `${stockAvail} قطعة متوفرة` : `${stockAvail} in stock`)}
              </div>
            )}
          </div>

          {/* Quantity selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{lang === 'ar' ? 'الكمية' : 'Quantity'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, boxShadow: 'inset 0 0 0 1.4px var(--line)', borderRadius: 99, padding: 3 }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 34, height: 34, borderRadius: 99, display: 'grid', placeItems: 'center', color: qty <= 1 ? 'var(--ink-3)' : 'var(--ink)' }}><Icon name="minus" size={15} /></button>
              <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 800, fontSize: 16 }}>{qty}</span>
              <button onClick={() => setQty((q) => stockAvail !== null ? Math.min(q + 1, stockAvail) : q + 1)} style={{ width: 34, height: 34, borderRadius: 99, display: 'grid', placeItems: 'center', color: (stockAvail !== null && qty >= stockAvail) ? 'var(--ink-3)' : 'var(--ink)' }}><Icon name="plus" size={15} /></button>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{fmtDA(p.price * qty, lang)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 18 }}>
            <button className="btn btn-primary btn-lg btn-block" onClick={add}><Icon name="bag" size={18} /> {t.add_cart}</button>
            <button className="btn btn-clay btn-lg btn-block" onClick={() => navigate('configurator', { id: p.id, color })}>
              <Icon name="spark" size={18} /> {t.customize}
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--line)' }}>
            {[['truck', t.feat_ship_t], ['shield', t.co_cod], ['spark', lang === 'en' ? 'Customizable' : 'قابل للتخصيص']].map(([ic, lb]) => (
              <span key={lb} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}><Icon name={ic} size={18} style={{ color: 'var(--clay-deep)' }} /> {lb}</span>
            ))}
          </div>
        </div>
      </div>

      <section className="wrap" style={{ marginTop: 70 }}>
        <SectionHead eyebrow={lang === 'en' ? 'You may also like' : 'قد يعجبك أيضاً'} title={lang === 'en' ? 'In the same spirit' : 'في نفس الأسلوب'} />
        <div className="prod-grid">{related.map((r, i) => <ProductCard key={r.id} p={r} index={i} />)}</div>
      </section>

      {/* ── Size guide modal ── */}
      {sizeGuide && (
        <div className="fade-in" onClick={() => setSizeGuide(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,10,10,.5)', display: 'grid', placeItems: isMobile ? 'end' : 'center', padding: isMobile ? 0 : 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: isMobile ? '100%' : 'min(520px, calc(100vw - 20px))', maxHeight: '90vh', overflow: 'auto', borderRadius: isMobile ? '22px 22px 0 0' : 'var(--r-lg)', animation: 'fadeUp .25s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--paper-2)', zIndex: 2 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18 }}>{lang === 'ar' ? 'دليل المقاسات' : 'Size guide'}</h3>
              <button onClick={() => setSizeGuide(false)}><Icon name="close" size={22} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p className="muted" style={{ fontSize: 13.5, marginBottom: 18 }}>{lang === 'ar' ? 'قيس مقاسك بمتر القياس وقارنه بالجدول أدناه.' : 'Measure yourself with a tape measure and compare with the table below.'}</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: 'var(--ink)', color: '#fff' }}>
                      {[lang === 'ar' ? 'المقاس' : 'Size', lang === 'ar' ? 'الصدر (سم)' : 'Chest (cm)', lang === 'ar' ? 'الخصر (سم)' : 'Waist (cm)', lang === 'ar' ? 'الوزن (kg)' : 'Weight (kg)'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: 12.5, letterSpacing: '.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['XS', '82–86',  '66–70',  '50–58'],
                      ['S',  '88–92',  '72–76',  '58–68'],
                      ['M',  '94–98',  '78–82',  '68–78'],
                      ['L',  '100–104','84–88',  '78–90'],
                      ['XL', '106–110','90–94',  '90–100'],
                      ['XXL','112–118','96–102', '100–115'],
                    ].map(([sz, ch, wt, kg], i) => (
                      <tr key={sz} style={{ background: i % 2 ? 'var(--paper-2)' : 'var(--paper)' }}>
                        <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 800, fontSize: 15 }}>{sz}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>{ch}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>{wt}</td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>{kg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="dim" style={{ fontSize: 12, marginTop: 14 }}>{lang === 'ar' ? '💡 في حالة الشك بين مقاسين، نوصي باختيار المقاس الأكبر.' : '💡 When in doubt between two sizes, we recommend choosing the larger one.'}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
