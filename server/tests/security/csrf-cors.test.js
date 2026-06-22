const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { generateCsrfToken, validateCsrfToken } = require('../../middleware/csrf');

// Since we bypass CSRF in 'test' env normally, we simulate it here by using the middlewares
// in a standalone app, but we pass `x-enforce-csrf: true` in the headers.
describe('CSRF & CORS Protection', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    
    // Setup CORS similar to production for testing
    const corsOptions = {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === 'http://allowed-origin.com') callback(null, true);
        else callback(new Error('Not allowed by CORS'));
      },
      credentials: true
    };
    app.use(cors(corsOptions));
    
    app.use(generateCsrfToken);
    app.use(validateCsrfToken);

    // Dummy routes
    app.get('/safe', (req, res) => res.status(200).json({ msg: 'Safe route' }));
    app.post('/unsafe', (req, res) => res.status(200).json({ msg: 'Unsafe route ok' }));
  });

  describe('CSRF Middleware', () => {
    it('should set XSRF-TOKEN cookie on safe requests', async () => {
      const res = await request(app).get('/safe');
      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('XSRF-TOKEN='))).toBe(true);
    });

    it('should bypass CSRF validation for safe HTTP methods', async () => {
      const res = await request(app)
        .get('/safe')
        .set('x-enforce-csrf', 'true');
      expect(res.status).toBe(200);
    });

    it('should reject unsafe requests without CSRF token', async () => {
      const res = await request(app)
        .post('/unsafe')
        .set('x-enforce-csrf', 'true');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid CSRF token');
    });

    it('should reject if token in header does not match cookie', async () => {
      const res = await request(app)
        .post('/unsafe')
        .set('Cookie', ['XSRF-TOKEN=valid-token'])
        .set('x-csrf-token', 'invalid-token')
        .set('x-enforce-csrf', 'true');
      
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid CSRF token');
    });

    it('should allow unsafe requests with matching CSRF token', async () => {
      const validToken = 'the-valid-token-123';
      const res = await request(app)
        .post('/unsafe')
        .set('Cookie', [`XSRF-TOKEN=${validToken}`])
        .set('x-csrf-token', validToken)
        .set('x-enforce-csrf', 'true');
      
      expect(res.status).toBe(200);
      expect(res.body.msg).toBe('Unsafe route ok');
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from allowed origins', async () => {
      const res = await request(app)
        .get('/safe')
        .set('Origin', 'http://allowed-origin.com');
        
      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://allowed-origin.com');
    });

    it('should block requests from disallowed origins', async () => {
      const res = await request(app)
        .get('/safe')
        .set('Origin', 'http://evil-origin.com');
        
      expect(res.status).toBe(500); // Express default error handler returns 500 for Error thrown
      expect(res.text).toContain('Not allowed by CORS');
    });
  });
});
