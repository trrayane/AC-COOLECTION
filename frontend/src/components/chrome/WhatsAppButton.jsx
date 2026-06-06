import React from 'react';
import { useShop } from '../../store/ShopContext.js';

// Floating WhatsApp contact button (bottom corner, all pages).
const PHONE_INTL = '213553422030'; // 0553 42 20 30 → +213

export function WhatsAppButton() {
  const { lang } = useShop();
  const [hover, setHover] = React.useState(false);
  const msg = encodeURIComponent(lang === 'ar' ? 'مرحباً! لدي سؤال عن منتجاتكم.' : 'Bonjour ! J\'ai une question sur vos produits.');
  return (
    <a
      href={`https://wa.me/${PHONE_INTL}?text=${msg}`}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'fixed', bottom: 20, insetInlineEnd: 20, zIndex: 80,
        display: 'flex', alignItems: 'center', gap: 10,
        height: 56, padding: hover ? '0 20px 0 16px' : 0, width: hover ? 'auto' : 56,
        borderRadius: 999, background: '#25D366', color: '#fff',
        boxShadow: '0 8px 24px -6px rgba(37,211,102,.6), 0 2px 8px rgba(0,0,0,.2)',
        justifyContent: 'center', overflow: 'hidden', transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
      }}
    >
      <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" style={{ flexShrink: 0 }}>
        <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.26A10 10 0 1 0 12 2zm0 18.2c-1.5 0-2.96-.4-4.24-1.16l-.3-.18-2.85.75.76-2.78-.2-.31A8.2 8.2 0 1 1 12 20.2z" />
      </svg>
      {hover && <span style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap' }}>WhatsApp</span>}
    </a>
  );
}
