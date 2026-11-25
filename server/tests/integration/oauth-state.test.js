const request = require('supertest')
const nock = require('nock')

process.env.NODE_ENV = 'test'
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest'
process.env.JWT_ACCESS_LIFETIME = '15m'
process.env.JWT_REFRESH_LIFETIME = '30d'
process.env.FRONTEND_URL = 'http://localhost:5173'

process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/v1/wiki/auth/google/callback'
process.env.DISCORD_CLIENT_ID = 'test-discord-client-id'
process.env.DISCORD_CLIENT_SECRET = 'test-discord-client-secret'
process.env.DISCORD_LOCAL_CALLBACK_URL =
  'http://localhost:3000/api/v1/wiki/auth/discord/callback'
process.env.GITHUB_LOCAL_CLIENT_ID = 'test-github-client-id'
process.env.GITHUB_LOCAL_CLIENT_SECRET = 'test-github-client-secret'
process.env.GITHUB_LOCAL_CALLBACK_URL =
  'http://localhost:3000/api/v1/wiki/auth/github/callback'

const app = require('../../server')

const providers = [
  {
    name: 'Google',
    initiationPath: '/api/v1/wiki/auth/google',
    callbackPath: '/api/v1/wiki/auth/google/callback',
    authorizationHost: 'https://accounts.google.com',
    tokenHost: 'https://www.googleapis.com',
    tokenPath: '/oauth2/v4/token',
    profileHost: 'https://www.googleapis.com',
    profileEndpoints: [
      {
        path: '/oauth2/v3/userinfo',
        body: {
          sub: 'google-oauth-state-user',
          name: 'Google State User',
          email: 'google-state@example.com',
          email_verified: true,
        },
      },
    ],
    errorParam: 'googleError',
  },
  {
    name: 'Discord',
    initiationPath: '/api/v1/wiki/auth/discord',
    callbackPath: '/api/v1/wiki/auth/discord/callback',
    authorizationHost: 'https://discord.com',
    tokenHost: 'https://discord.com',
    tokenPath: '/api/oauth2/token',
    profileHost: 'https://discord.com',
    profileEndpoints: [
      {
        path: '/api/users/@me',
        body: {
          id: 'discord-oauth-state-user',
          username: 'discord_state_user',
          email: 'discord-state@example.com',
          verified: true,
        },
      },
    ],
    errorParam: 'discordError',
  },
  {
    name: 'GitHub',
    initiationPath: '/api/v1/wiki/auth/github',
    callbackPath: '/api/v1/wiki/auth/github/callback',
    authorizationHost: 'https://github.com',
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    profileHost: 'https://api.github.com',
    profileEndpoints: [
      {
        path: '/user',
        body: {
          id: 987654321,
          login: 'github_state_user',
          name: 'GitHub State User',
        },
      },
      {
        path: '/user/emails',
        body: [
          {
            email: 'github-state@example.com',
            primary: true,
            verified: true,
            visibility: 'public',
          },
        ],
      },
    ],
    errorParam: 'githubError',
  },
]

const mockProviderRequests = (provider) => {
  const token = nock(provider.tokenHost)
    .post(provider.tokenPath)
    .reply(200, { access_token: 'test-provider-access-token', token_type: 'Bearer' })
  const profiles = provider.profileEndpoints.map(({ path, body }) =>
    nock(provider.profileHost).get(path).query(true).reply(200, body)
  )

  return { token, profiles }
}

const beginLogin = async (provider, expectState = true) => {
  const agent = request.agent(app)
  const response = await agent.get(provider.initiationPath)

  expect(response.status).toBe(302)
  expect(response.headers.location).toContain(provider.authorizationHost)

  const state = new URL(response.headers.location).searchParams.get('state')
  if (expectState) {
    expect(response.headers['set-cookie']?.join(';')).toContain('connect.sid=')
    expect(state).toBeTruthy()
  }
  return { agent, state }
}

const expectRejectedBeforeExchange = async (provider, agent, state) => {
  const mocks = mockProviderRequests(provider)
  const callback = agent
    ? agent.get(provider.callbackPath).query({ code: 'test-authorization-code' })
    : request(app).get(provider.callbackPath).query({ code: 'test-authorization-code' })

  if (state !== undefined) callback.query({ state })
  const response = await callback

  expect(response.status).toBe(302)
  expect(response.headers.location).toContain(provider.errorParam)
  expect(mocks.token.isDone()).toBe(false)
  expect(mocks.profiles.every((profile) => !profile.isDone())).toBe(true)
}

beforeAll(() => {
  nock.disableNetConnect()
  nock.enableNetConnect(/127\.0\.0\.1|localhost/)
})

afterEach(() => {
  nock.cleanAll()
})

afterAll(() => {
  nock.enableNetConnect()
})

describe.each(providers)('$name OAuth state validation', (provider) => {
  it('accepts valid state from the initiating session', async () => {
    const { agent, state } = await beginLogin(provider)
    const mocks = mockProviderRequests(provider)

    const response = await agent
      .get(provider.callbackPath)
      .query({ code: 'test-authorization-code', state })

    expect(response.status).toBe(302)
    expect(response.headers.location).toContain('oauth=success')
    expect(mocks.token.isDone()).toBe(true)
    expect(mocks.profiles.every((profile) => profile.isDone())).toBe(true)
  })

  it('rejects a callback with missing state before exchanging its code', async () => {
    const { agent } = await beginLogin(provider, false)

    await expectRejectedBeforeExchange(provider, agent)
  })

  it('rejects a callback with mismatched state before exchanging its code', async () => {
    const { agent } = await beginLogin(provider, false)

    await expectRejectedBeforeExchange(provider, agent, 'not-the-issued-state')
  })

  it('rejects replayed state before exchanging the code again', async () => {
    const { agent, state } = await beginLogin(provider)
    const firstExchange = mockProviderRequests(provider)

    const firstResponse = await agent
      .get(provider.callbackPath)
      .query({ code: 'first-authorization-code', state })

    expect(firstResponse.status).toBe(302)
    expect(firstResponse.headers.location).toContain('oauth=success')
    expect(firstExchange.token.isDone()).toBe(true)
    expect(firstExchange.profiles.every((profile) => profile.isDone())).toBe(true)

    await expectRejectedBeforeExchange(provider, agent, state)
  })

  it('rejects a callback without the initiating session before exchanging its code', async () => {
    const { state } = await beginLogin(provider, false)

    await expectRejectedBeforeExchange(provider, null, state)
  })
})
