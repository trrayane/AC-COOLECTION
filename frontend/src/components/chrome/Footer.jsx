import React from 'react';
import { useShop } from '../../store/ShopContext.js';
import { Logo } from '../ui/Logo.jsx';
import { Icon } from '../ui/Icon.jsx';

export function Footer() {
  const { lang } = useShop();
  const cols = lang === 'en' ? [
    { h: 'Shop', items: ['New In', 'T-shirts', 'Sweaters', 'Hoodies', 'Customize'] },
    { h: 'Help', items: ['Track order', 'Size guide', 'Shipping & returns', 'Contact us'] },
    { h: 'The brand', items: ['Our story', 'Manufacturing', 'Stores', 'Become a reseller'] },
  ] : [
    { h: 'المتجر', items: ['الجديد', 'تيشيرت', 'بلوفر', 'سويت', 'تخصيص'] },
    { h: 'المساعدة', items: ['تتبع الطلب', 'دليل المقاسات', 'التوصيل والإرجاع', 'اتصل بنا'] },
    { h: 'العلامة', items: ['قصتنا', 'التصنيع', 'نقاط البيع', 'كن موزعاً'] },
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
          {cols.map((c) => (
            <div key={c.h}>
              <h4 style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 16 }}>{c.h}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {c.items.map((i) => <li key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,.72)', cursor: 'pointer' }}>{i}</li>)}
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
