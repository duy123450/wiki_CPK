const User = require('../../modules/auth/user.model')
const { buildDiscordProfile } = require('../utils/authTestHelpers')

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest'
process.env.JWT_ACCESS_LIFETIME = '15m'
process.env.JWT_REFRESH_LIFETIME = '30d'
process.env.NODE_ENV = 'test'

const { discordLoginUser } = require('../../modules/auth/auth.service')

describe('discordLoginUser()', () => {
  describe('input validation', () => {
    it('should throw 400 when profile is missing', async () => {
      await expect(discordLoginUser(undefined)).rejects.toThrow(
        'Discord profile is required'
      )
    })

    it('should throw 400 when profile id is missing', async () => {
      await expect(discordLoginUser({})).rejects.toThrow(
        'Discord profile is required'
      )
    })
  })

  describe('new user (no existing account)', () => {
    it('should create a new user and return auth tokens', async () => {
      const result = await discordLoginUser(buildDiscordProfile())

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result.user.email).toBeDefined()
      expect(result.user.username).toMatch(/_/)
    })

    it('should handle profiles without email by creating a local fallback', async () => {
      const profileNoEmail = buildDiscordProfile({ email: undefined })
      const result = await discordLoginUser(profileNoEmail)

      expect(result.user.email).toContain('@discord.local')
    })

    it('should set avatar from Discord CDN URL', async () => {
      const result = await discordLoginUser(buildDiscordProfile())
      expect(result.user.avatar.url).toContain(
        'https://cdn.discordapp.com/avatars/'
      )
    })
  })

  describe('existing Discord user', () => {
    it('should return the existing user without duplicate', async () => {
      await User.create({
        username: 'old_discord_user',
        email: 'discorduser@example.com',
        discordId: 'discord-uid-123456',
      })

      const result = await discordLoginUser(
        buildDiscordProfile({ id: 'discord-uid-123456' })
      )
      expect(result.user.username).toBe('old_discord_user')

      const count = await User.countDocuments({
        discordId: 'discord-uid-123456',
      })
      expect(count).toBe(1)
    })
  })

  describe('account linking (existing email user)', () => {
    it('should link to existing account if email matches', async () => {
      await User.create({
        username: 'local_user',
        email: 'discorduser@example.com',
        password: 'password123',
      })

      const result = await discordLoginUser(buildDiscordProfile({ email: 'discorduser@example.com' }))
      expect(result.user.username).toBe('local_user')

      const dbUser = await User.findOne({ email: 'discorduser@example.com' })
      expect(dbUser.discordId).toBeDefined()
    })
  })
})
