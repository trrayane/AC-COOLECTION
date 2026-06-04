import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { Icon } from '../components/ui/Icon.jsx';
import { ProductCard } from '../components/product/ProductCard.jsx';

export function Promotions() {
  const { t, lang, navigate, products } = useShop();
  const items = products.filter((p) => p.oldPrice && p.oldPrice > p.price);

  return (
    <div className="fade-in">
      {/* Hero banner */}
      <div style={{ background: 'var(--ink)', color: '#fff', padding: 'clamp(32px,5vw,60px) clamp(20px,5vw,60px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 80% at 50% 120%, rgba(190,94,55,.35), transparent 65%)' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(190,94,55,.25)', border: '1px solid rgba(190,94,55,.5)', color: 'var(--clay)', borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', marginBottom: 14 }}>
            <Icon name="tag" size={13} /> {lang === 'ar' ? 'عروض خاصة' : 'SPECIAL OFFERS'}
          </span>
          <h1 style={{ fontSize: 'clamp(34px,5vw,58px)', fontWeight: 900, letterSpacing: '-.02em', margin: '0 0 12px' }}>
            {lang === 'ar' ? 'التخفيضات' : 'Promotions'}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', maxWidth: 460, margin: '0 auto' }}>
            {lang === 'ar' ? 'اكتشف منتجاتنا بأسعار مخفضة — عروض محدودة' : 'Discover our products at reduced prices — limited-time deals'}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 60, minHeight: '50vh' }}>
        {items.length === 0 ? (
          <div className="center" style={{ padding: '80px 0', color: 'var(--ink-3)' }}>
            <Icon name="tag" size={48} />
            <h2 style={{ fontSize: 22, marginTop: 16 }}>{lang === 'ar' ? 'لا توجد عروض حالياً' : 'No promotions right now'}</h2>
            <p className="muted" style={{ fontSize: 15, marginTop: 8 }}>{lang === 'ar' ? 'تابعنا لمعرفة العروض القادمة' : 'Stay tuned for upcoming deals'}</p>
            <button className="btn btn-clay btn-lg" style={{ marginTop: 22 }} onClick={() => navigate('catalog', {})}>{t.see_all}</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>{lang === 'ar' ? 'العروض المتاحة' : 'Available deals'}</h2>
                <p className="muted" style={{ fontSize: 14, marginTop: 3 }}>{items.length} {lang === 'ar' ? 'منتج مخفض' : items.length === 1 ? 'item on sale' : 'items on sale'}</p>
              </div>
              {/* Biggest discount badge */}
              {(() => { const best = [...items].sort((a, b) => (1 - b.price / b.oldPrice) - (1 - a.price / a.oldPrice))[0]; const pct = Math.round((1 - best.price / best.oldPrice) * 100); return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--clay)', color: '#fff', borderRadius: 99, padding: '7px 16px', fontSize: 13, fontWeight: 700 }}>
                  <Icon name="tag" size={14} /> {lang === 'ar' ? `أكبر تخفيض: -${pct}%` : `Best deal: -${pct}%`}
                </span>
              ); })()}
            </div>
            <div className="prod-grid">
              {items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
