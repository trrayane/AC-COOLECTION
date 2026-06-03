import React from 'react';
import { colorHex } from '../../data/constants.js';

export function ColorDots({ colors, active, onPick, size = 18 }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {colors.map((c) => (
        <button key={c} onClick={(e) => { e.stopPropagation(); onPick && onPick(c); }}
          title={c} aria-label={c}
          style={{
            width: size, height: size, borderRadius: '50%', background: colorHex(c),
            boxShadow: active === c ? '0 0 0 2px var(--paper-2), 0 0 0 4px var(--ink)' : 'inset 0 0 0 1px rgba(0,0,0,.12)',
            cursor: onPick ? 'pointer' : 'default', transition: 'box-shadow .15s', flexShrink: 0,
          }} />
      ))}
    </div>
  );
}
