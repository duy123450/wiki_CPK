const request = require('supertest')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

process.env.NODE_ENV = 'test'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest'
process.env.JWT_ACCESS_LIFETIME = '15m'
process.env.JWT_REFRESH_LIFETIME = '30d'
process.env.ADMIN_SECRET_PEPPER = 'test-admin-secret-pepper-for-jest-only'

const Movie = require('../../modules/wiki/models/movie.model')
const Soundtrack = require('../../modules/soundtrack/sound-track.model')
const User = require('../../modules/auth/user.model')
const redisClient = require('../../config/redis')
const { ROLES } = require('../../constants/roles')
const { MTD_ENABLED, getCurrentAdminPath } = require('../../modules/adminPerimeter/adminPerimeter')

let app

beforeAll(async () => {
  app = require('../../server')
})

const BASE = '/api/v1/wiki/soundtrack'
const adminCacheClearPath = () =>
  `${MTD_ENABLED ? getCurrentAdminPath().path : '/api/v1/admin'}/soundtrack/cache/clear`

const seedMovie = async () =>
  Movie.create({
    title: 'Chou Kaguya Hime',
    synopsis: 'A tale.',
    slug: 'chou-kaguya-hime',
  })

const seedTrack = async (movieId, ov = {}) =>
  Soundtrack.create({
    trackNumber: 1,
    title: 'Opening',
    vocal: 'Singer',
    youtubeId: 'abc123',
    startTime: 0,
    endTime: 240,
    movie: movieId,
    ...ov,
  })

const enableCacheInvalidation = () => {
  const previousNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  const readySpy = jest.spyOn(redisClient, 'isReady', 'get').mockReturnValue(true)
  const scanSpy = jest
    .spyOn(redisClient, 'scan')
    .mockResolvedValue({ cursor: 0, keys: [] })
  const deleteSpy = jest.spyOn(redisClient, 'del').mockResolvedValue(0)

  return {
    scanSpy,
    deleteSpy,
    restore: () => {
      process.env.NODE_ENV = previousNodeEnv
      readySpy.mockRestore()
      scanSpy.mockRestore()
      deleteSpy.mockRestore()
    },
  }
}

