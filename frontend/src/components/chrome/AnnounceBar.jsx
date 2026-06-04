import React from 'react';
import { useShop } from '../../store/ShopContext.js';

export function AnnounceBar() {
  const { lang } = useShop();
  const msgs = lang === 'en'
    ? ['Delivery to all 58 wilayas', 'Cash on delivery', 'Free customization on every item', 'Premium cotton · Made in Algeria']
    : ['التوصيل لكل الـ58 ولاية', 'الدفع عند الاستلام', 'تخصيص مجاني لكل منتج', 'قطن فاخر · صُنع في الجزائر'];

  // Repeat the list so one group is wider than any screen (no empty gap at the loop),
  // then render two identical groups → translateX(-50%) loops seamlessly.
  const seq = [...msgs, ...msgs, ...msgs];
  const Group = ({ hidden }) => (
    <div aria-hidden={hidden} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {seq.map((m, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', marginInlineEnd: 46, fontSize: 12, fontWeight: 500, letterSpacing: '.02em' }}>
          <span style={{ width: 4, height: 4, borderRadius: 9, background: 'rgba(255,255,255,.55)' }} /> {m}
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee" style={{ background: 'var(--ink)', color: 'var(--paper)', overflow: 'hidden', height: 36 }}>
      <div className="marquee-track" style={{ height: 36, alignItems: 'center', animationDirection: lang === 'ar' ? 'reverse' : 'normal' }}>
        <Group /><Group hidden />
      </div>
    </div>
  );
}
