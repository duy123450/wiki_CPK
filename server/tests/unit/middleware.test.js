const { CustomAPIError } = require('../../errors/custom-error');

// ─── asyncWrapper ─────────────────────────────────────────────────────────────
const asyncWrapper = require('../../middleware/async');

// ─── notFound ─────────────────────────────────────────────────────────────────
const notFound = require('../../middleware/not-found');

// ─── errorHandler ─────────────────────────────────────────────────────────────
const errorHandler = require('../../middleware/error-handler');

// ─── Helpers: mock req/res/next ───────────────────────────────────────────────
const mockReq = (overrides = {}) => ({
    originalUrl: '/api/v1/test',
    ...overrides,
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = () => jest.fn();

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Middleware', () => {
    // ── asyncWrapper ──────────────────────────────────────────────────────────
    describe('asyncWrapper()', () => {
        it('should call the wrapped function with req, res, next', async () => {
            const fn = jest.fn().mockResolvedValue(undefined);
            const wrapped = asyncWrapper(fn);

            const req = mockReq();
            const res = mockRes();
            const next = mockNext();

            await wrapped(req, res, next);

            expect(fn).toHaveBeenCalledWith(req, res, next);
        });

        it('should call next(error) when the wrapped function throws', async () => {
            const testError = new Error('Something broke');
            const fn = jest.fn().mockRejectedValue(testError);
            const wrapped = asyncWrapper(fn);

            const req = mockReq();
            const res = mockRes();
            const next = mockNext();

            await wrapped(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });

        it('should NOT call next when the function succeeds', async () => {
            const fn = jest.fn().mockResolvedValue(undefined);
            const wrapped = asyncWrapper(fn);

            const req = mockReq();
            const res = mockRes();
            const next = mockNext();

            await wrapped(req, res, next);

            expect(next).not.toHaveBeenCalled();
        });
    });

    // ── notFound ──────────────────────────────────────────────────────────────
    describe('notFound middleware', () => {
        it('should call next with a CustomAPIError', () => {
            const req = mockReq({ originalUrl: '/api/v1/nonexistent' });
            const res = mockRes();
            const next = mockNext();

            notFound(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            const error = next.mock.calls[0][0];
            expect(error).toBeInstanceOf(CustomAPIError);
            expect(error.statusCode).toBe(404);
        });

        it('should include the request URL in the error message', () => {
            const req = mockReq({ originalUrl: '/api/v1/missing-page' });
            const res = mockRes();
            const next = mockNext();

            notFound(req, res, next);

            const error = next.mock.calls[0][0];
            expect(error.message).toContain('/api/v1/missing-page');
        });
    });

    // ── errorHandler ──────────────────────────────────────────────────────────
    describe('errorHandlerMiddleware', () => {
        it('should handle CustomAPIError and return its statusCode + message', () => {
            const err = new CustomAPIError('Custom error message', 403);
            const req = mockReq();
            const res = mockRes();
            const next = mockNext();

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ msg: 'Custom error message' });
        });

        it('should handle Mongoose ValidationError', () => {
            const err = {
                name: 'ValidationError',
                message: 'Validation failed',
                errors: {
                    title: { message: 'Title is required' },
                    slug: { message: 'Slug is required' },
                },
            };
            const req = mockReq();
            const res = mockRes();
            const next = mockNext();

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            const jsonArg = res.json.mock.calls[0][0];
            expect(jsonArg.msg).toContain('Title is required');
            expect(jsonArg.msg).toContain('Slug is required');
        });

        it('should handle Mongoose CastError (invalid ObjectId)', () => {
            const err = {
                name: 'CastError',
                value: 'invalid-id-123',
                message: 'Cast to ObjectId failed',
            };
            const req = mockReq();
            const res = mockRes();
            const next = mockNext();

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            const jsonArg = res.json.mock.calls[0][0];
            expect(jsonArg.msg).toContain('invalid-id-123');
        });

        it('should handle duplicate key error (code 11000)', () => {
            const err = {
                code: 11000,
                keyValue: { email: 'test@example.com' },
                message: 'Duplicate key',
            };
            const req = mockReq();
            const res = mockRes();
            const next = mockNext();

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            const jsonArg = res.json.mock.calls[0][0];
            expect(jsonArg.msg).toContain('email');
            expect(jsonArg.msg).toContain('Duplicate');
        });

        it('should handle database timeout errors', () => {
            const err = {
                message: 'Operation xyz buffered query timed out after 10000ms',
            };
            const req = mockReq();
            const res = mockRes();
            const next = mockNext();

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(503);
            const jsonArg = res.json.mock.calls[0][0];
            expect(jsonArg.msg).toContain('Database connection timed out');
        });

        it('should default to 500 for unknown errors', () => {
            const err = {
                message: 'Something completely unexpected',
            };
            const req = mockReq();
            const res = mockRes();
            const next = mockNext();

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
