const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';

// Mock the leaky bucket — the returned middleware reads `__state.blocked` at
// call time so we can flip behaviour per test without reloading the route.
// Using an object (not a primitive) is required because jest.mock is hoisted.
const __state = { blocked: false };
jest.mock('../../middleware/leakyBucket', () => ({
  leakyBucketLimiter: jest.fn(() => (req, res, next) => {
    if (__state.blocked) return res.status(429).json({ error: 'Too Many Requests' });
    return next();
  }),
}));

const LegalDocument = require('../../modules/legal/legal-document.model');

let app;

beforeAll(async () => {
  app = require('../../server');
});

beforeEach(async () => {
  __state.blocked = false;
  await LegalDocument.deleteMany({});
});

const BASE = '/api/v1/legal';

const seedLegalDoc = async (overrides = {}) => {
  return LegalDocument.create({
    type: 'TERMS_OF_USE',
    version: '1.0',
    effectiveDate: new Date('2023-01-01'),
    isPublished: true,
    locales: {
      en: { summary: 'English summary', content: 'English content' },
      vi: { summary: 'Vietnamese summary', content: 'Vietnamese content' }
    },
    ...overrides
  });
};

describe('Legal API Integration Tests', () => {
  describe('GET /:type', () => {
    it('should return 404 if no published document is found', async () => {
      const res = await request(app).get(`${BASE}/TERMS_OF_USE`);
      expect(res.status).toBe(404);
    });

    it('should return the document in default language (en)', async () => {
      await seedLegalDoc();

      const res = await request(app).get(`${BASE}/TERMS_OF_USE`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('type', 'TERMS_OF_USE');
      expect(res.body).toHaveProperty('version', '1.0');
      expect(res.body).toHaveProperty('summary', 'English summary');
      expect(res.body).toHaveProperty('content', 'English content');
    });

    it('should return the document in Vietnamese if lang=vi', async () => {
      await seedLegalDoc();

      const res = await request(app).get(`${BASE}/TERMS_OF_USE?lang=vi`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary', 'Vietnamese summary');
      expect(res.body).toHaveProperty('content', 'Vietnamese content');
    });

    it('should return 429 when the leaky bucket rate limiter rejects the request', async () => {
      await seedLegalDoc();

      // Flip the shared flag so the already-registered middleware returns 429
      __state.blocked = true;

      const rateLimitedRes = await request(app).get(`${BASE}/TERMS_OF_USE`);
      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.body).toHaveProperty('error', 'Too Many Requests');
    });

    it('should return the document in English when lang=en is explicitly passed', async () => {
      await seedLegalDoc();

      const res = await request(app).get(`${BASE}/TERMS_OF_USE?lang=en`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary', 'English summary');
      expect(res.body).toHaveProperty('content', 'English content');
    });
  });
});
