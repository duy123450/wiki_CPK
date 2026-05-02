/**
 * Tests for the googleLogin() API service function.
 * Follows the same mocked-axios pattern as the existing api.test.js.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock axios.create to return a mock instance
vi.mock('axios', () => {
    const mockInstance = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    }
    return {
        default: {
            create: vi.fn(() => mockInstance),
        },
    }
})

let api
let mockAxiosInstance

beforeEach(async () => {
    vi.resetModules()
    const axiosMod = await import('axios')
    mockAxiosInstance = axiosMod.default.create()
    const apiModule = await import('@/services/api')
    api = apiModule
})

afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
})

describe('googleLogin', () => {
    it('posts to /auth/google with the credential', async () => {
        const response = { user: { username: 'googleuser' }, token: 'google-jwt-token' }
        mockAxiosInstance.post.mockResolvedValueOnce({ data: response })

        const result = await api.googleLogin('google-credential-jwt')

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/google', {
            credential: 'google-credential-jwt',
        })
        expect(result).toEqual(response)
    })

    it('returns { user, token } on success', async () => {
        const response = {
            user: {
                id: '123',
                username: 'Google_User_1234',
                email: 'google@gmail.com',
                role: 'user',
                avatar: { url: 'https://photo.jpg', public_id: 'google-avatar' },
            },
            token: 'jwt-abc',
        }
        mockAxiosInstance.post.mockResolvedValueOnce({ data: response })

        const result = await api.googleLogin('valid-credential')

        expect(result.user.email).toBe('google@gmail.com')
        expect(result.token).toBe('jwt-abc')
    })

    it('throws on API error', async () => {
        mockAxiosInstance.post.mockRejectedValueOnce({
            response: { data: { msg: 'Google credential is required' } },
        })

        await expect(api.googleLogin('')).rejects.toEqual(
            expect.objectContaining({
                response: expect.objectContaining({
                    data: { msg: 'Google credential is required' },
                }),
            })
        )
    })
})
