const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory demo storage (not for production)
const validCoupons = {
  'CHAI10': { code: 'CHAI10', type: 'percent', value: 10, description: '10% off' },
  'WELCOME50': { code: 'WELCOME50', type: 'amount', value: 50, description: '₹50 off' }
};

let savedLists = {}; // key -> array of items

app.post('/api/validate-coupon', (req, res) => {
  const { code, subtotal } = req.body || {};
  if(!code) return res.status(400).json({ok:false, message:'Missing coupon code'});
  const normalized = String(code||'').trim().toUpperCase();
  const coupon = validCoupons[normalized];
  if(!coupon) return res.json({ ok: false, message: 'Invalid coupon' });
  // compute discount
  let discount = 0;
  if(coupon.type === 'percent') discount = Math.round((subtotal || 0) * (coupon.value/100));
  else if(coupon.type === 'amount') discount = coupon.value;
  return res.json({ ok: true, coupon: coupon.code, discount, description: coupon.description });
});

app.post('/api/save-for-later', (req, res) => {
  const { key, item } = req.body || {};
  if(!key || !item) return res.status(400).json({ ok:false, message:'Missing key or item' });
  savedLists[key] = savedLists[key] || [];
  savedLists[key].push(item);
  return res.json({ ok:true, saved: savedLists[key] });
});

app.get('/api/saved/:key', (req, res) => {
  const key = req.params.key;
  return res.json({ ok:true, saved: savedLists[key] || [] });
});

// Serve static site for convenience when running locally
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, ()=>console.log(`Demo backend running on http://localhost:${PORT}`));
}
module.exports = app;
