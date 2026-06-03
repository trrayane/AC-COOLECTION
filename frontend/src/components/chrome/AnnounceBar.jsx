import React from 'react';
import { useShop } from '../../store/ShopContext.js';

export function AnnounceBar() {
  const { lang } = useShop();
  const msgs = lang === 'en'
    ? ['Delivery to all 58 wilayas', 'Cash on delivery', 'Free customization on every item', 'Premium cotton · Made in Algeria']
    : ['التوصيل لكل الـ58 ولاية', 'الدفع عند الاستلام', 'تخصيص مجاني لكل منتج', 'قطن فاخر · صُنع في الجزائر'];
  return (
    <div style={{ background: 'var(--ink)', color: 'var(--paper)', overflow: 'hidden', height: 36 }}>
      <div className="wrap no-bar" style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, fontSize: 12, fontWeight: 500, letterSpacing: '.02em', overflowX: 'auto' }}>
        {msgs.map((m, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span style={{ width: 4, height: 4, borderRadius: 9, background: 'rgba(255,255,255,.55)' }} /> {m}
          </span>
        ))}
      </div>
    </div>
  );
}
