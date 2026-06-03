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

// 58 Algerian wilayas
const WILAYAS = [
  '01 Adrar', '02 Chlef', '03 Laghouat', '04 Oum El Bouaghi', '05 Batna', '06 Béjaïa', '07 Biskra',
  '08 Béchar', '09 Blida', '10 Bouira', '11 Tamanrasset', '12 Tébessa', '13 Tlemcen', '14 Tiaret',
  '15 Tizi Ouzou', '16 Alger', '17 Djelfa', '18 Jijel', '19 Sétif', '20 Saïda', '21 Skikda',
  '22 Sidi Bel Abbès', '23 Annaba', '24 Guelma', '25 Constantine', '26 Médéa', '27 Mostaganem',
  '28 M’Sila', '29 Mascara', '30 Ouargla', '31 Oran', '32 El Bayadh', '33 Illizi', '34 Bordj Bou Arréridj',
  '35 Boumerdès', '36 El Tarf', '37 Tindouf', '38 Tissemsilt', '39 El Oued', '40 Khenchela',
  '41 Souk Ahras', '42 Tipaza', '43 Mila', '44 Aïn Defla', '45 Naâma', '46 Aïn Témouchent',
  '47 Ghardaïa', '48 Relizane', '49 Timimoun', '50 Bordj Badji Mokhtar', '51 Ouled Djellal',
  '52 Béni Abbès', '53 In Salah', '54 In Guezzam', '55 Touggourt', '56 Djanet', '57 El M’Ghair', '58 El Meniaa',
];

const COMMUNES = {
  '16 Alger': ['Alger Centre', 'Bab El Oued', 'Hussein Dey', 'El Harrach', 'Bir Mourad Raïs', 'Dar El Beïda', 'Cheraga', 'Bab Ezzouar', 'Kouba', 'Birtouta'],
  '31 Oran': ['Oran', 'Bir El Djir', 'Es Sénia', 'Arzew', 'Bethioua', 'Aïn El Turck', 'Gdyel', 'Oued Tlélat'],
  '25 Constantine': ['Constantine', 'El Khroub', 'Hamma Bouziane', 'Aïn Smara', 'Didouche Mourad', 'Zighoud Youcef'],
  '15 Tizi Ouzou': ['Tizi Ouzou', 'Azazga', 'Draâ Ben Khedda', 'Tigzirt', 'Boghni', 'Azeffoun'],
  '06 Béjaïa': ['Béjaïa', 'Akbou', 'Aokas', 'El Kseur', 'Tichy', 'Amizour'],
  '19 Sétif': ['Sétif', 'El Eulma', 'Aïn Oulmène', 'Bougaa', 'Aïn Arnat'],
  '09 Blida': ['Blida', 'Boufarik', 'Mouzaïa', 'Ouled Yaïch', 'Bouinan'],
  '23 Annaba': ['Annaba', 'El Bouni', 'El Hadjar', 'Sidi Amar', 'Berrahal'],
};

const communesFor = (w) => COMMUNES[w] || ['Chef-lieu', 'Autre commune'];

// Delivery fee in DZD: home vs stopdesk per zone tier
function deliveryFee(wilaya, mode) {
  const big = ['16 Alger', '09 Blida', '35 Boumerdès', '42 Tipaza'];
  const tier = big.includes(wilaya) ? 0 : (parseInt(wilaya) > 32 ? 2 : 1);
  const home = [400, 600, 900][tier];
  const desk = [250, 350, 500][tier];
  return mode === 'desk' ? desk : home;
}

module.exports = {
  SIZES, CATEGORIES, COLORS, ORDER_STATUSES, PRINT_ZONES,
  WILAYAS, COMMUNES, communesFor, deliveryFee,
};
