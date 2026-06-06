import React from 'react';
import { GarmentTile } from '../garments/Garment.jsx';
import { colorHex, cdn } from '../../data/constants.js';

// Shows the first uploaded real photo if the product has one,
// otherwise the drawn flat-lay mockup.
export function ProductImage({ p, color, view = 'front', w = 800 }) {
  const photo = p.photos && p.photos.length ? p.photos[0].url : null;
  if (photo) {
    return <img src={cdn(photo, w)} alt={p.name_en} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
  }
  return <GarmentTile type={p.cat} color={colorHex(color)} view={view} />;
}
