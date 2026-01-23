const request = require('supertest');
const app = require('./server');

describe('API Tests', () => {
  beforeEach(() => {
    // Reset in-memory storage before each test
    app.locals.savedLists = {};
  });

  describe('POST /api/validate-coupon', () => {
    test('should validate a valid percent coupon', async () => {
      const response = await request(app)
        .post('/api/validate-coupon')
        .send({ code: 'CHAI10', subtotal: 1000 });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.coupon).toBe('CHAI10');
      expect(response.body.discount).toBe(100);
      expect(response.body.description).toBe('10% off');
    });

    test('should validate a valid amount coupon', async () => {
      const response = await request(app)
        .post('/api/validate-coupon')
        .send({ code: 'WELCOME50', subtotal: 500 });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.coupon).toBe('WELCOME50');
      expect(response.body.discount).toBe(50);
      expect(response.body.description).toBe('₹50 off');
    });

    test('should return error for invalid coupon', async () => {
      const response = await request(app)
        .post('/api/validate-coupon')
        .send({ code: 'INVALID', subtotal: 1000 });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(false);
      expect(response.body.message).toBe('Invalid coupon');
    });

    test('should return error for missing coupon code', async () => {
      const response = await request(app)
        .post('/api/validate-coupon')
        .send({ subtotal: 1000 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.message).toBe('Missing coupon code');
    });

    test('should handle case insensitive and trimmed coupon code', async () => {
      const response = await request(app)
        .post('/api/validate-coupon')
        .send({ code: ' chai10 ', subtotal: 200 });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.discount).toBe(20);
    });
  });

  describe('POST /api/save-for-later', () => {
    test('should save an item for later', async () => {
      const response = await request(app)
        .post('/api/save-for-later')
        .send({ key: 'user1', item: { id: 1, name: 'Coffee' } });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.saved).toEqual([{ id: 1, name: 'Coffee' }]);
    });

    test('should return error for missing key or item', async () => {
      const response = await request(app)
        .post('/api/save-for-later')
        .send({ key: 'user1' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.message).toBe('Missing key or item');
    });
  });

  describe('GET /api/saved/:key', () => {
    test('should return saved items for existing key', async () => {
      // First save an item
      await request(app)
        .post('/api/save-for-later')
        .send({ key: 'user1', item: { id: 1, name: 'Tea' } });

      const response = await request(app)
        .get('/api/saved/user1');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.saved).toEqual([{ id: 1, name: 'Tea' }]);
    });

    test('should return empty array for non-existing key', async () => {
      const response = await request(app)
        .get('/api/saved/nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.saved).toEqual([]);
    });
  });
});
