const request = require('supertest')
const express = require('express')

process.env.NODE_ENV = 'test'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest'
process.env.JWT_ACCESS_LIFETIME = '15m'
process.env.JWT_REFRESH_LIFETIME = '30d'
process.env.ADMIN_SECRET_PEPPER = 'test-admin-secret-pepper-for-jest-only'

const User = require('../../modules/auth/user.model')
const { authorizeRoles, ROLES } = require('../../middleware/authorizeRoles')
const envConfig = require('../../config/env.config')
const {
  MTD_ENABLED,
  getCurrentAdminPath,
  strikeRegistry,
  validateWindowToken,
  admitTrap,
  finalizeTrap,
} = require('../../modules/adminPerimeter/adminPerimeter')
const {
  checkDynamicRoute,
  frontGateFilter,
  tarpitTrap,
} = require('../../modules/adminPerimeter/adminPerimeter.middleware')
const errorHandlerMiddleware = require('../../middleware/error-handler')
const adminRouter = require('../../modules/admin/admin.route')

let app

const mtdValidationApp = express()
mtdValidationApp.get('/admin/:token', (req, res) => {
  const matchedOffset = validateWindowToken(req.params.token)
  res.sendStatus(matchedOffset === null ? 403 : 204)
})
mtdValidationApp.use(errorHandlerMiddleware)

beforeAll(() => {
  adminRouter.get('/:token/future-test', (_req, res) => res.sendStatus(204))
  app = require('../../server')
})

afterEach(() => {
  for (const [ip, entry] of strikeRegistry) {
    if (entry.activeTrap) finalizeTrap(ip, entry)
  }
  strikeRegistry.clear()
})

const adminEndpoint = () =>
  `${MTD_ENABLED ? getCurrentAdminPath().path : '/api/v1/admin'}/soundtrack/cache/clear`

const encodePathToken = (token) =>
  token.replace(/[a-f0-9]/g, (char) =>
    `%${char.charCodeAt(0).toString(16)}`
  )

const createAccessToken = async (role) => {
  const user = await User.create({
    username: `boundary-${role}`,
    email: `boundary-${role}@test.com`,
    password: 'password123',
    role,
  })

  return user.createAccessToken()
}

const postAdminOperation = (token) => {
  let req = request(app)
    .post(adminEndpoint())
    .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
    .set('x-csrf-token', 'test-csrf-token')

  if (token) req = req.set('Authorization', `Bearer ${token}`)
  return req
}

const postAdminOperationAt = (path, token) => {
  let req = request(app)
    .post(path)
    .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
    .set('x-csrf-token', 'test-csrf-token')

  if (token) req = req.set('Authorization', `Bearer ${token}`)
  return req
}

