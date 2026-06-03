import React from 'react';
import { Icon } from './Icon.jsx';

// Bottom-centered notifications.
export function Toasts({ items }) {
  return (
    <div style={{ position: 'fixed', insetInline: 0, bottom: 22, zIndex: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
      {items.map((t) => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', borderRadius: 999,
          background: t.kind === 'warn' ? '#3a2420' : 'var(--ink)', color: '#fff', fontSize: 14, fontWeight: 600,
          boxShadow: 'var(--shadow-lg)', animation: 'toastIn .3s cubic-bezier(.2,.8,.2,1) both', maxWidth: '92vw',
        }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: t.kind === 'warn' ? 'var(--warn)' : 'var(--good)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name={t.kind === 'warn' ? 'minus' : 'check'} size={12} stroke={3} style={{ color: '#fff' }} />
          </span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
