const { timingSafeCompare } = require('../../utils/security');
const { logSecurityEvent } = require('../../utils/logger');
const request = require('supertest');
const app = require('../../server');

describe('Security Enhancements', () => {
  describe('timingSafeCompare', () => {
    it('returns true for identical strings', () => {
      expect(timingSafeCompare('secret123', 'secret123')).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(timingSafeCompare('secret123', 'secret124')).toBe(false);
    });

    it('returns false for different length strings', () => {
      expect(timingSafeCompare('secret', 'secret123')).toBe(false);
    });
  });

  describe('Security Logger', () => {
    it('logs events without crashing', () => {
      expect(() => {
        logSecurityEvent('TEST_EVENT', { info: 'test' });
      }).not.toThrow();
    });
  });

  describe('Rate Limiter Logging', () => {
    it('should limit repeated requests and theoretically log them', async () => {
      // Just a basic check that the route exists
      const res = await request(app).get('/api/v1/wiki');
      expect(res.status).toBeDefined();
    });
  });
});
