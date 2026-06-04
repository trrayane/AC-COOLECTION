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
              {[
                { name: 'Instagram', href: 'https://instagram.com', path: 'M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.9 4.9 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.9 4.9 0 0 1-1.153 1.772 4.9 4.9 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.9 4.9 0 0 1-1.772-1.153 4.9 4.9 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.9 4.9 0 0 1 1.153-1.772A4.9 4.9 0 0 1 5.45 2.525c.638-.248 1.363-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.987.01-4.04.059-.976.045-1.505.207-1.858.344-.466.181-.8.398-1.15.748-.35.35-.566.683-.747 1.15-.137.352-.3.881-.344 1.857-.048 1.054-.059 1.37-.059 4.04 0 2.67.01 2.986.059 4.04.044.976.207 1.505.344 1.857.181.466.398.8.748 1.15.35.35.683.566 1.15.747.352.137.881.3 1.857.344 1.054.048 1.37.059 4.04.059 2.67 0 2.987-.01 4.04-.059.976-.044 1.505-.207 1.858-.344.466-.181.8-.398 1.15-.748.35-.35.566-.683.747-1.15.137-.352.3-.881.344-1.857.048-1.054.059-1.37.059-4.04 0-2.67-.01-2.986-.059-4.04-.044-.976-.207-1.505-.344-1.857a3.1 3.1 0 0 0-.748-1.15 3.1 3.1 0 0 0-1.15-.747c-.352-.137-.881-.3-1.857-.344-1.054-.048-1.37-.059-4.04-.059zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z' },
                { name: 'Facebook', href: 'https://facebook.com', path: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z' },
                { name: 'X', href: 'https://x.com', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z' },
              ].map((s) => (
                <a key={s.name} href={s.href} target="_blank" rel="noreferrer" aria-label={s.name}
                  style={{ width: 36, height: 36, borderRadius: '50%', boxShadow: 'inset 0 0 0 1.4px rgba(255,255,255,.25)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.8)', transition: 'color .15s, box-shadow .15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = 'inset 0 0 0 1.4px rgba(255,255,255,.6)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.8)'; e.currentTarget.style.boxShadow = 'inset 0 0 0 1.4px rgba(255,255,255,.25)'; }}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
                </a>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span>© 2026 AC Collection. {lang === 'en' ? 'All rights reserved.' : 'كل الحقوق محفوظة.'}</span>
            <a href="mailto:rayaneterki55@gmail.com" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'none', fontSize: 12, transition: 'color .15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,.75)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,.4)'}>
              rayaneterki55@gmail.com
            </a>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="truck" size={16} /> {lang === 'en' ? 'Cash on delivery · 58 wilayas' : 'الدفع عند الاستلام · 58 ولاية'}
          </span>
        </div>
      </div>
    </footer>
  );
}
