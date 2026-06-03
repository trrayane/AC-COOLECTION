/* ===========================================================
   Attach the clean flat-lay tee photos (in ./mockups) to the
   matching t-shirt products (white / forest / black).
   These align well with the configurator's print zones.
   Run with:  npm run seed:tee-photos
   =========================================================== */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize, Product, ProductPhoto } = require('../models');
const { saveImage, deleteImage } = require('../services/storage');

const DIR = path.join(__dirname, 'mockups');

// colour key -> [front file, back file]
const MAP = {
  white:  ['tee-white-front.png', 'tee-white-back.png'],
  forest: ['tee-green-front.png', 'tee-green-back.png'],
  ink:    ['tee-black-back.png',  'tee-black-back.png'], // plain black tee: front/back look identical
};

const cache = {};
async function up(fname) {
  if (cache[fname]) return cache[fname];
  const r = await saveImage({ buffer: fs.readFileSync(path.join(DIR, fname)), mimetype: 'image/png', originalname: fname }, 'products');
  cache[fname] = r;
  return r;
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    const tees = await Product.findAll({ where: { cat: 'tshirt' }, include: [{ model: ProductPhoto, as: 'photos' }] });
    let n = 0;
    for (const p of tees) {
      const files = MAP[p.colors[0]];
      if (!files) continue; // only white / forest / ink for now
      for (const ph of p.photos || []) await deleteImage({ url: ph.url, publicId: ph.publicId });
      await ProductPhoto.destroy({ where: { productId: p.id } });
      const front = await up(files[0]);
      const back = await up(files[1]);
      await ProductPhoto.create({ productId: p.id, url: front.url, publicId: front.publicId, position: 0 });
      await ProductPhoto.create({ productId: p.id, url: back.url, publicId: back.publicId, position: 1 });
      n++;
      console.log(`  • ${p.name_en}`);
    }
    console.log(`\n🎉 ${n} t-shirts updated with clean flat-lay photos (front + back).`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Failed:', e);
    process.exit(1);
  }
}

run();
