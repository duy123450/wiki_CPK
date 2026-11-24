const request = require('supertest')
const app = require('../../server')
const User = require('../../modules/auth/user.model')
const redisClient = require('../../config/redis')
const jwt = require('jsonwebtoken')
const envConfig = require('../../config/env.config')

const mockBlacklist = () => {
  const entries = new Map()
  const writes = []
  const failingWrites = new Set()
  const getSpy = jest.spyOn(redisClient, 'get').mockImplementation(async (key) =>
    entries.get(key) ?? null
  )
  const setExSpy = jest
    .spyOn(redisClient, 'setEx')
    .mockImplementation(async (key, _ttl, value) => {
      writes.push({ key, ttl: _ttl, value })
      if (failingWrites.has(key)) {
        throw new Error('Redis write failed')
      }
      entries.set(key, value)
      return 'OK'
    })

  return {
    writes,
    failingWrites,
    restore: () => {
      getSpy.mockRestore()
      setExSpy.mockRestore()
    },
  }
}

describe('Auth Extended - Logout and Blacklist', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    // Clear redis mocks or test keys if needed
  })

  it('should revoke access and refresh tokens and handle repeated logout', async () => {
    const blacklist = mockBlacklist()

    try {
      await User.create({
        username: 'logoutuser',
        email: 'logout@test.com',
        password: 'password123',
      })

      const loginRes = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'logoutuser', password: 'password123' })

      expect(loginRes.status).toBe(200)

      const refreshCookie = loginRes.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )
      const refreshToken = refreshCookie.split(';')[0].slice('refreshToken='.length)
      const accessToken = loginRes.body.accessToken
      const accessJti = jwt.decode(accessToken).jti
      const refreshJti = jwt.decode(refreshToken).jti
      const user = await User.findOne({ username: 'logoutuser' })

      expect(user.refreshToken).toBe(refreshToken)

      const logoutRes = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshCookie)

      expect(logoutRes.status).toBe(200)
      expect(logoutRes.headers['set-cookie'].some((cookie) =>
        cookie.includes('refreshToken=;')
      )).toBe(true)
      expect(await User.findById(user._id).then((savedUser) => savedUser.refreshToken))
        .toBeNull()
      expect(await redisClient.get(`blacklist:${accessJti}`)).toBe('true')
      expect(await redisClient.get(`blacklist:${refreshJti}`)).toBe('1')

      const meRes = await request(app)
        .get('/api/v1/wiki/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(meRes.status).toBe(401)

      const refreshRes = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', refreshCookie)
      expect(refreshRes.status).toBe(401)

      const repeatedLogoutRes = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshCookie)
      expect(repeatedLogoutRes.status).toBe(200)
    } finally {
      blacklist.restore()
    }
  })

  it('should allow refresh-cookie logout without an access token', async () => {
    const blacklist = mockBlacklist()

    try {
      const registerRes = await request(app)
        .post('/api/v1/wiki/auth/register')
        .send({
          username: 'cookieonly',
          email: 'cookieonly@test.com',
          password: 'password123',
        })
      const refreshCookie = registerRes.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )
      const refreshToken = refreshCookie.split(';')[0].slice('refreshToken='.length)
      const refreshJti = jwt.decode(refreshToken).jti
      const user = await User.findOne({ username: 'cookieonly' })

      const logoutRes = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Cookie', refreshCookie)

      expect(logoutRes.status).toBe(200)
      expect(await User.findById(user._id).then((savedUser) => savedUser.refreshToken))
        .toBeNull()
      expect(await redisClient.get(`blacklist:${refreshJti}`)).toBe('1')

      const refreshRes = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', refreshCookie)
      expect(refreshRes.status).toBe(401)
    } finally {
      blacklist.restore()
    }
  })

  it('should ignore mismatched refresh cookies and preserve newer sessions on repeated logout', async () => {
    const blacklist = mockBlacklist()

    try {
      await User.create({
        username: 'ownerone',
        email: 'ownerone@test.com',
        password: 'password123',
      })
      await User.create({
        username: 'ownertwo',
        email: 'ownertwo@test.com',
        password: 'password123',
      })

      const ownerOneLogin = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'ownerone', password: 'password123' })
      const ownerTwoLogin = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'ownertwo', password: 'password123' })
      const ownerOneCookie = ownerOneLogin.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )
      const ownerTwoCookie = ownerTwoLogin.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )

      const mismatchLogout = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', `Bearer ${ownerOneLogin.body.accessToken}`)
        .set('Cookie', ownerTwoCookie)
      expect(mismatchLogout.status).toBe(200)
      expect((await User.findOne({ username: 'ownerone' })).refreshToken)
        .toBe(ownerOneCookie.split(';')[0].slice('refreshToken='.length))
      expect((await User.findOne({ username: 'ownertwo' })).refreshToken)
        .toBe(ownerTwoCookie.split(';')[0].slice('refreshToken='.length))

      const ownerTwoRefresh = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', ownerTwoCookie)
      expect(ownerTwoRefresh.status).toBe(200)

      const newerOwnerOneLogin = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'ownerone', password: 'password123' })
      const newerOwnerOneCookie = newerOwnerOneLogin.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )

      const repeatedLogout = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', `Bearer ${ownerOneLogin.body.accessToken}`)
        .set('Cookie', ownerOneCookie)
      expect(repeatedLogout.status).toBe(200)
      expect((await User.findOne({ username: 'ownerone' })).refreshToken)
        .toBe(newerOwnerOneCookie.split(';')[0].slice('refreshToken='.length))

      const newerOwnerOneRefresh = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', newerOwnerOneCookie)
      expect(newerOwnerOneRefresh.status).toBe(200)
    } finally {
      blacklist.restore()
    }
  })

  it('should use a valid refresh cookie when the access token is invalid', async () => {
    const blacklist = mockBlacklist()

    try {
      await User.create({
        username: 'invalidaccess',
        email: 'invalidaccess@test.com',
        password: 'password123',
      })
      const loginRes = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'invalidaccess', password: 'password123' })
      const refreshCookie = loginRes.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )

      const logoutRes = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', 'Bearer invalid-access-token')
        .set('Cookie', refreshCookie)
      expect(logoutRes.status).toBe(200)
      expect((await User.findOne({ username: 'invalidaccess' })).refreshToken).toBeNull()

      const refreshRes = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', refreshCookie)
      expect(refreshRes.status).toBe(401)
    } finally {
      blacklist.restore()
    }
  })

  it('should blacklist an access token through its full remaining lifetime', async () => {
    const blacklist = mockBlacklist()

    try {
      const user = await User.create({
        username: 'longlivedaccess',
        email: 'longlivedaccess@test.com',
        password: 'password123',
      })
      const loginRes = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'longlivedaccess', password: 'password123' })
      const refreshCookie = loginRes.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )
      const accessToken = jwt.sign(
        {
          userId: user._id,
          name: user.username,
          role: user.role,
          jti: 'long-lived-access',
        },
        envConfig.JWT_ACCESS_SECRET,
        { expiresIn: '30m' }
      )

      const logoutRes = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshCookie)
      expect(logoutRes.status).toBe(200)
      expect(
        blacklist.writes.find((write) => write.key === 'blacklist:long-lived-access').ttl
      ).toBeGreaterThan(15 * 60)

      const meRes = await request(app)
        .get('/api/v1/wiki/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(meRes.status).toBe(401)
    } finally {
      blacklist.restore()
    }
  })

  it('should not report successful logout when the access-token blacklist write fails', async () => {
    const blacklist = mockBlacklist()

    try {
      await User.create({
        username: 'accesswritefailure',
        email: 'accesswritefailure@test.com',
        password: 'password123',
      })
      const loginRes = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'accesswritefailure', password: 'password123' })
      const refreshCookie = loginRes.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )
      const refreshToken = refreshCookie.split(';')[0].slice('refreshToken='.length)
      const accessJti = jwt.decode(loginRes.body.accessToken).jti
      blacklist.failingWrites.add(`blacklist:${accessJti}`)

      const logoutRes = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .set('Cookie', refreshCookie)
      expect(logoutRes.status).toBe(500)
      expect((await User.findOne({ username: 'accesswritefailure' })).refreshToken)
        .toBe(refreshToken)

      const refreshRes = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', refreshCookie)
      expect(refreshRes.status).toBe(200)
    } finally {
      blacklist.restore()
    }
  })

  it('should not report successful logout when the refresh-token blacklist write fails', async () => {
    const blacklist = mockBlacklist()

    try {
      await User.create({
        username: 'refreshwritefailure',
        email: 'refreshwritefailure@test.com',
        password: 'password123',
      })
      const loginRes = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'refreshwritefailure', password: 'password123' })
      const refreshCookie = loginRes.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )
      const refreshToken = refreshCookie.split(';')[0].slice('refreshToken='.length)
      const accessToken = loginRes.body.accessToken
      const refreshJti = jwt.decode(refreshToken).jti
      blacklist.failingWrites.add(`blacklist:${refreshJti}`)

      const logoutRes = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshCookie)
      expect(logoutRes.status).toBe(500)
      expect((await User.findOne({ username: 'refreshwritefailure' })).refreshToken)
        .toBeNull()

      const meRes = await request(app)
        .get('/api/v1/wiki/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(meRes.status).toBe(401)

      const refreshRes = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', refreshCookie)
      expect(refreshRes.status).toBe(401)
    } finally {
      blacklist.restore()
    }
  })

  it('should support login, refresh, then logout using the refreshed access token', async () => {
    const blacklist = mockBlacklist()

    try {
      await User.create({
        username: 'fullauthflow',
        email: 'fullauthflow@test.com',
        password: 'password123',
      })
      const loginRes = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'fullauthflow', password: 'password123' })
      const refreshCookie = loginRes.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )

      const refreshRes = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', refreshCookie)
      expect(refreshRes.status).toBe(200)

      const logoutRes = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', `Bearer ${refreshRes.body.accessToken}`)
        .set('Cookie', refreshCookie)
      expect(logoutRes.status).toBe(200)

      const accessRes = await request(app)
        .get('/api/v1/wiki/auth/me')
        .set('Authorization', `Bearer ${refreshRes.body.accessToken}`)
      expect(accessRes.status).toBe(401)

      const postLogoutRefresh = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', refreshCookie)
      expect(postLogoutRefresh.status).toBe(401)
    } finally {
      blacklist.restore()
    }
  })

  it('should not clear a stored refresh token when the supplied cookie is invalid', async () => {
    const blacklist = mockBlacklist()

    try {
      await User.create({
        username: 'invalidrefresh',
        email: 'invalidrefresh@test.com',
        password: 'password123',
      })
      const loginRes = await request(app)
        .post('/api/v1/wiki/auth/login')
        .send({ identifier: 'invalidrefresh', password: 'password123' })
      const refreshCookie = loginRes.headers['set-cookie'].find((cookie) =>
        cookie.startsWith('refreshToken=')
      )
      const refreshToken = refreshCookie.split(';')[0].slice('refreshToken='.length)

      const logoutRes = await request(app)
        .post('/api/v1/wiki/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .set('Cookie', 'refreshToken=invalid')
      expect(logoutRes.status).toBe(200)
      expect((await User.findOne({ username: 'invalidrefresh' })).refreshToken)
        .toBe(refreshToken)

      const refreshRes = await request(app)
        .post('/api/v1/wiki/auth/refresh')
        .set('Cookie', refreshCookie)
      expect(refreshRes.status).toBe(200)
    } finally {
      blacklist.restore()
    }
  })

  it('should reject blacklisted tokens', async () => {
    const blacklist = mockBlacklist()

    try {
      const user = await User.create({
        username: 'jtitest',
        email: 'jti@test.com',
        password: 'pass123',
      })

      const token = user.createAccessToken()
      const decoded = jwt.decode(token)
      await redisClient.setEx(`blacklist:${decoded.jti}`, 3600, 'true')

      const res = await request(app)
        .get('/api/v1/wiki/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(401)
      expect(res.body.msg).toContain('Token revoked')
    } finally {
      blacklist.restore()
    }
  })
})
