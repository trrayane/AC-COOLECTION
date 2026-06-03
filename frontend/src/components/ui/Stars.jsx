import React from 'react';
import { Icon } from './Icon.jsx';

export function Stars({ value, size = 13 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1, color: 'var(--clay)' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} name="star" size={size} stroke={0}
              style={{ fill: i < Math.round(value) ? 'var(--clay)' : 'var(--line-2)' }} />
      ))}
    </span>
  );
}
