import React from 'react';

// Wordmark logo: "AC COLLECTION"
export function Logo({ size = 22, onClick, light = false }) {
  const color = light ? 'var(--paper)' : 'var(--ink)';
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'baseline', gap: 7 }} aria-label="AC Collection">
      <span style={{ fontWeight: 800, fontSize: size, letterSpacing: '-0.03em', color }}>AC</span>
      <span style={{ fontWeight: 600, fontSize: size - 8, letterSpacing: '0.30em', color }}>COLLECTION</span>
    </button>
  );
}
