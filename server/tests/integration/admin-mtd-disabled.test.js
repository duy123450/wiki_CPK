const request = require('supertest')

process.env.NODE_ENV = 'test'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest'
delete process.env.ADMIN_SECRET_PEPPER

const { MTD_ENABLED } = require('../../modules/adminPerimeter/adminPerimeter')

let app

beforeAll(() => {
  app = require('../../server')
})

describe('Admin API with MTD disabled', () => {
  it('requires authentication when no pepper is configured', async () => {
    expect(MTD_ENABLED).toBe(false)

    const res = await request(app)
      .post('/api/v1/admin/soundtrack/cache/clear')

    expect(res.status).toBe(401)
  })
})
