const router = require('express').Router();
const {
  WILAYAS, COMMUNES, communesFor, deliveryFee,
  CATEGORIES, COLORS, SIZES, PRINT_ZONES,
} = require('../constants');

// GET /api/meta -> static reference data the frontend needs
router.get('/', (req, res) => {
  res.json({ wilayas: WILAYAS, communes: COMMUNES, categories: CATEGORIES, colors: COLORS, sizes: SIZES, printZones: PRINT_ZONES });
});

// GET /api/meta/communes?wilaya=16%20Alger
router.get('/communes', (req, res) => {
  res.json({ communes: communesFor(req.query.wilaya) });
});

// GET /api/meta/delivery-fee?wilaya=16%20Alger&mode=home
router.get('/delivery-fee', (req, res) => {
  const mode = req.query.mode === 'desk' ? 'desk' : 'home';
  res.json({ fee: deliveryFee(req.query.wilaya, mode) });
});

module.exports = router;
