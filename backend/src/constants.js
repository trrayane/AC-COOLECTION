/* ===========================================================
   Shared constants (ported from the design's data layer).
   Geographic data + delivery rules live here because the
   server must re-compute totals/fees (never trust the client).
   =========================================================== */

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const CATEGORIES = ['all', 'tshirt', 'pull', 'hoodie'];

// Colour keys -> hex (used for validation; labels live in the frontend i18n)
const COLORS = {
  cream: '#EFE6D6', sand: '#D8C3A0', clay: '#BE5E37', rust: '#9A4A2C',
  olive: '#6E6B45', forest: '#334A3A', ink: '#23211D', slate: '#4A5159',
  navy: '#293449', white: '#F7F5F0', blush: '#D9A48F', mustard: '#C79A3B',
};

const ORDER_STATUSES = ['pending', 'prep', 'shipped', 'delivered', 'cancelled'];

const PRINT_ZONES = {
  tshirt: ['front', 'back', 'sleeve', 'pocket'],
  pull: ['front', 'back', 'sleeve'],
  hoodie: ['front', 'back', 'sleeve', 'hood'],
};

// 58 Algerian wilayas + communes + real delivery fees (see ./data/algeria.js)
const { wilayas: WILAYA_DATA, communes: COMMUNES_BY_CODE } = require('./data/algeria');

const WILAYAS = WILAYA_DATA.map((w) => `${w.code} ${w.name}`);

// Communes keyed by the "CC Name" string (what the UI sends/stores)
const COMMUNES = WILAYA_DATA.reduce((acc, w) => {
  acc[`${w.code} ${w.name}`] = COMMUNES_BY_CODE[w.code] || [];
  return acc;
}, {});

const FEE_BY_CODE = WILAYA_DATA.reduce((acc, w) => {
  acc[w.code] = { home: w.domicile, desk: w.bureau };
  return acc;
}, {});

// Extract the 2-digit wilaya code from a "CC Name" string (robust to spacing).
const wilayaCode = (w) => ((String(w).match(/\d{1,2}/) || [''])[0]).padStart(2, '0');

const communesFor = (w) => COMMUNES[w] || COMMUNES_BY_CODE[wilayaCode(w)] || ['Chef-lieu', 'Autre commune'];

// Authoritative delivery fee (DZD): domicile (home) vs bureau (stop-desk).
function deliveryFee(wilaya, mode) {
  const f = FEE_BY_CODE[wilayaCode(wilaya)] || { home: 700, desk: 400 };
  return mode === 'desk' ? f.desk : f.home;
}

module.exports = {
  SIZES, CATEGORIES, COLORS, ORDER_STATUSES, PRINT_ZONES,
  WILAYAS, COMMUNES, communesFor, deliveryFee,
};
