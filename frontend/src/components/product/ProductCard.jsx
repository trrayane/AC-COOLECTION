import React from 'react';
import { useShop } from '../../store/ShopContext.js';
import { Icon } from '../ui/Icon.jsx';
import { Stars } from '../ui/Stars.jsx';
import { ColorDots } from '../ui/ColorDots.jsx';
import { ProductImage } from './ProductImage.jsx';
import { colorTint, fmtDA } from '../../data/constants.js';
import { shade } from '../garments/Garment.jsx';

export function ProductCard({ p, index = 0 }) {
  const { t, lang, navigate, toggleWishlist, isWishlisted } = useShop();
  const [hover, setHover] = React.useState(false);
  const [ci, setCi] = React.useState(0);
  const color = p.colors[ci];
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const wished = isWishlisted(p.id);

  return (
    <article className="fade-up" style={{ animationDelay: (index % 8) * 0.04 + 's', cursor: 'pointer' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => navigate('product', { id: p.id, color })}>
      <div style={{
        position: 'relative', aspectRatio: '4/5', borderRadius: 'var(--r-lg)', overflow: 'hidden',
        background: `radial-gradient(120% 120% at 50% 18%, ${colorTint(color)} 0%, ${shade(colorTint(color), -8)} 100%)`,
        transition: 'transform .35s cubic-bezier(.2,.7,.2,1)', transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}>
        <div style={{ position: 'absolute', top: 12, insetInlineStart: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 2 }}>
          {p.new && <span className="pill pill-new">{lang === 'en' ? 'New' : 'جديد'}</span>}
          {discount > 0 && <span className="pill pill-soft">-{discount}%</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }} aria-label="wishlist" style={{
          position: 'absolute', top: 12, insetInlineEnd: 12, zIndex: 3, width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)',
          color: wished ? 'var(--clay)' : 'var(--ink-2)', opacity: hover || wished ? 1 : 0, transition: 'opacity .2s, transform .2s', transform: hover || wished ? 'none' : 'scale(.8)',
        }}>
          <Icon name="heart" size={17} stroke={wished ? 0 : 2} style={wished ? { fill: 'var(--clay)' } : undefined} />
        </button>

        <div style={{ position: 'absolute', inset: 0, transition: 'transform .4s', transform: hover ? 'scale(1.04)' : 'none' }}>
          <ProductImage p={p} color={color} view={hover ? 'back' : 'front'} />
        </div>

        <button onClick={(e) => { e.stopPropagation(); navigate('configurator', { id: p.id, color }); }}
          style={{
            position: 'absolute', insetInline: 12, bottom: 12, height: 42, borderRadius: 999,
            background: 'var(--ink)', color: 'var(--paper)', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, zIndex: 2,
            opacity: hover ? 1 : 0, transform: hover ? 'none' : 'translateY(8px)', transition: 'all .25s',
          }}>
          <Icon name="spark" size={15} /> {t.customize}
        </button>
      </div>

      <div style={{ padding: '12px 2px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{p['name_' + lang]}</h3>
          <Stars value={p.rating} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <ColorDots colors={p.colors} active={color} onPick={(c) => setCi(p.colors.indexOf(c))} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            {p.oldPrice && <span className="dim" style={{ fontSize: 13, textDecoration: 'line-through' }}>{fmtDA(p.oldPrice, lang)}</span>}
            <span style={{ fontWeight: 700, fontSize: 15.5 }}>{fmtDA(p.price, lang)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
