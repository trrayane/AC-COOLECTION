import React from 'react';
import { useShop } from '../../store/ShopContext.js';
import { Logo } from '../ui/Logo.jsx';
import { Icon } from '../ui/Icon.jsx';

export function Footer() {
  const { lang, navigate } = useShop();
  const shopTitle = lang === 'en' ? 'Shop' : 'المتجر';
  const shopLinks = [
    { label: lang === 'en' ? 'New In' : 'الجديد', go: () => navigate('catalog', { filter: 'new' }) },
    { label: lang === 'en' ? 'T-shirts' : 'تيشيرت', go: () => navigate('catalog', { cat: 'tshirt' }) },
    { label: lang === 'en' ? 'Sweaters' : 'بلوفر', go: () => navigate('catalog', { cat: 'pull' }) },
    { label: lang === 'en' ? 'Hoodies' : 'سويت', go: () => navigate('catalog', { cat: 'hoodie' }) },
    { label: lang === 'en' ? 'Customize' : 'تخصيص', go: () => navigate('configurator', {}) },
  ];
  // Informational text (not fake links) until real pages exist
  const infoCols = lang === 'en' ? [
    { h: 'Help', items: ['Cash on delivery', 'Delivery to 58 wilayas', 'We call to confirm'] },
    { h: 'The brand', items: ['Made in Algeria', 'Premium cotton', 'Custom printing'] },
  ] : [
    { h: 'المساعدة', items: ['الدفع عند الاستلام', 'التوصيل لـ58 ولاية', 'نتصل بك للتأكيد'] },
    { h: 'العلامة', items: ['صُنع في الجزائر', 'قطن فاخر', 'طباعة مخصّصة'] },
  ];
  return (
    <footer style={{ background: 'var(--ink)', color: 'var(--paper)', marginTop: 80 }}>
      <div className="wrap" style={{ padding: '56px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 40 }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <Logo light size={24} />
            </div>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>
              {lang === 'en' ? 'Premium cotton clothing, made to customize. Designed and printed in Algeria.' : 'ملابس قطنية فاخرة قابلة للتخصيص. مصممة ومطبوعة في الجزائر.'}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {['IG', 'FB', 'TT'].map((s) => (
                <span key={s} style={{ width: 36, height: 36, borderRadius: '50%', boxShadow: 'inset 0 0 0 1.4px rgba(255,255,255,.25)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>{s}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 16 }}>{shopTitle}</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {shopLinks.map((l) => (
                <li key={l.label}>
                  <button onClick={l.go} style={{ fontSize: 14, color: 'rgba(255,255,255,.72)', padding: 0, textAlign: 'start' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')} onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.72)')}>{l.label}</button>
                </li>
              ))}
            </ul>
          </div>
          {infoCols.map((c) => (
            <div key={c.h}>
              <h4 style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 16 }}>{c.h}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {c.items.map((i) => <li key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,.72)' }}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.14)', margin: '40px 0 22px' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: 'rgba(255,255,255,.5)' }}>
          <span>© 2026 AC Collection. {lang === 'en' ? 'All rights reserved.' : 'كل الحقوق محفوظة.'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="truck" size={16} /> {lang === 'en' ? 'Cash on delivery · 58 wilayas' : 'الدفع عند الاستلام · 58 ولاية'}
          </span>
        </div>
      </div>
    </footer>
  );
}
