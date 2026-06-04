import React from 'react';
import { useShop } from '../../store/ShopContext.js';
import { useIsMobile } from './useIsMobile.js';
import { AnnounceBar } from './AnnounceBar.jsx';
import { Logo } from '../ui/Logo.jsx';
import { Icon } from '../ui/Icon.jsx';

export function Header() {
  const { t, lang, setLang, navigate, cartCount, wishlistCount, openCart, products } = useShop();
  const hasPromos = products.some((p) => p.oldPrice && p.oldPrice > p.price);
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', f);
    return () => window.removeEventListener('scroll', f);
  }, []);

  const navLinks = [
    { id: 'new',    label: t.nav_new,    go: () => navigate('catalog', { filter: 'new' }) },
    { id: 'tshirt', label: t.nav_tshirt, go: () => navigate('catalog', { cat: 'tshirt' }) },
    { id: 'pull',   label: t.nav_pull,   go: () => navigate('catalog', { cat: 'pull' }) },
    { id: 'hoodie', label: t.nav_hoodie, go: () => navigate('catalog', { cat: 'hoodie' }) },
  ];

  const langToggle = (
    <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 999,
        boxShadow: 'inset 0 0 0 1.4px var(--line)', fontSize: 13, fontWeight: 700, letterSpacing: '.04em' }}>
      <Icon name="globe" size={15} /> {lang === 'en' ? 'عربية' : 'EN'}
    </button>
  );

  return (
    <>
      <AnnounceBar />
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, background: scrolled ? 'rgba(255,255,255,.86)' : 'var(--paper)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: '1px solid ' + (scrolled ? 'var(--line)' : 'transparent'),
        transition: 'background .25s, border-color .25s',
      }}>
        <div className="wrap" style={{ height: 68, display: 'flex', alignItems: 'center', gap: 18 }}>
          {isMobile && (
            <button onClick={() => setMenuOpen(true)} aria-label="menu" style={{ color: 'var(--ink)' }}><Icon name="menu" size={24} /></button>
          )}
          <Logo onClick={() => navigate('home')} size={isMobile ? 18 : 22} />

          {!isMobile && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginInlineStart: 14 }}>
              {navLinks.map((l) => (
                <button key={l.id} onClick={l.go} style={{
                  padding: '8px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600, color: 'var(--ink)',
                  transition: 'background .15s',
                }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sand)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>{l.label}</button>
              ))}
              {hasPromos && (
                <button onClick={() => navigate('promotions')} style={{
                  padding: '8px 14px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                  color: '#fff', background: 'var(--clay)', display: 'flex', alignItems: 'center', gap: 6,
                }}><Icon name="tag" size={14} /> {lang === 'ar' ? 'تخفيضات' : 'Promos'}</button>
              )}
              <button onClick={() => navigate('configurator', {})} style={{
                padding: '8px 14px', borderRadius: 999, fontSize: 14, fontWeight: 700, color: 'var(--clay-deep)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}><Icon name="spark" size={15} /> {t.nav_custom}</button>
            </nav>
          )}

          <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 10 }}>
            {!isMobile && (
              <button onClick={() => navigate('catalog', {})} aria-label="search" style={{
                display: 'flex', alignItems: 'center', gap: 9, height: 38, padding: '0 14px 0 13px', borderRadius: 999,
                background: 'var(--paper-2)', boxShadow: 'inset 0 0 0 1.4px var(--line)', color: 'var(--ink-3)', fontSize: 13.5, minWidth: 190,
              }}><Icon name="search" size={17} /> {t.search}</button>
            )}
            {isMobile && <button onClick={() => navigate('catalog', {})} aria-label="search" style={{ color: 'var(--ink)' }}><Icon name="search" size={22} /></button>}
            {!isMobile && langToggle}
            <button onClick={() => navigate('admin')} aria-label="admin" title="Admin" style={{
              width: 38, height: 38, borderRadius: '50%', display: isMobile ? 'none' : 'grid', placeItems: 'center', color: 'var(--ink-2)',
            }}><Icon name="user" size={20} /></button>
            <button onClick={() => navigate('wishlist')} aria-label="wishlist" style={{ position: 'relative', color: 'var(--ink)' }}>
              <Icon name="heart" size={22} />
              {wishlistCount > 0 && <span style={{
                position: 'absolute', top: -6, insetInlineEnd: -7, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999,
                background: 'var(--clay)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center',
              }}>{wishlistCount}</span>}
            </button>
            <button onClick={openCart} aria-label="cart" style={{ position: 'relative', color: 'var(--ink)' }}>
              <Icon name="bag" size={23} />
              {cartCount > 0 && <span style={{
                position: 'absolute', top: -6, insetInlineEnd: -7, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999,
                background: 'var(--clay)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center',
              }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="fade-in" onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(34,28,19,.4)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0, width: 290, maxWidth: '82vw', background: 'var(--paper)',
            padding: 22, display: 'flex', flexDirection: 'column', gap: 6, animation: 'fadeIn .2s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <Logo onClick={() => { navigate('home'); setMenuOpen(false); }} />
              <button onClick={() => setMenuOpen(false)}><Icon name="close" size={22} /></button>
            </div>
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => { l.go(); setMenuOpen(false); }} style={{
                textAlign: lang === 'ar' ? 'right' : 'left', padding: '13px 4px', fontSize: 18, fontWeight: 600,
                borderBottom: '1px solid var(--line)',
              }}>{l.label}</button>
            ))}
            {hasPromos && (
              <button onClick={() => { navigate('promotions'); setMenuOpen(false); }} style={{
                textAlign: lang === 'ar' ? 'right' : 'left', padding: '13px 4px', fontSize: 18, fontWeight: 700, color: 'var(--clay)',
                display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--line)',
              }}><Icon name="tag" size={18} /> {lang === 'ar' ? 'التخفيضات' : 'Promotions'}</button>
            )}
            <button onClick={() => { navigate('configurator', {}); setMenuOpen(false); }} style={{
              textAlign: lang === 'ar' ? 'right' : 'left', padding: '13px 4px', fontSize: 18, fontWeight: 700, color: 'var(--clay-deep)',
              display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--line)',
            }}><Icon name="spark" size={18} /> {t.nav_custom}</button>
            <button onClick={() => { navigate('admin'); setMenuOpen(false); }} style={{
              textAlign: lang === 'ar' ? 'right' : 'left', padding: '13px 4px', fontSize: 16, fontWeight: 600, color: 'var(--ink-2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}><Icon name="user" size={18} /> {t.admin}</button>
            <div style={{ marginTop: 'auto' }}>{langToggle}</div>
          </div>
        </div>
      )}
    </>
  );
}