describe('Soundtrack API', () => {
  let movie
  beforeEach(async () => {
    movie = await seedMovie()
  })

  describe('GET / (all tracks)', () => {
    it('returns tracks sorted by trackNumber', async () => {
      await seedTrack(movie._id, { trackNumber: 2, title: 'Ending', slug: 'e' })
      await seedTrack(movie._id, {
        trackNumber: 1,
        title: 'Opening',
        slug: 'o',
      })
      const res = await request(app).get(`${BASE}?movieId=${movie._id}`)
      expect(res.status).toBe(200)
      expect(res.body.tracks).toHaveLength(2)
      expect(res.body.tracks[0].trackNumber).toBe(1)
      expect(res.body.tracks[1].trackNumber).toBe(2)
      expect(res.body.tracks[0].movie).toEqual({
        _id: movie._id.toString(),
        title: 'Chou Kaguya Hime',
      })
    })

    it('returns 400 without movieId', async () => {
      const res = await request(app).get(BASE)
      expect(res.status).toBe(400)
    })

    it('returns empty array for movie with no tracks', async () => {
      const res = await request(app).get(`${BASE}?movieId=${movie._id}`)
      expect(res.status).toBe(200)
      expect(res.body.tracks).toEqual([])
    })
  })

  describe('GET /next (playback navigation)', () => {
    it('sequential: returns the next track', async () => {
      const t1 = await seedTrack(movie._id, {
        trackNumber: 1,
        title: 'Track 1',
      })
      await seedTrack(movie._id, { trackNumber: 2, title: 'Track 2' })

      const res = await request(app).get(
        `${BASE}/next?currentTrackId=${t1._id}&mode=sequential&movieId=${movie._id}`
      )
      expect(res.status).toBe(200)
      expect(res.body.mode).toBe('sequential')
      expect(res.body.track.trackNumber).toBe(2)
      expect(res.body.track.movie.title).toBe('Chou Kaguya Hime')
    })

    it('sequential: wraps around to first track', async () => {
      await seedTrack(movie._id, { trackNumber: 1, title: 'Track 1' })
      const t2 = await seedTrack(movie._id, {
        trackNumber: 2,
        title: 'Track 2',
      })

      const res = await request(app).get(
        `${BASE}/next?currentTrackId=${t2._id}&mode=sequential&movieId=${movie._id}`
      )
      expect(res.status).toBe(200)
      expect(res.body.track.trackNumber).toBe(1)
      expect(res.body.wrapped).toBe(true)
    })

    it('shuffle: returns a different track', async () => {
      const t1 = await seedTrack(movie._id, {
        trackNumber: 1,
        title: 'Track 1',
      })
      await seedTrack(movie._id, { trackNumber: 2, title: 'Track 2' })
      await seedTrack(movie._id, { trackNumber: 3, title: 'Track 3' })

      const res = await request(app).get(
        `${BASE}/next?currentTrackId=${t1._id}&mode=shuffle&movieId=${movie._id}`
      )
      expect(res.status).toBe(200)
      expect(res.body.mode).toBe('shuffle')
      expect(res.body.track).toBeDefined()
      // Should not return the same track (with >1 track available)
      expect(res.body.track._id.toString()).not.toBe(t1._id.toString())
    })

    it('infinite: returns same track with restart flag', async () => {
      const t1 = await seedTrack(movie._id, { trackNumber: 1 })

      const res = await request(app).get(
        `${BASE}/next?currentTrackId=${t1._id}&mode=infinite&movieId=${movie._id}`
      )
      expect(res.status).toBe(200)
      expect(res.body.mode).toBe('infinite')
      expect(res.body.track._id.toString()).toBe(t1._id.toString())
      expect(res.body.restart).toBe(true)
    })

    it('returns 400 for invalid mode', async () => {
      const t1 = await seedTrack(movie._id)
      await seedTrack(movie._id, { trackNumber: 2, title: 'Track 2' })
      const res = await request(app).get(
        `${BASE}/next?currentTrackId=${t1._id}&mode=invalid&movieId=${movie._id}`
      )
      expect(res.status).toBe(400)
    })

    it('returns 400 when params are missing', async () => {
      const res = await request(app).get(`${BASE}/next`)
      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent track', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app).get(
        `${BASE}/next?currentTrackId=${fakeId}&mode=sequential&movieId=${movie._id}`
      )
      expect(res.status).toBe(404)
    })

    it('sequential with single track: restarts', async () => {
      const t1 = await seedTrack(movie._id, { trackNumber: 1 })
      const res = await request(app).get(
        `${BASE}/next?currentTrackId=${t1._id}&mode=sequential&movieId=${movie._id}`
      )
      expect(res.status).toBe(200)
      // With only 1 track, it should restart
      expect(res.body.restart).toBe(true)
    })
  })

  describe('GET /:slug (single track by slug)', () => {
    it('returns the track when slug is matched exactly', async () => {
      const track = await seedTrack(movie._id, {
        trackNumber: 1,
        title: 'Opening Theme',
        slug: 'opening-theme',
      })

      const res = await request(app).get(`${BASE}/opening-theme`)
      expect(res.status).toBe(200)
      expect(res.body.track).toBeDefined()
      expect(res.body.track.title).toBe('Opening Theme')
      expect(res.body.track._id.toString()).toBe(track._id.toString())
      expect(res.body.track.movie).toEqual({
        _id: movie._id.toString(),
        title: 'Chou Kaguya Hime',
      })
    })

    it('returns 404 if the slug does not exist and regex title match fails', async () => {
      const res = await request(app).get(`${BASE}/non-existent-slug`)
      expect(res.status).toBe(404)
      expect(res.body.msg).toContain('No soundtrack found with slug')
    })

    it('falls back to matching by title regex when exact slug match is not found', async () => {
      // Create a track without a slug (or mismatching slug) but with matching title
      const track = await seedTrack(movie._id, {
        trackNumber: 3,
        title: 'Insert Song One',
        slug: 'different-slug',
      })

      // Query using slug 'insert-song-one', which should fall back to matching title 'Insert Song One'
      const res = await request(app).get(`${BASE}/insert-song-one`)
      expect(res.status).toBe(200)
      expect(res.body.track).toBeDefined()
      expect(res.body.track.title).toBe('Insert Song One')
      expect(res.body.track._id.toString()).toBe(track._id.toString())
    })
  })

  describe('POST /api/v1/admin/:token/soundtrack/cache/clear', () => {
    it('does not invalidate cache for an unauthorized request', async () => {
      const cache = enableCacheInvalidation()

      try {
        const res = await request(app)
          .post(adminCacheClearPath())
          .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
          .set('x-csrf-token', 'test-csrf-token')

        expect(res.status).toBe(401)
        expect(cache.scanSpy).not.toHaveBeenCalled()
        expect(cache.deleteSpy).not.toHaveBeenCalled()
      } finally {
        cache.restore()
      }
    })

    it('does not invalidate cache when Redis blacklist lookup throws', async () => {
      const cache = enableCacheInvalidation()
      const getSpy = jest
        .spyOn(redisClient, 'get')
        .mockRejectedValue(new Error('Redis unavailable'))

      try {
        const admin = await User.create({
          username: 'redis-failure-admin',
          email: 'redis-failure-admin@test.com',
          password: 'password123',
          role: ROLES.ADMIN,
        })
        const token = admin.createAccessToken()
        const decoded = jwt.decode(token)

        const res = await request(app)
          .post(adminCacheClearPath())
          .set('Authorization', `Bearer ${token}`)
          .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
          .set('x-csrf-token', 'test-csrf-token')

        expect(res.status).toBe(401)
        expect(getSpy).toHaveBeenCalledWith(`blacklist:${decoded.jti}`)
        expect(cache.scanSpy).not.toHaveBeenCalled()
        expect(cache.deleteSpy).not.toHaveBeenCalled()
      } finally {
        getSpy.mockRestore()
        cache.restore()
      }
    })

    it('does not authenticate an expired access token', async () => {
      const cache = enableCacheInvalidation()
      const getSpy = jest.spyOn(redisClient, 'get')

      try {
        const token = jwt.sign(
          {
            userId: 'expired-admin',
            name: 'expired-admin',
            role: ROLES.ADMIN,
            jti: 'expired-access-jti',
          },
          'test-access-secret-key-for-jest',
          { expiresIn: -1 }
        )

        const res = await request(app)
          .post(adminCacheClearPath())
          .set('Authorization', `Bearer ${token}`)
          .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
          .set('x-csrf-token', 'test-csrf-token')

        expect(res.status).toBe(401)
        expect(getSpy).not.toHaveBeenCalled()
        expect(cache.scanSpy).not.toHaveBeenCalled()
        expect(cache.deleteSpy).not.toHaveBeenCalled()
      } finally {
        getSpy.mockRestore()
        cache.restore()
      }
    })

    it('does not authenticate an access token with a missing JTI', async () => {
      const cache = enableCacheInvalidation()
      const getSpy = jest.spyOn(redisClient, 'get')

      try {
        const token = jwt.sign(
          {
            userId: 'missing-jti-admin',
            name: 'missing-jti-admin',
            role: ROLES.ADMIN,
          },
          'test-access-secret-key-for-jest',
          { expiresIn: '15m' }
        )

        const res = await request(app)
          .post(adminCacheClearPath())
          .set('Authorization', `Bearer ${token}`)
          .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
          .set('x-csrf-token', 'test-csrf-token')

        expect(res.status).toBe(401)
        expect(getSpy).not.toHaveBeenCalled()
        expect(cache.scanSpy).not.toHaveBeenCalled()
        expect(cache.deleteSpy).not.toHaveBeenCalled()
      } finally {
        getSpy.mockRestore()
        cache.restore()
      }
    })

    it('does not authenticate an access token with a malformed JTI', async () => {
      const cache = enableCacheInvalidation()
      const getSpy = jest.spyOn(redisClient, 'get')

      try {
        const token = jwt.sign(
          {
            userId: 'malformed-jti-admin',
            name: 'malformed-jti-admin',
            role: ROLES.ADMIN,
            jti: 'malformed jti',
          },
          'test-access-secret-key-for-jest',
          { expiresIn: '15m' }
        )

        const res = await request(app)
          .post(adminCacheClearPath())
          .set('Authorization', `Bearer ${token}`)
          .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
          .set('x-csrf-token', 'test-csrf-token')

        expect(res.status).toBe(401)
        expect(getSpy).not.toHaveBeenCalled()
        expect(cache.scanSpy).not.toHaveBeenCalled()
        expect(cache.deleteSpy).not.toHaveBeenCalled()
      } finally {
        getSpy.mockRestore()
        cache.restore()
      }
    })

    it('does not invalidate cache for a revoked admin token', async () => {
      const cache = enableCacheInvalidation()
      const getSpy = jest.spyOn(redisClient, 'get').mockResolvedValue('true')

      try {
        const admin = await User.create({
          username: 'revoked-admin',
          email: 'revoked-admin@test.com',
          password: 'password123',
          role: ROLES.ADMIN,
        })
        const token = admin.createAccessToken()
        const decoded = jwt.decode(token)

        const res = await request(app)
          .post(adminCacheClearPath())
          .set('Authorization', `Bearer ${token}`)
          .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
          .set('x-csrf-token', 'test-csrf-token')

        expect(res.status).toBe(401)
        expect(getSpy).toHaveBeenCalledWith(`blacklist:${decoded.jti}`)
        expect(cache.scanSpy).not.toHaveBeenCalled()
        expect(cache.deleteSpy).not.toHaveBeenCalled()
      } finally {
        getSpy.mockRestore()
        cache.restore()
      }
    })

    it('invalidates soundtrack cache for an authorized admin', async () => {
      const cache = enableCacheInvalidation()
      const keys = [
        'cache:soundtracks:public:/api/v1/wiki/soundtrack?movieId=1',
        'cache:soundtracks:privileged:/api/v1/wiki/soundtrack?movieId=1',
      ]
      let resolveDeletedKeys
      const deletedKeys = new Promise((resolve) => {
        resolveDeletedKeys = resolve
      })

      try {
        cache.scanSpy.mockResolvedValue({ cursor: 0, keys })
        cache.deleteSpy.mockImplementation(async (keysToDelete) => {
          resolveDeletedKeys(keysToDelete)
          return keysToDelete.length
        })

        const admin = await User.create({
          username: 'soundtrackadmin',
          email: 'soundtrackadmin@test.com',
          password: 'password123',
          role: ROLES.ADMIN,
        })
        const res = await request(app)
          .post(adminCacheClearPath())
          .set('Authorization', `Bearer ${admin.createAccessToken()}`)
          .set('Cookie', 'XSRF-TOKEN=test-csrf-token')
          .set('x-csrf-token', 'test-csrf-token')

        expect(res.status).toBe(200)
        expect(res.body).toEqual({ message: 'Soundtrack cache cleared' })
        expect(await deletedKeys).toEqual(keys)
        expect(cache.scanSpy).toHaveBeenCalledWith(
          0,
          expect.objectContaining({ MATCH: 'cache:soundtracks:*' })
        )
      } finally {
        cache.restore()
      }
    })

    it('does not invalidate cache when the request body is malformed', async () => {
      const cache = enableCacheInvalidation()

      try {
        const res = await request(app)
          .post(adminCacheClearPath())
          .set('Content-Type', 'application/json')
          .send('{')

        expect(res.status).toBe(400)
        expect(cache.scanSpy).not.toHaveBeenCalled()
        expect(cache.deleteSpy).not.toHaveBeenCalled()
      } finally {
        cache.restore()
      }
    })
  })
})
