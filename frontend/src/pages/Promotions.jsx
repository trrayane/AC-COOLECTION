import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { useIsMobile } from '../components/chrome/useIsMobile.js';
import { Icon } from '../components/ui/Icon.jsx';
import { ProductCard } from '../components/product/ProductCard.jsx';
import { ProductImage } from '../components/product/ProductImage.jsx';
import { colorTint, fmtDA } from '../data/constants.js';
import { shade } from '../components/garments/Garment.jsx';


export function Promotions() {
  const { t, lang, navigate, products } = useShop();
  const isMobile = useIsMobile();

  const onSale = [...products.filter((p) => p.oldPrice && p.oldPrice > p.price)]
    .sort((a, b) => (1 - b.price / b.oldPrice) - (1 - a.price / a.oldPrice));

  const hero = onSale[0];
  const rest = onSale.slice(1);

  if (onSale.length === 0) {
    return (
      <div className="wrap fade-in" style={{ paddingTop: 60, paddingBottom: 80, minHeight: '60vh', textAlign: 'center' }}>
        <span style={{ fontSize: 48 }}>🏷️</span>
        <h1 style={{ fontSize: 28, marginTop: 18 }}>{lang === 'ar' ? 'لا توجد عروض حالياً' : 'No promotions right now'}</h1>
        <p className="muted" style={{ marginTop: 10, fontSize: 15 }}>{lang === 'ar' ? 'تابعنا لمعرفة العروض القادمة' : 'Check back soon for upcoming deals'}</p>
        <button className="btn btn-clay btn-lg" style={{ marginTop: 24 }} onClick={() => navigate('catalog', {})}>{t.see_all}</button>
      </div>
    );
  }

  const heroPct = Math.round((1 - hero.price / hero.oldPrice) * 100);

  return (
    <div className="wrap fade-in" style={{ paddingTop: 28, paddingBottom: 60 }}>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow">{lang === 'ar' ? 'العروض' : 'Promotions'}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 'clamp(30px,4.5vw,46px)' }}>{lang === 'ar' ? 'التخفيضات' : 'On sale'}</h1>
          <span className="muted" style={{ fontSize: 14, fontWeight: 600 }}>{onSale.length} {lang === 'ar' ? 'منتج' : 'items'}</span>
        </div>
      </div>

      {/* Featured hero */}
      <div className="card adm-in" onClick={() => navigate('product', { id: hero.id, color: hero.colors[0] })} style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1.3fr)',
        borderRadius: 'var(--r-xl)', overflow: 'hidden', marginBottom: 28, cursor: 'pointer',
      }}>
        {/* Photo */}
        <div style={{ background: `radial-gradient(120% 120% at 50% 20%, ${colorTint(hero.colors[0])}, ${shade(colorTint(hero.colors[0]), -10)})`, position: 'relative', minHeight: isMobile ? 220 : 260 }}>
          <ProductImage p={hero} color={hero.colors[0]} />
          <span style={{ position: 'absolute', top: 14, insetInlineStart: 14, background: 'var(--clay)', color: '#fff', fontWeight: 800, fontSize: 18, padding: '5px 14px', borderRadius: 99 }}>−{heroPct}%</span>
        </div>

        {/* Info */}
        <div style={{ padding: isMobile ? '20px 20px 24px' : 'clamp(20px,3vw,36px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--clay-deep)' }}>{lang === 'ar' ? 'أفضل عرض' : 'Best deal'}</span>
            <h2 style={{ fontSize: isMobile ? 22 : 'clamp(20px,2.5vw,28px)', marginTop: 6, lineHeight: 1.2 }}>{hero['name_' + lang]}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: isMobile ? 26 : 30, fontWeight: 800, color: 'var(--clay-deep)', whiteSpace: 'nowrap' }}>{fmtDA(hero.price, lang)}</span>
            <span className="dim" style={{ fontSize: 16, textDecoration: 'line-through', whiteSpace: 'nowrap' }}>{fmtDA(hero.oldPrice, lang)}</span>
          </div>
          <p style={{ color: 'var(--good)', fontWeight: 700, fontSize: 13.5 }}>
            {lang === 'ar' ? `توفير ${fmtDA(hero.oldPrice - hero.price, lang)}` : `Save ${fmtDA(hero.oldPrice - hero.price, lang)}`}
          </p>
          <button className="btn btn-clay btn-lg" style={{ marginTop: 6, alignSelf: isMobile ? 'stretch' : 'flex-start' }} onClick={(e) => { e.stopPropagation(); navigate('product', { id: hero.id, color: hero.colors[0] }); }}>
            {lang === 'ar' ? 'اطلب الآن' : 'Shop now'} <Icon name="arrow" size={17} />
          </button>
        </div>
      </div>

      {/* Rest as card grid */}
      {rest.length > 0 && (
        <>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>{lang === 'ar' ? 'عروض أخرى' : 'More deals'}</h3>
          <div className="prod-grid">
            {rest.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
