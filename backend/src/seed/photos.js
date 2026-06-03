/* ===========================================================
   Attach REAL apparel photos to the seeded products.
   - Professional stock photos (Unsplash) matched to garment type.
   - These are PLACEHOLDERS representing the product type, NOT photos
     of the real items. Replace them anytime via Admin → Products.
   - If Cloudinary is configured, the photos are uploaded there
     (hosted on your account); otherwise the Unsplash URLs are used directly.
   Run with:  npm run seed:photos
   =========================================================== */
require('dotenv').config();
const { sequelize, Product, ProductPhoto } = require('../models');

const SIZED = '?w=1200&q=80&auto=format&fit=crop';
const POOLS = {
  tshirt: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990',
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820',
  ],
  pull: [
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105',
    'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4',
    'https://images.unsplash.com/photo-1611911813383-67769b37a149',
    'https://images.unsplash.com/photo-1576871337622-98d48d1cf531',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27',
  ],
  hoodie: [
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633',
    'https://images.unsplash.com/photo-1542406775-ade58c52d2e4',
    'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e',
  ],
};
const PHOTOS_PER_PRODUCT = 2; // photo 0 = FRONT, photo 1 = BACK (so the configurator's front/back really works)

const useCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
let cloudinary = null;
if (useCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
    console.log(useCloudinary ? '🖼️  Uploading photos to Cloudinary…' : '🖼️  Using Unsplash URLs directly (Cloudinary not configured)');

    const products = await Product.findAll();
    const counters = { tshirt: 0, pull: 0, hoodie: 0 };

    for (const p of products) {
      // Remove any existing photos (cleans previous runs / mockups)
      const old = await ProductPhoto.findAll({ where: { productId: p.id } });
      for (const ph of old) {
        if (useCloudinary && ph.publicId) { try { await cloudinary.uploader.destroy(ph.publicId); } catch (e) {} }
      }
      await ProductPhoto.destroy({ where: { productId: p.id } });

      const pool = POOLS[p.cat] || POOLS.tshirt;
      for (let i = 0; i < PHOTOS_PER_PRODUCT; i++) {
        const src = pool[(counters[p.cat] + i) % pool.length] + SIZED;
        let url = src, publicId = null;
        if (useCloudinary) {
          const r = await cloudinary.uploader.upload(src, { folder: 'ac-collection/products' });
          url = r.secure_url; publicId = r.public_id;
        }
        await ProductPhoto.create({ productId: p.id, url, publicId, position: i });
      }
      counters[p.cat] += PHOTOS_PER_PRODUCT;
      console.log(`  • ${p.name_en} (${p.cat}) → ${PHOTOS_PER_PRODUCT} photos`);
    }

    console.log(`\n🎉 Done — ${products.length} products now have real photos.`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Photo seed failed:', e);
    process.exit(1);
  }
}

run();
