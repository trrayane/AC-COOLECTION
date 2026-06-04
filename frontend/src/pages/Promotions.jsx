import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { Icon } from '../components/ui/Icon.jsx';
import { ProductCard } from '../components/product/ProductCard.jsx';
import { ProductImage } from '../components/product/ProductImage.jsx';
import { colorTint, fmtDA } from '../data/constants.js';
import { shade } from '../components/garments/Garment.jsx';

export function Promotions() {
  const { t, lang, navigate, products } = useShop();

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
      <div className="card adm-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.3fr)', borderRadius: 'var(--r-xl)', overflow: 'hidden', marginBottom: 28, minHeight: 260 }}>
        {/* Photo */}
        <div style={{ background: `radial-gradient(120% 120% at 50% 20%, ${colorTint(hero.colors[0])}, ${shade(colorTint(hero.colors[0]), -10)})`, position: 'relative', minHeight: 220 }}>
          <ProductImage p={hero} color={hero.colors[0]} />
          <span style={{ position: 'absolute', top: 16, insetInlineStart: 16, background: 'var(--clay)', color: '#fff', fontWeight: 800, fontSize: 20, padding: '6px 16px', borderRadius: 99 }}>−{heroPct}%</span>
        </div>

        {/* Info */}
        <div style={{ padding: 'clamp(20px,3vw,36px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
          <div>
            <span className="eyebrow" style={{ color: 'var(--clay-deep)' }}>{lang === 'ar' ? 'أفضل عرض' : 'Best deal'}</span>
            <h2 style={{ fontSize: 'clamp(20px,2.5vw,28px)', marginTop: 6, lineHeight: 1.2 }}>{hero['name_' + lang]}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--clay-deep)' }}>{fmtDA(hero.price, lang)}</span>
            <span className="dim" style={{ fontSize: 17, textDecoration: 'line-through' }}>{fmtDA(hero.oldPrice, lang)}</span>
          </div>
          <p style={{ color: 'var(--good)', fontWeight: 700, fontSize: 14 }}>
            {lang === 'ar' ? `توفير ${fmtDA(hero.oldPrice - hero.price, lang)}` : `Save ${fmtDA(hero.oldPrice - hero.price, lang)}`}
          </p>
          <button className="btn btn-clay btn-lg" style={{ marginTop: 4, alignSelf: 'flex-start' }} onClick={() => navigate('product', { id: hero.id, color: hero.colors[0] })}>
            {lang === 'ar' ? 'اطلب الآن' : 'Shop now'} <Icon name="arrow" size={17} />
          </button>
        </div>
      </div>

      {/* Rest as compact list */}
      {rest.length > 0 && (
        <>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>{lang === 'ar' ? 'عروض أخرى' : 'More deals'}</h3>
          <div style={{ display: 'grid', gap: 1, borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
            {rest.map((p) => {
              const pct = Math.round((1 - p.price / p.oldPrice) * 100);
              const saving = p.oldPrice - p.price;
              return (
                <div key={p.id} className="adm-row" onClick={() => navigate('product', { id: p.id, color: p.colors[0] })} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', alignItems: 'center', gap: 14, padding: '13px 16px', background: 'var(--paper)', cursor: 'pointer', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 56, height: 68, borderRadius: 10, overflow: 'hidden', background: colorTint(p.colors[0]), flexShrink: 0 }}>
                    <ProductImage p={p} color={p.colors[0]} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p['name_' + lang]}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--clay-deep)' }}>{fmtDA(p.price, lang)}</span>
                      <span className="dim" style={{ fontSize: 13, textDecoration: 'line-through' }}>{fmtDA(p.oldPrice, lang)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--good)', fontWeight: 600, marginTop: 2 }}>
                      {lang === 'ar' ? `توفير ${fmtDA(saving, lang)}` : `Save ${fmtDA(saving, lang)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ background: 'var(--clay)', color: '#fff', fontWeight: 800, fontSize: 13, padding: '4px 11px', borderRadius: 99 }}>−{pct}%</span>
                    <Icon name="arrow" size={16} style={{ color: 'var(--ink-3)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
