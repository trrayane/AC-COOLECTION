/* ===========================================================
   Static reference data: colours, sizes, categories, statuses.
   (Products, orders and wilayas come from the backend API.)
   =========================================================== */

// Re-exported for convenience so components can grab currency formatting
// and reference data from one module.
export { fmtDA, I18N } from './i18n.js';

// Colour key -> swatch hex + soft card tint + bilingual label
export const COLORS = {
  cream:   { hex: '#EFE6D6', label_en: 'Cream',      label_ar: 'كريمي' },
  sand:    { hex: '#D8C3A0', label_en: 'Sand',       label_ar: 'رملي' },
  clay:    { hex: '#BE5E37', label_en: 'Terracotta', label_ar: 'طيني' },
  rust:    { hex: '#9A4A2C', label_en: 'Brick',      label_ar: 'آجري' },
  olive:   { hex: '#6E6B45', label_en: 'Olive',      label_ar: 'زيتوني' },
  forest:  { hex: '#334A3A', label_en: 'Forest',     label_ar: 'أخضر غامق' },
  ink:     { hex: '#23211D', label_en: 'Black',      label_ar: 'أسود' },
  slate:   { hex: '#4A5159', label_en: 'Slate',      label_ar: 'رمادي' },
  navy:    { hex: '#293449', label_en: 'Navy',       label_ar: 'كحلي' },
  white:   { hex: '#F7F5F0', label_en: 'White',      label_ar: 'أبيض' },
  blush:   { hex: '#D9A48F', label_en: 'Dusty pink', label_ar: 'وردي' },
  mustard: { hex: '#C79A3B', label_en: 'Mustard',    label_ar: 'خردلي' },
};

// A colour value is either a preset key ('ink', 'clay'…) OR a raw hex
// ('#1E3A5F') chosen freely by the admin. Both are supported everywhere.
export const colorHex = (c) => {
  if (typeof c === 'string' && c.startsWith('#')) return c;
  return COLORS[c] ? COLORS[c].hex : '#ccc';
};

// Neutral grey tile backdrop (monochrome look) — slightly darker behind dark garments
export const colorTint = (c) => {
  const hex = colorHex(c);
  const h = hex.replace('#', '');
  const lum = 0.299 * parseInt(h.substr(0, 2), 16)
    + 0.587 * parseInt(h.substr(2, 2), 16)
    + 0.114 * parseInt(h.substr(4, 2), 16);
  return lum > 150 ? '#EFEFEE' : '#F4F4F3';
};

// Preset colours have a bilingual name; a custom hex has none (the swatch
// shows the colour, and the product name carries the wording).
export const colorLabel = (c, lang) => {
  if (COLORS[c]) return COLORS[c]['label_' + lang];
  if (typeof c === 'string' && c.startsWith('#')) return '';
  return c;
};

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const CATEGORIES = [
  { id: 'all',    en: 'All',      ar: 'الكل' },
  { id: 'tshirt', en: 'T-shirts', ar: 'تيشيرت' },
  { id: 'pull',   en: 'Sweaters', ar: 'بلوفر' },
  { id: 'hoodie', en: 'Hoodies',  ar: 'سويت شيرت' },
];

// Printable areas per garment type
export const PRINT_ZONES = {
  tshirt: [
    { id: 'front',  en: 'Front',          ar: 'الأمام' },
    { id: 'back',   en: 'Back',           ar: 'الخلف' },
    { id: 'sleeve', en: 'Sleeve',         ar: 'الكُم' },
    { id: 'pocket', en: 'Chest (pocket)', ar: 'الصدر' },
  ],
  pull: [
    { id: 'front',  en: 'Front',  ar: 'الأمام' },
    { id: 'back',   en: 'Back',   ar: 'الخلف' },
    { id: 'sleeve', en: 'Sleeve', ar: 'الكُم' },
  ],
  hoodie: [
    { id: 'front',  en: 'Front',  ar: 'الأمام' },
    { id: 'back',   en: 'Back',   ar: 'الخلف' },
    { id: 'sleeve', en: 'Sleeve', ar: 'الكُم' },
    { id: 'hood',   en: 'Hood',   ar: 'الغطاء' },
  ],
};

// Order status -> bilingual label + pill colour
export const STATUS_META = {
  pending:   { en: 'Pending',        ar: 'قيد الانتظار', color: 'var(--warn)' },
  prep:      { en: 'In preparation', ar: 'قيد التحضير',  color: 'var(--info)' },
  shipped:   { en: 'Shipped',        ar: 'تم الشحن',     color: 'var(--olive)' },
  delivered: { en: 'Delivered',      ar: 'تم التسليم',   color: 'var(--good)' },
  cancelled: { en: 'Cancelled',      ar: 'ملغى',         color: 'var(--danger)' },
};
export const STATUS_FLOW = ['pending', 'prep', 'shipped', 'delivered'];

// Local delivery-fee estimate (the backend re-computes the authoritative total).
export function deliveryFee(wilaya, mode) {
  const big = ['16 Alger', '09 Blida', '35 Boumerdès', '42 Tipaza'];
  const tier = big.includes(wilaya) ? 0 : (parseInt(wilaya) > 32 ? 2 : 1);
  const home = [400, 600, 900][tier];
  const desk = [250, 350, 500][tier];
  return mode === 'desk' ? desk : home;
}
