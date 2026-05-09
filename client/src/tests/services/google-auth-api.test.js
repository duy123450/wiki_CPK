import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('axios', () => {
    const mockInstance = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        request: vi.fn(),
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

beforeEach(async () => {
    vi.resetModules()
    const apiModule = await import('@/services/api')
    api = apiModule
})

afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
})

describe('getGoogleLoginUrl', () => {
    it('returns the backend Google OAuth URL', () => {
        expect(api.getGoogleLoginUrl()).toBe(`${api.API_BASE_URL}/auth/google`)
    })
})