describe('Admin API security boundary', () => {
  describe('MTD token validation', () => {
    const generatedToken = () => getCurrentAdminPath().path.split('/').pop()

    it('accepts a valid generated token', async () => {
      const token = generatedToken()

      expect(validateWindowToken(token)).not.toBeNull()

      const res = await request(mtdValidationApp).get(`/admin/${token}`)
      expect(res.status).toBe(204)
    })

    it.each([
      ['short token', (token) => token.slice(0, -1)],
      ['long token', (token) => `${token}0`],
      ['uppercase hexadecimal token', (token) => `A${token.slice(1).toUpperCase()}`],
      ['non-hexadecimal token', (token) => `${token.slice(0, -1)}g`],
      ['multi-byte token', () => 'é'.repeat(64)],
    ])('rejects a %s without returning HTTP 500', async (_label, mutateToken) => {
      const candidate = mutateToken(generatedToken())

      expect(validateWindowToken(candidate)).toBeNull()

      const res = await request(mtdValidationApp)
        .get(`/admin/${encodeURIComponent(candidate)}`)

      expect(res.status).toBe(403)
      expect(res.status).not.toBe(500)
    })

    it('sends malformed candidates through the existing invalid-token handling', () => {
      jest.useFakeTimers()
      const req = {
        ip: '127.0.0.2',
        params: { token: 'é'.repeat(64) },
        path: '/soundtrack/cache/clear',
        method: 'POST',
        headers: {},
        socket: { destroyed: false, remoteAddress: '127.0.0.2' },
      }
      const res = {
        destroyed: false,
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      }
      const next = jest.fn()

      try {
        expect(() => checkDynamicRoute(req, res, next)).not.toThrow()
        expect(strikeRegistry.has(req.ip)).toBe(true)
        expect(res.setHeader).toHaveBeenCalledWith(
          'Content-Type',
          'text/plain; charset=utf-8'
        )

        jest.advanceTimersByTime(60_000)

        expect(res.end).toHaveBeenCalled()
        expect(next).not.toHaveBeenCalled()
      } finally {
        jest.useRealTimers()
        strikeRegistry.clear()
      }
    })
  })

  describe('MTD token expiry and clock skew', () => {
    const windowMs = 60_000

    it('reports expiry at the end of the last accepted bucket', () => {
      const currentWindowStart =
        Math.floor(Date.now() / windowMs) * windowMs
      jest.useFakeTimers()

      try {
        jest.setSystemTime(currentWindowStart + 25_000)
        const { path, expiresInMs } = getCurrentAdminPath()
        const token = path.split('/').pop()

        expect(expiresInMs).toBe(95_000)
        expect(validateWindowToken(token)).toBe(0)

        jest.advanceTimersByTime(35_000)
        expect(validateWindowToken(token)).toBe(-1)

        jest.advanceTimersByTime(59_999)
        expect(validateWindowToken(token)).toBe(-1)

        jest.advanceTimersByTime(1)
        expect(validateWindowToken(token)).toBeNull()
      } finally {
        jest.useRealTimers()
      }
    })

    it('retains previous, current, and next bucket clock-skew tolerance', () => {
      const currentWindowStart =
        Math.floor(Date.now() / windowMs) * windowMs
      const currentTime = currentWindowStart + 20_000
      jest.useFakeTimers()

      try {
        jest.setSystemTime(currentTime)
        const currentToken = getCurrentAdminPath().path.split('/').pop()
        expect(validateWindowToken(currentToken)).toBe(0)

        jest.setSystemTime(currentTime - windowMs)
        const previousToken = getCurrentAdminPath().path.split('/').pop()
        jest.setSystemTime(currentTime)
        expect(validateWindowToken(previousToken)).toBe(-1)

        jest.setSystemTime(currentTime + windowMs)
        const nextToken = getCurrentAdminPath().path.split('/').pop()
        jest.setSystemTime(currentTime)
        expect(validateWindowToken(nextToken)).toBe(1)
      } finally {
        jest.useRealTimers()
      }
    })
  })

  it('rejects unauthenticated requests even with a valid MTD path', async () => {
    expect(MTD_ENABLED).toBe(true)
    const res = await postAdminOperation()

    expect(res.status).toBe(401)
  })

  it.each(['user', 'sub_admin'])('rejects the %s role', async (role) => {
    const res = await postAdminOperation(await createAccessToken(role))

    expect(res.status).toBe(403)
  })

  it('redacts the MTD token from RBAC denial events while preserving the route', async () => {
    const activeAdminPath = getCurrentAdminPath().path
    const token = activeAdminPath.split('/').pop()
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      const res = await postAdminOperationAt(
        `${activeAdminPath}/soundtrack/cache/clear`,
        await createAccessToken('user')
      )
      const eventCall = warn.mock.calls.find(([message]) =>
        message.includes('UNAUTHORIZED_ROLE_ACCESS')
      )

      expect(res.status).toBe(403)
      expect(eventCall).toBeDefined()
      expect(eventCall[1].path).toBe(
        '/api/v1/admin/[REDACTED]/soundtrack/cache/clear'
      )
      expect(JSON.stringify(eventCall)).not.toContain(token)
    } finally {
      warn.mockRestore()
    }
  })

  it('redacts a percent-encoded MTD token from RBAC denial events', async () => {
    const activeAdminPath = getCurrentAdminPath().path
    const token = activeAdminPath.split('/').pop()
    const encodedAdminPath = activeAdminPath.replace(token, encodePathToken(token))
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      const res = await postAdminOperationAt(
        `${encodedAdminPath}/soundtrack/cache/clear`,
        await createAccessToken('user')
      )
      const eventCall = warn.mock.calls.find(([message]) =>
        message.includes('UNAUTHORIZED_ROLE_ACCESS')
      )

      expect(res.status).toBe(403)
      expect(eventCall[1].path).toBe(
        '/api/v1/admin/[REDACTED]/soundtrack/cache/clear'
      )
      expect(JSON.stringify(eventCall)).not.toContain(token)
    } finally {
      warn.mockRestore()
    }
  })

  it('redacts percent-encoded MTD tokens in front-gate blacklist logs', () => {
    const activeAdminPath = getCurrentAdminPath().path
    const token = activeAdminPath.split('/').pop()
    const encodedAdminPath = activeAdminPath.replace(token, encodePathToken(token))
    const ip = '192.0.2.1'
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const admission = admitTrap(ip)
    expect(admission.status).toBe('reserved')
    finalizeTrap(ip, admission.entry)

    try {
      frontGateFilter(
        {
          ip,
          path: `${encodedAdminPath}/private-operation`,
          method: 'GET',
          socket: { destroy: jest.fn() },
        },
        {},
        jest.fn()
      )

      const eventCall = warn.mock.calls.find(([message]) =>
        message.includes('PERIMETER_BLACKLIST_BLOCK')
      )
      expect(eventCall[1].path).toBe(
        '/api/v1/admin/[REDACTED]/private-operation'
      )
      expect(JSON.stringify(eventCall)).not.toContain(token)
    } finally {
      strikeRegistry.delete(ip)
      warn.mockRestore()
    }
  })

  it('leaves ordinary non-tokenized route logging unchanged', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const req = {
      user: { userId: 'wiki-user', role: 'user' },
      originalUrl: '/api/v1/wiki/soundtrack?refresh=1',
    }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    try {
      authorizeRoles(ROLES.ADMIN)(req, res, jest.fn())

      expect(warn).toHaveBeenCalledWith(
        '[SECURITY EVENT] UNAUTHORIZED_ROLE_ACCESS:',
        expect.objectContaining({
          path: '/api/v1/wiki/soundtrack?refresh=1',
        })
      )
    } finally {
      warn.mockRestore()
    }
  })

  it('allows an authenticated admin through the MTD gate', async () => {
    const res = await postAdminOperation(await createAccessToken('admin'))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'Soundtrack cache cleared' })
  })

  it('keeps routes added after the gate behind MTD', async () => {
    const res = await request(app)
      .get(`${getCurrentAdminPath().path}/future-test`)
      .set('Authorization', `Bearer ${await createAccessToken('admin')}`)

    expect(res.status).toBe(204)
  })

  it('rejects the bare cache-clear path when MTD is enabled', async () => {
    const res = await request(app)
      .post('/api/v1/admin/soundtrack/cache/clear')
      .set('Authorization', `Bearer ${await createAccessToken('admin')}`)

    expect(res.status).toBe(403)
    expect(res.body).toEqual({ message: 'MTD token required' })
  })

  it('continues requiring authentication in development mode', async () => {
    const previousNodeEnv = process.env.NODE_ENV
    const previousConfigNodeEnv = envConfig.NODE_ENV
    process.env.NODE_ENV = 'development'
    envConfig.NODE_ENV = 'development'

    try {
      const res = await postAdminOperation()
      expect(res.status).toBe(401)
    } finally {
      process.env.NODE_ENV = previousNodeEnv
      envConfig.NODE_ENV = previousConfigNodeEnv
    }
  })

  it('does not leave the old soundtrack endpoint as an alternate operation', async () => {
    const token = await createAccessToken('admin')
    const res = await request(app)
      .post('/api/v1/wiki/soundtrack/cache/clear')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
      .set('x-csrf-token', 'test-csrf-token')

    expect(res.status).toBe(404)
  })

  it('keeps ordinary wiki routes reachable', async () => {
    const res = await request(app).get('/api/v1/wiki/sidebar')

    expect(res.status).toBe(200)
    expect(res.body.categories).toEqual([])
  })

  it('redacts the MTD token from unknown Admin route 404 responses', async () => {
    const adminToken = await createAccessToken('admin')
    const adminPath = getCurrentAdminPath().path
    const mtdToken = adminPath.split('/').pop()
    const unknownRoute = `${adminPath}/unknown-admin-operation`

    const res = await request(app)
      .get(unknownRoute)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      msg: 'Route not found /api/v1/admin/[REDACTED]/unknown-admin-operation',
      errorType: 'NotFoundError',
    })
    expect(JSON.stringify(res.body)).not.toContain(mtdToken)
  })

  it('redacts a percent-encoded MTD token from an Admin 404 response', async () => {
    const adminToken = await createAccessToken('admin')
    const adminPath = getCurrentAdminPath().path
    const mtdToken = adminPath.split('/').pop()
    const encodedAdminPath = adminPath.replace(
      mtdToken,
      encodePathToken(mtdToken)
    )

    const res = await request(app)
      .get(`${encodedAdminPath}?source=encoded-token-test`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      msg: 'Route not found /api/v1/admin/[REDACTED]?source=encoded-token-test',
      errorType: 'NotFoundError',
    })
    expect(JSON.stringify(res.body)).not.toContain(mtdToken)
    expect(JSON.stringify(res.body)).not.toContain(encodePathToken(mtdToken))
  })

  it('preserves the full path in ordinary non-Admin 404 responses', async () => {
    const path = '/api/v1/not-a-real-route'
    const res = await request(app).get(path)

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      msg: `Route not found ${path}`,
      errorType: 'NotFoundError',
    })
  })

  it('keeps honeypot decoys in the tarpit handler', () => {
    jest.useFakeTimers()
    try {
      const req = {
        ip: '127.0.0.1',
        path: '/wp-login.php',
        method: 'GET',
        headers: {},
        socket: { destroyed: false, remoteAddress: '127.0.0.1' },
      }
      const res = {
        destroyed: false,
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      }

      tarpitTrap(req, res, jest.fn())
      jest.advanceTimersByTime(60_000)

      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Robots-Tag',
        'noindex, nofollow'
      )
      expect(res.write).toHaveBeenCalledWith(' ')
      expect(res.end).toHaveBeenCalled()
      expect(strikeRegistry.has('127.0.0.1')).toBe(true)
    } finally {
      jest.useRealTimers()
      strikeRegistry.clear()
    }
  })
})
