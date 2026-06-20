/**
 * Mock Factory — DRY Request/Response/Next Builders
 * Eliminates boilerplate mock setup in controller tests.
 *
 * Usage:
 *   const { req, res } = createMocks();
 *   const { req, res } = createMocks({ query: { page: 1 } });
 *   const { req, res } = createMocks({ user: { role: 'admin' }, originalUrl: '/test' });
 */

function createMocks(overrides = {}) {
    const { params, query, body, headers, user, session, reqExtras, ...customProps } = overrides;
    const mockReq = {
        params: params || {},
        query: query || {},
        body: body || {},
        headers: headers || {},
        user: user || undefined,
        session: session || undefined,
        ...customProps,  // Support arbitrary request properties (originalUrl, etc.)
        ...reqExtras,
    };

    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        redirect: jest.fn(),
        cookie: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        end: jest.fn(),
        ...overrides.resExtras,
    };

    const mockNext = jest.fn();

    return {
        req: mockReq,
        res: mockRes,
        next: mockNext,
    };
}

/**
 * Create authenticated request (user attached)
 */
function createAuthenticatedMocks(user = {}, overrides = {}) {
    const defaultUser = {
        _id: 'mock-user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user'],
        ...user,
    };

    return createMocks({
        ...overrides,
        user: defaultUser,
    });
}

/**
 * Create request with query params
 */
function createMocksWithQuery(query = {}, overrides = {}) {
    return createMocks({ ...overrides, query });
}

/**
 * Create request with body
 */
function createMocksWithBody(body = {}, overrides = {}) {
    return createMocks({ ...overrides, body });
}

/**
 * Create request with params (route parameters)
 */
function createMocksWithParams(params = {}, overrides = {}) {
    return createMocks({ ...overrides, params });
}

module.exports = {
    createMocks,
    createAuthenticatedMocks,
    createMocksWithQuery,
    createMocksWithBody,
    createMocksWithParams,
};
