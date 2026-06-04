/* ===========================================================
   Wishlist — products the visitor saved (stored in the browser)
   =========================================================== */
import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { Icon } from '../components/ui/Icon.jsx';
import { ProductCard } from '../components/product/ProductCard.jsx';

export function Wishlist() {
  const { t, lang, navigate, products, wishlist } = useShop();
  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="wrap fade-in" style={{ paddingTop: 28, minHeight: '70vh' }}>
      <div style={{ marginBottom: 22 }}>
        <span className="eyebrow" style={{ color: 'var(--clay-deep)' }}>{lang === 'en' ? 'Saved' : 'المحفوظة'}</span>
        <h1 style={{ fontSize: 'clamp(30px,4.5vw,46px)', marginTop: 8 }}>{lang === 'en' ? 'Your wishlist' : 'قائمة رغباتك'}</h1>
      </div>

      {items.length === 0 ? (
        <div className="center" style={{ padding: '70px 0', color: 'var(--ink-3)' }}>
          <Icon name="heart" size={44} />
          <p style={{ marginTop: 14, fontSize: 16 }}>{lang === 'en' ? 'No saved items yet. Tap the heart on a product to save it.' : 'لا توجد عناصر محفوظة بعد. اضغط القلب على منتج لحفظه.'}</p>
          <button className="btn btn-clay btn-lg" style={{ marginTop: 18 }} onClick={() => navigate('catalog', {})}>{t.see_all}</button>
        </div>
      ) : (
        <>
          <p className="muted" style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{items.length} {t.results}</p>
          <div className="prod-grid">{items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>
        </>
      )}
    </div>
  );
}
