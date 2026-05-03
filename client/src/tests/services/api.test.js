/**
 * Tests for the API service layer (src/services/api.js).
 *
 * We mock axios to verify that each function calls the correct endpoint
 * with the correct parameters and returns the expected data shape.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

// Mock axios.create to return a mock instance
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

// We need to get the mock instance AFTER the mock is set up
let api
let mockAxiosInstance

beforeEach(async () => {
    vi.resetModules()
    // Re-import to get fresh module
    const axiosMod = await import('axios')
    mockAxiosInstance = axiosMod.default.create()
    const apiModule = await import('@/services/api')
    api = apiModule
})

afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
})

describe('AUTH_TOKEN_KEY', () => {
    it('has a default value', () => {
        expect(api.AUTH_TOKEN_KEY).toBeDefined()
        expect(typeof api.AUTH_TOKEN_KEY).toBe('string')
    })
})

describe('axios instance', () => {
    it('uses the Render backend URL and sends credentials', async () => {
        expect(axios.create).toHaveBeenLastCalledWith({
            baseURL: 'https://wiki-cpk-be.onrender.com/api/v1/wiki',
            withCredentials: true,
        })
    })
})

describe('request interceptor', () => {
    it('attaches the access token from localStorage', async () => {
        window.localStorage.setItem(api.AUTH_TOKEN_KEY, 'access-token')
        const requestHandler = mockAxiosInstance.interceptors.request.use.mock.calls[0][0]

        const config = requestHandler({ headers: {} })

        expect(config.headers.Authorization).toBe('Bearer access-token')
    })
})

describe('response interceptor', () => {
    it('refreshes on 401, saves the new access token, and retries the original request', async () => {
        const responseErrorHandler = mockAxiosInstance.interceptors.response.use.mock.calls[0][1]
        const originalRequest = { url: '/auth/me', headers: {} }

        mockAxiosInstance.post.mockResolvedValueOnce({
            data: { accessToken: 'fresh-access-token' },
        })
        mockAxiosInstance.request.mockResolvedValueOnce({ data: { ok: true } })

        const result = await responseErrorHandler({
            config: originalRequest,
            response: { status: 401 },
        })

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', undefined, {
            _skipAuthRefresh: true,
        })
        expect(window.localStorage.getItem(api.AUTH_TOKEN_KEY)).toBe('fresh-access-token')
        expect(originalRequest.headers.Authorization).toBe('Bearer fresh-access-token')
        expect(mockAxiosInstance.request).toHaveBeenCalledWith(originalRequest)
        expect(result).toEqual({ data: { ok: true } })
    })
})

describe('getMovieInfo', () => {
    it('calls /movie-info and returns the movie object', async () => {
        const movie = { _id: '1', title: 'Test Movie' }
        mockAxiosInstance.get.mockResolvedValueOnce({ data: { movie } })
        const result = await api.getMovieInfo()
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/movie-info')
        expect(result).toEqual(movie)
    })
})

describe('getSidebar', () => {
    it('calls /sidebar and returns categories', async () => {
        const categories = [{ _id: '1', name: 'Characters' }]
        mockAxiosInstance.get.mockResolvedValueOnce({ data: { categories } })
        const result = await api.getSidebar()
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/sidebar')
        expect(result).toEqual(categories)
    })
})

describe('getPageBySlug', () => {
    it('calls /page/:slug and returns data', async () => {
        const pageData = { page: { title: 'Test' } }
        mockAxiosInstance.get.mockResolvedValueOnce({ data: pageData })
        const result = await api.getPageBySlug('test-slug')
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/page/test-slug')
        expect(result).toEqual(pageData)
    })
})

describe('getCharacters', () => {
    it('calls /characters with params', async () => {
        const data = { characters: [], pagination: {} }
        mockAxiosInstance.get.mockResolvedValueOnce({ data })
        const params = { page: 1, limit: 12, role: 'Protagonist' }
        const result = await api.getCharacters(params)
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/characters', { params })
        expect(result).toEqual(data)
    })
})

describe('getCharacterBySlug', () => {
    it('calls /characters/:slug and returns character', async () => {
        const character = { name: 'Kaguya' }
        mockAxiosInstance.get.mockResolvedValueOnce({ data: { character } })
        const result = await api.getCharacterBySlug('kaguya')
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/characters/kaguya')
        expect(result).toEqual(character)
    })
})

describe('registerUser', () => {
    it('posts to /auth/register', async () => {
        const payload = { username: 'test', email: 'test@test.com', password: '123456' }
        const response = { user: { username: 'test' }, token: 'abc' }
        mockAxiosInstance.post.mockResolvedValueOnce({ data: response })
        const result = await api.registerUser(payload)
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', payload)
        expect(result).toEqual(response)
    })
})

describe('loginUser', () => {
    it('posts to /auth/login', async () => {
        const payload = { identifier: 'test', password: '123456' }
        const response = { user: { username: 'test' }, token: 'abc' }
        mockAxiosInstance.post.mockResolvedValueOnce({ data: response })
        const result = await api.loginUser(payload)
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', payload)
        expect(result).toEqual(response)
    })
})

describe('getCurrentUser', () => {
    it('calls /auth/me and returns user', async () => {
        const user = { username: 'test', email: 'test@test.com' }
        mockAxiosInstance.get.mockResolvedValueOnce({ data: { user } })
        const result = await api.getCurrentUser()
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/me')
        expect(result).toEqual(user)
    })
})

describe('refreshAccessToken', () => {
    it('posts to /auth/refresh and stores the returned access token', async () => {
        const response = { accessToken: 'new-access-token' }
        mockAxiosInstance.post.mockResolvedValueOnce({ data: response })

        const result = await api.refreshAccessToken()

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', undefined, {
            _skipAuthRefresh: true,
        })
        expect(window.localStorage.getItem(api.AUTH_TOKEN_KEY)).toBe('new-access-token')
        expect(result).toEqual(response)
    })
})

describe('uploadAvatar', () => {
    it('puts to /auth/avatar with FormData', async () => {
        const file = new File(['img'], 'avatar.png', { type: 'image/png' })
        const response = { avatar: { url: 'http://img.com/a.png', public_id: 'x' } }
        mockAxiosInstance.put.mockResolvedValueOnce({ data: response })
        const result = await api.uploadAvatar(file)
        expect(mockAxiosInstance.put).toHaveBeenCalledWith(
            '/auth/avatar',
            expect.any(FormData),
            { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        expect(result).toEqual(response)
    })
})

describe('updateProfile', () => {
    it('puts to /auth/profile', async () => {
        const payload = { username: 'newname' }
        const response = { user: { username: 'newname' }, token: 'new-token' }
        mockAxiosInstance.put.mockResolvedValueOnce({ data: response })
        const result = await api.updateProfile(payload)
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/profile', payload)
        expect(result).toEqual(response)
    })
})

describe('fetchSoundtracks', () => {
    it('calls /soundtrack with movieId param', async () => {
        const data = { tracks: [] }
        mockAxiosInstance.get.mockResolvedValueOnce({ data })
        const result = await api.fetchSoundtracks('movie123')
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/soundtrack', { params: { movieId: 'movie123' } })
        expect(result).toEqual(data)
    })
})

describe('fetchNextTrack', () => {
    it('calls /soundtrack/next with params', async () => {
        const data = { track: { _id: 't1' } }
        mockAxiosInstance.get.mockResolvedValueOnce({ data })
        const result = await api.fetchNextTrack({
            currentTrackId: 't1',
            mode: 'sequential',
            movieId: 'm1',
        })
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/soundtrack/next', {
            params: { currentTrackId: 't1', mode: 'sequential', movieId: 'm1' },
        })
        expect(result).toEqual(data)
    })

    it('adds cache buster for shuffle mode', async () => {
        const data = { track: { _id: 't2' } }
        mockAxiosInstance.get.mockResolvedValueOnce({ data })
        await api.fetchNextTrack({
            currentTrackId: 't1',
            mode: 'shuffle',
            movieId: 'm1',
        })
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/soundtrack/next', {
            params: expect.objectContaining({
                currentTrackId: 't1',
                mode: 'shuffle',
                movieId: 'm1',
                _t: expect.any(Number),
            }),
        })
    })
})

describe('fetchMovieInfo', () => {
    it('calls /movie-info and returns full data', async () => {
        const data = { movie: { _id: '1', title: 'Test' } }
        mockAxiosInstance.get.mockResolvedValueOnce({ data })
        const result = await api.fetchMovieInfo()
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/movie-info')
        expect(result).toEqual(data)
    })
})
