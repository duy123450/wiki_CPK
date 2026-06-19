/**
 * Mock Factory — DRY Request/Response/Next Builders
 * Eliminates boilerplate mock setup in controller tests.
 *
 * Usage:
 *   const { req, res } = createMocks();
 *   const { req, res } = createMocks({ query: { page: 1 } });
 */

function createMocks(overrides = {}) {
  const mockReq = {
    params: overrides.params || {},
    query: overrides.query || {},
    body: overrides.body || {},
    headers: overrides.headers || {},
    user: overrides.user || undefined,
    session: overrides.session || undefined,
    ...overrides.reqExtras,
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
