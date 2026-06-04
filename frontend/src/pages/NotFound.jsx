import React from 'react';
import { useShop } from '../store/ShopContext.js';
import { Logo } from '../components/ui/Logo.jsx';

export function NotFound() {
  const { lang, navigate } = useShop();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', background: 'var(--paper)' }}>
      <Logo size={22} onClick={() => navigate('home')} />

      <div style={{ marginTop: 48, marginBottom: 32 }}>
        <div style={{ fontSize: 'clamp(80px,20vw,140px)', fontWeight: 900, lineHeight: 1, letterSpacing: '-.04em', color: 'var(--ink)' }}>404</div>
        <h1 style={{ fontSize: 'clamp(20px,4vw,28px)', marginTop: 16, fontWeight: 700 }}>
          {lang === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}
        </h1>
        <p className="muted" style={{ fontSize: 16, marginTop: 10, maxWidth: 360, margin: '10px auto 0', lineHeight: 1.6 }}>
          {lang === 'ar'
            ? 'يبدو أن هذه الصفحة غير موجودة أو تم نقلها.'
            : "The page you're looking for doesn't exist or has been moved."}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-clay btn-lg" onClick={() => navigate('home')}>
          {lang === 'ar' ? '← العودة للمتجر' : '← Back to store'}
        </button>
        <button className="btn btn-ghost btn-lg" onClick={() => navigate('catalog', {})}>
          {lang === 'ar' ? 'تصفح المنتجات' : 'Browse products'}
        </button>
      </div>
    </div>
  );
}
