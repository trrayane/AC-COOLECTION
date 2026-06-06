import React from 'react';
import { GarmentTile } from '../garments/Garment.jsx';
import { colorHex, colorTint, cdn } from '../../data/constants.js';

// Shows the first uploaded real photo if the product has one, otherwise the
// drawn flat-lay mockup. While the photo loads, a tinted placeholder is shown
// and the image fades in on load — so there's never a blank flash.
export function ProductImage({ p, color, view = 'front', w = 600 }) {
  const photo = p.photos && p.photos.length ? p.photos[0].url : null;
  const [loaded, setLoaded] = React.useState(false);

  if (photo) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', background: colorTint(color), overflow: 'hidden' }}>
        <img
          src={cdn(photo, w)}
          alt={p.name_en}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: loaded ? 1 : 0, transition: 'opacity .45s ease',
          }}
        />
      </div>
    );
  }
  return <GarmentTile type={p.cat} color={colorHex(color)} view={view} />;
}
