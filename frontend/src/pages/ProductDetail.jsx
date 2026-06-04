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
import { colorHex, colorTint, colorLabel, fmtDA } from '../data/constants.js';

export function ProductDetail({ params }) {
  const { t, lang, navigate, addToCart, openCart, products, getProduct } = useShop();
  const isMobile = useIsMobile();
  const p = getProduct(params.id) || products[0];
  const [color, setColor] = React.useState(params.color || (p && p.colors[0]));
  const [size, setSize] = React.useState(null);
  const [view, setView] = React.useState('front');
  const [err, setErr] = React.useState(false);
  const [gi, setGi] = React.useState(0);
  const touchX = React.useRef(null);
  React.useEffect(() => { setGi(0); setColor(params.color || (p && p.colors[0])); }, [params.id]);

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

  const add = () => {
    if (!size) { setErr(true); return; }
    addToCart({ pid: p.id, color, size, qty: 1, custom: false });
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
              ? <img key={gi} src={photoArr[gi]} alt={p['name_' + lang]} className="fade-in" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
                }}><img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>
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
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{t.select_size}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {p.sizes.map((s) => {
                const soldOut = p.stock && p.stock[`${color}:${s}`] === 0;
                return (
                  <button key={s} disabled={soldOut} onClick={() => { if (soldOut) return; setSize(s); setErr(false); }}
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
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 30 }}>
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
    </div>
  );
}
