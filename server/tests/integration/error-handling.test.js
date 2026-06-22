const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const errorHandlerMiddleware = require('../../middleware/error-handler');
const { cacheData, invalidateCache } = require('../../middleware/cache');
const {
  CustomAPIError,
  AuthError,
  BadRequestError,
  NotFoundError,
  ValidationError,
  WikiError,
} = require('../../errors');

// ─── Error Handler Tests ──────────────────────────────────────────────────────

const buildErrorApp = (thrower) => {
  const app = express();
  app.use(express.json());
  app.get('/test', (req, res, next) => {
    try { thrower(req, res, next); }
    catch (err) { next(err); }
  });
  app.use(errorHandlerMiddleware);
  return app;
};

describe('Error Handler Middleware', () => {
  it('should handle NotFoundError with 404', async () => {
    const app = buildErrorApp(() => { throw new NotFoundError('Item not found'); });
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.msg).toBe('Item not found');
  });

  it('should handle AuthError with 401', async () => {
    const app = buildErrorApp(() => { throw new AuthError('Unauthorized'); });
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
    expect(res.body.msg).toBe('Unauthorized');
  });

  it('should handle BadRequestError with 400', async () => {
    const app = buildErrorApp(() => { throw new BadRequestError('Bad request'); });
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.msg).toBe('Bad request');
  });

  it('should handle WikiError with custom status', async () => {
    const app = buildErrorApp(() => { throw new WikiError('Wiki error', 503); });
    const res = await request(app).get('/test');
    expect(res.status).toBe(503);
    expect(res.body.msg).toBe('Wiki error');
  });

  it('should handle Mongoose CastError (invalid ObjectId) with 404', async () => {
    const app = buildErrorApp(() => {
      const err = new mongoose.Error.CastError('ObjectId', 'invalid-id', '_id');
      throw err;
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.msg).toContain('invalid-id');
  });

  it('should handle Mongoose ValidationError with 400', async () => {
    const app = buildErrorApp(() => {
      const err = new mongoose.Error.ValidationError();
      err.errors = {
        title: new mongoose.Error.ValidatorError({
          message: 'Movie title is required',
          path: 'title',
        }),
      };
      throw err;
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.msg).toContain('Movie title is required');
  });

  it('should handle MongoDB duplicate key error (code 11000) with 400', async () => {
    const app = buildErrorApp(() => {
      const err = new Error('Duplicate key');
      err.code = 11000;
      err.keyValue = { title: 'Test Movie' };
      throw err;
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.msg).toContain('Duplicate value entered for title');
  });

  it('should return 500 for unknown errors', async () => {
    const app = buildErrorApp(() => { throw new Error('Unexpected failure'); });
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.msg).toBe('Unexpected failure');
  });
});

// ─── Cache Middleware Tests ────────────────────────────────────────────────────

describe('Cache Middleware (test-env bypass)', () => {
  // In NODE_ENV=test, cacheData calls next() immediately without touching Redis.
  // We can verify this by checking the response comes through correctly.

  const buildCacheApp = (handler) => {
    const app = express();
    app.use(express.json());
    app.get('/cached', cacheData('test-prefix', 60), handler);
    app.post('/invalidate', invalidateCache('test-prefix'), (req, res) => {
      res.status(200).json({ msg: 'mutated' });
    });
    app.use(errorHandlerMiddleware);
    return app;
  };

  it('should pass through to handler in test environment (no Redis)', async () => {
    const app = buildCacheApp((req, res) => res.status(200).json({ data: 'fresh' }));
    const res = await request(app).get('/cached');
    expect(res.status).toBe(200);
    expect(res.body.data).toBe('fresh');
  });

  it('should not block mutations — invalidateCache calls next() immediately', async () => {
    const app = buildCacheApp((req, res) => res.status(200).json({ data: 'ok' }));
    const res = await request(app).post('/invalidate');
    expect(res.status).toBe(200);
    expect(res.body.msg).toBe('mutated');
  });

  it('should skip caching for non-GET requests', async () => {
    let app = express();
    app.use(express.json());
    app.post('/cached', cacheData('test-prefix', 60), (req, res) => {
      res.status(201).json({ created: true });
    });
    const res = await request(app).post('/cached');
    expect(res.status).toBe(201);
    expect(res.body.created).toBe(true);
  });
});
