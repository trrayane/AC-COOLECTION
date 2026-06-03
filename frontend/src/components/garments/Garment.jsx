/* ===========================================================
   Garment flat-lay SVGs — elegant placeholders + configurator base.
   =========================================================== */
import React from 'react';

// Shade a hex toward dark/light for seams
export function shade(hex, amt) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt))).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
export function isLight(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
}

function garmentPaths(type, view) {
  if (type === 'tshirt') {
    const body = 'M165,58 C180,52 165,86 200,86 C235,86 220,52 235,58 L250,62 L340,98 L331,160 L264,144 L284,446 L116,446 L136,144 L69,160 L60,98 L150,62 Z';
    const collar = view === 'back'
      ? 'M165,58 C180,70 220,70 235,58'
      : 'M168,60 C183,80 217,80 232,60';
    return { body, collar, sleeveL: 'M69,160 L60,98 L150,62', sleeveR: 'M331,160 L340,98 L250,62' };
  }
  if (type === 'pull') {
    const body = 'M165,58 C180,52 165,86 200,86 C235,86 220,52 235,58 L252,63 L356,120 L330,168 L300,150 L286,452 L114,452 L100,150 L70,168 L44,120 L148,63 Z';
    const collar = view === 'back' ? 'M165,58 C180,72 220,72 235,58' : 'M168,60 C183,82 217,82 232,60';
    return { body, collar, ribs: [[44, 120, 70, 168], [356, 120, 330, 168], [114, 452, 286, 452]] };
  }
  const body = 'M150,96 C150,70 175,58 200,58 C225,58 250,70 250,96 L262,100 L356,150 L330,196 L300,178 L290,456 L110,456 L100,178 L70,196 L44,150 L138,100 Z';
  return { body };
}

export function Garment({ type = 'tshirt', color = '#EFE6D6', view = 'front', style }) {
  const seam = shade(color, isLight(color) ? -26 : 30);
  const seamSoft = shade(color, isLight(color) ? -14 : 18);
  const hi = shade(color, isLight(color) ? 16 : 26);
  const p = garmentPaths(type, view);
  const gid = React.useId().replace(/:/g, '');

  return (
    <svg viewBox="0 0 400 500" style={style} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={shade(color, isLight(color) ? -6 : 8)} />
        </linearGradient>
        <filter id={gid + 's'} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#2a1e0c" floodOpacity="0.10" />
        </filter>
      </defs>

      <path d={p.body} fill={`url(#${gid})`} stroke={seam} strokeWidth="1.5" filter={`url(#${gid}s)`} />

      {p.collar && <path d={p.collar} fill="none" stroke={seam} strokeWidth="2.4" strokeLinecap="round" />}

      {type === 'tshirt' && (
        <>
          <path d="M150,150 C160,150 168,150 175,148" fill="none" stroke={seamSoft} strokeWidth="1.4" opacity="0.7" />
          <path d="M250,150 C240,150 232,150 225,148" fill="none" stroke={seamSoft} strokeWidth="1.4" opacity="0.7" />
        </>
      )}

      {type === 'pull' && (
        <>
          <path d="M44,120 L70,168" stroke={seam} strokeWidth="9" opacity="0.25" />
          <path d="M356,120 L330,168" stroke={seam} strokeWidth="9" opacity="0.25" />
          <rect x="114" y="440" width="172" height="12" fill={seam} opacity="0.18" />
          <path d="M150,96 C175,108 225,108 250,96" fill="none" stroke={seam} strokeWidth="2" opacity="0.6" />
        </>
      )}

      {type === 'hoodie' && (
        <>
          <path d="M150,96 C150,68 176,52 200,52 C224,52 250,68 250,96 C232,82 168,82 150,96 Z"
                fill={shade(color, isLight(color) ? -10 : 14)} stroke={seam} strokeWidth="1.5" />
          <path d="M168,90 C168,74 184,66 200,66 C216,66 232,74 232,90"
                fill="none" stroke={seam} strokeWidth="1.6" opacity="0.6" />
          <path d="M186,92 L182,150" stroke={seam} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <path d="M214,92 L218,150" stroke={seam} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <circle cx="182" cy="152" r="4" fill={seam} opacity="0.8" />
          <circle cx="218" cy="152" r="4" fill={seam} opacity="0.8" />
          <path d="M138,300 L262,300 L250,372 L150,372 Z" fill="none" stroke={seam} strokeWidth="1.8" opacity="0.55" />
          <rect x="110" y="444" width="180" height="12" fill={seam} opacity="0.18" />
        </>
      )}

      <line x1="200" y1={type === 'hoodie' ? 100 : 88} x2="200" y2={type === 'tshirt' ? 440 : 450}
            stroke={hi} strokeWidth="1" opacity="0.25" />
    </svg>
  );
}

export function GarmentTile({ type, color, view = 'front' }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
      <Garment type={type} color={color} view={view} style={{ width: '76%', height: '92%' }} />
    </div>
  );
}
