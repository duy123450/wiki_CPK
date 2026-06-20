const User = require('../../modules/auth/user.model')
const { buildGoogleProfile } = require('../utils/authTestHelpers')

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest'
process.env.JWT_ACCESS_LIFETIME = '15m'
process.env.JWT_REFRESH_LIFETIME = '30d'
process.env.NODE_ENV = 'test'

const { googleLoginUser } = require('../../modules/auth/auth.service')

describe('googleLoginUser()', () => {
  describe('input validation', () => {
    it('should throw 400 when profile is missing', async () => {
      await expect(googleLoginUser(undefined)).rejects.toThrow(
        'Google profile is required'
      )
    })

    it('should throw 400 when profile email is missing', async () => {
      await expect(
        googleLoginUser(buildGoogleProfile({ emails: [] }))
      ).rejects.toThrow('Google account email is required')
    })
  })

  describe('new user (no existing account)', () => {
    it('should create a new user and return auth tokens', async () => {
      const result = await googleLoginUser(buildGoogleProfile())

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBeDefined()
      expect(result.user).toHaveProperty('id')
      expect(result.user.role).toBe('user')
    })

    it('should auto-generate a username from Google displayName', async () => {
      const result = await googleLoginUser(
        buildGoogleProfile({ displayName: 'John Doe' })
      )

      expect(result.user.username).toMatch(/^John_Doe_/)
    })

    it('should set avatar from Google profile photo', async () => {
      const result = await googleLoginUser(buildGoogleProfile())

      expect(result.user.avatar.url).toBeDefined()
      expect(result.user.avatar.public_id).toBe('google-avatar')
    })

    it('should store googleId on the new user', async () => {
      const profile = buildGoogleProfile()
      await googleLoginUser(profile)

      const dbUser = await User.findOne({ email: profile.emails[0].value })
      expect(dbUser.googleId).toBe(profile.id)
      expect(dbUser.password).toBeUndefined()
    })
  })

  describe('existing user (matched by googleId)', () => {
    it('should return the existing user without creating a duplicate', async () => {
      const profile = buildGoogleProfile()
      const shortId = profile.id.slice(-4)
      await User.create({
        username: `google_${shortId}`,
        email: profile.emails[0].value,
        googleId: profile.id,
        avatar: { url: profile.photos[0].value, public_id: 'google-avatar' },
      })

      const result = await googleLoginUser(buildGoogleProfile({ id: profile.id }))

      expect(result.user.email).toBe(profile.emails[0].value)
      expect(result.user.username).toBe(`google_${shortId}`)

      const count = await User.countDocuments({ googleId: profile.id })
      expect(count).toBe(1)
    })
  })

  describe('account linking (existing email user)', () => {
    it('should link googleId to an existing email/password user', async () => {
      await User.create({
        username: 'emailuser',
        email: 'googleuser@gmail.com',
        password: 'password123',
      })

      const profile = buildGoogleProfile({
        emails: [{ value: 'googleuser@gmail.com' }],
      })
      const result = await googleLoginUser(profile)

      expect(result.user.email).toBe('googleuser@gmail.com')
      expect(result.user.username).toBe('emailuser')

      const dbUser = await User.findOne({ email: 'googleuser@gmail.com' })
      expect(dbUser.googleId).toBe(profile.id)

      const count = await User.countDocuments({ email: 'googleuser@gmail.com' })
      expect(count).toBe(1)
    })
  })
})
