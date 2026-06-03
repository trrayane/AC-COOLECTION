import React from 'react';
import { Icon } from './Icon.jsx';

export function SectionHead({ eyebrow, title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div>
        {eyebrow && <span className="eyebrow" style={{ color: 'var(--clay-deep)' }}>{eyebrow}</span>}
        <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', marginTop: 8 }}>{title}</h2>
      </div>
      {action && <button onClick={onAction} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>{action} <Icon name="arrow" size={15} /></button>}
    </div>
  );
}
