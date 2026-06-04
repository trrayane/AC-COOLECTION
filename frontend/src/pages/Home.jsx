/* ===========================================================
   Home page — hero variants + sections
   =========================================================== */
import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { Icon } from '../components/ui/Icon.jsx';
import { SectionHead } from '../components/ui/SectionHead.jsx';
import { ProductCard } from '../components/product/ProductCard.jsx';
import { Garment, GarmentTile, shade } from '../components/garments/Garment.jsx';
import { colorHex, colorTint } from '../data/constants.js';
import heroImg from '../assets/hero.jpg';

function HeroSplit() {
  const { t, lang, navigate } = useShop();
  return (
    <section className="wrap" style={{ paddingTop: 28 }}>
      <div className="hero-split" style={{
        display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,1fr)', gap: 8, alignItems: 'stretch',
        borderRadius: 'var(--r-xl)', overflow: 'hidden', minHeight: 540,
      }}>
        <div style={{ background: 'var(--sand)', padding: 'clamp(28px,5vw,64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span className="eyebrow fade-up" style={{ color: 'var(--clay-deep)' }}>{t.hero_eyebrow}</span>
          <h1 className="fade-up" style={{ fontSize: 'clamp(44px,6vw,86px)', lineHeight: 0.95, marginTop: 18, animationDelay: '.05s' }}>
            {t.hero_title}<br /><span className="serif-i" style={{ color: 'var(--clay)', fontWeight: 400 }}>{t.hero_title_em}</span>
          </h1>
          <p className="fade-up muted" style={{ fontSize: 17, lineHeight: 1.6, maxWidth: 440, marginTop: 22, animationDelay: '.1s' }}>{t.hero_sub}</p>
          <div className="fade-up" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 30, animationDelay: '.15s' }}>
            <button className="btn btn-clay btn-lg" onClick={() => navigate('catalog', {})}>{t.hero_cta} <Icon name="arrow" size={18} /></button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('configurator', {})}><Icon name="spark" size={17} /> {t.hero_cta2}</button>
          </div>
        </div>
        <div style={{ position: 'relative', background: 'linear-gradient(160% 100% at 60% 20%, #F4F4F3, #E9E9E7)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          <img src={heroImg} alt="Premium tee" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 22, insetInlineStart: 22, background: 'var(--paper-2)', borderRadius: 'var(--r-md)', padding: '12px 16px', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--clay-wash)', display: 'grid', placeItems: 'center', color: 'var(--clay-deep)' }}><Icon name="spark" size={20} /></span>
            <div><div style={{ fontWeight: 700, fontSize: 13 }}>{lang === 'en' ? 'Customizable' : 'قابل للتخصيص'}</div><div className="dim" style={{ fontSize: 12 }}>{lang === 'en' ? 'Logo · text · position' : 'شعار · نص · موضع'}</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureBand() {
  const { t } = useShop();
  const feats = [
    { icon: 'spark', h: t.feat_custom_t, s: t.feat_custom_s },
    { icon: 'truck', h: t.feat_ship_t, s: t.feat_ship_s },
    { icon: 'shield', h: t.feat_cod_t, s: t.feat_cod_s },
  ];
  return (
    <section className="wrap" style={{ marginTop: 64 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
        {feats.map((f) => (
          <div key={f.h} className="card" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--clay-wash)', color: 'var(--clay-deep)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={f.icon} size={23} /></span>
            <div><h3 style={{ fontSize: 16, fontWeight: 700 }}>{f.h}</h3><p className="muted" style={{ fontSize: 14, lineHeight: 1.55, marginTop: 5 }}>{f.s}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryStrip() {
  const { t, lang, navigate, products } = useShop();
  const photoFor = (id) => { const p = products.find((x) => x.cat === id && x.photos && x.photos.length); return p ? p.photos[0].url : null; };
  const cats = [
    { id: 'tshirt', label: t.nav_tshirt, color: 'ink' },
    { id: 'pull', label: t.nav_pull, color: 'slate' },
    { id: 'hoodie', label: t.nav_hoodie, color: 'ink' },
  ];
  return (
    <section className="wrap" style={{ marginTop: 72 }}>
      <SectionHead eyebrow={lang === 'en' ? 'Categories' : 'الفئات'} title={t.shop_cat} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
        {cats.map((c) => {
          const img = photoFor(c.id);
          const n = products.filter((x) => x.cat === c.id).length;
          const sub = lang === 'en' ? `${n} ${n === 1 ? 'style' : 'styles'}` : `${n} موديل`;
          return (
            <button key={c.id} onClick={() => navigate('catalog', { cat: c.id })} className="cat-card" style={{
              position: 'relative', textAlign: 'start', borderRadius: 'var(--r-lg)', overflow: 'hidden', aspectRatio: '5/4',
              background: `radial-gradient(120% 110% at 70% 15%, ${colorTint(c.color)}, ${shade(colorTint(c.color), -10)})`,
            }}>
              {img
                ? <img src={img} alt={c.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ position: 'absolute', inset: 0, transform: 'translateX(14%)' }}><GarmentTile type={c.id} color={colorHex(c.color)} /></div>}
              <div style={{ position: 'absolute', insetInline: 0, bottom: 0, height: '52%', background: 'linear-gradient(transparent, rgba(0,0,0,.6))', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', insetInlineStart: 22, bottom: 20, zIndex: 2 }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', color: '#fff' }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.8)' }}>{sub}</div>
              </div>
              <span style={{ position: 'absolute', top: 18, insetInlineEnd: 18, width: 38, height: 38, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)', zIndex: 2 }}><Icon name="arrow" size={18} /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CustomPromo() {
  const { t, lang, navigate } = useShop();
  const steps = lang === 'en'
    ? [['Upload', 'PNG or SVG logo'], ['Place', 'Front, back, sleeve…'], ['Annotate', 'Your instructions'], ['Order', 'We print & deliver']]
    : [['حمّل', 'شعار PNG أو SVG'], ['ضع', 'أمام، خلف، كُم…'], ['دوّن', 'تعليماتك'], ['اطلب', 'نطبع ونوصّل']];
  return (
    <section className="wrap" style={{ marginTop: 80 }}>
      <div style={{ borderRadius: 'var(--r-xl)', background: 'var(--ink)', color: 'var(--paper)', padding: 'clamp(28px,4vw,52px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', insetInlineEnd: '-4%', top: '-20%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.12), transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 560 }}>
          <span className="eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>{lang === 'en' ? 'Customization studio' : 'استوديو التخصيص'}</span>
          <h2 style={{ fontSize: 'clamp(30px,4.5vw,48px)', marginTop: 12 }}>{t.feat_custom_t}</h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.72)', marginTop: 14, maxWidth: 460 }}>{t.feat_custom_s}</p>
        </div>
        <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginTop: 34 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 'var(--r-md)', padding: '18px 18px 20px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14)' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--paper)', color: 'var(--ink)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14 }}>{i + 1}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 12 }}>{s[0]}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>{s[1]}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-lg" style={{ marginTop: 30, position: 'relative', zIndex: 2, background: 'var(--paper)', color: 'var(--ink)' }} onClick={() => navigate('configurator', {})}>
          {t.hero_cta2} <Icon name="arrow" size={18} />
        </button>
      </div>
    </section>
  );
}

export function Home() {
  const { t, lang, navigate, products } = useShop();
  const newIn = products.filter((p) => p.new).slice(0, 4);
  const best = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);
  return (
    <div className="fade-in">
      <HeroSplit />
      <FeatureBand />
      <section className="wrap" style={{ marginTop: 76 }}>
        <SectionHead eyebrow={t.new_sub} title={t.new_in} action={t.see_all} onAction={() => navigate('catalog', { filter: 'new' })} />
        <div className="prod-grid">
          {newIn.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      </section>
      <CategoryStrip />
      <CustomPromo />
      <section className="wrap" style={{ marginTop: 80 }}>
        <SectionHead eyebrow={lang === 'en' ? 'Most loved' : 'الأكثر طلباً'} title={t.bestsellers} action={t.see_all} onAction={() => navigate('catalog', { sort: 'pop' })} />
        <div className="prod-grid">
          {best.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
        </div>
      </section>
    </div>
  );
}
