import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getTwitterLoginUrl, getGoogleLoginUrl, API_BASE_URL } from '@/services/api'

describe('OAuth URL generation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getTwitterLoginUrl()', () => {
        it('should return the Twitter OAuth endpoint URL', () => {
            const url = getTwitterLoginUrl()
            expect(url).toBe(`${API_BASE_URL}/auth/twitter`)
        })

        it('should be a valid URL string', () => {
            const url = getTwitterLoginUrl()
            expect(typeof url).toBe('string')
            expect(url.length).toBeGreaterThan(0)
        })

        it('should contain the auth path', () => {
            const url = getTwitterLoginUrl()
            expect(url).toContain('/auth/twitter')
        })

        it('should match the backend route structure', () => {
            const url = getTwitterLoginUrl()
            expect(url).toMatch(/\/api\/v1\/wiki\/auth\/twitter$/)
        })

        it('should be different from Google OAuth URL', () => {
            const twitterUrl = getTwitterLoginUrl()
            const googleUrl = getGoogleLoginUrl()
            expect(twitterUrl).not.toBe(googleUrl)
            expect(twitterUrl).toContain('twitter')
            expect(googleUrl).toContain('google')
        })
    })

    describe('getGoogleLoginUrl()', () => {
        it('should return the Google OAuth endpoint URL', () => {
            const url = getGoogleLoginUrl()
            expect(url).toBe(`${API_BASE_URL}/auth/google`)
        })

        it('should contain the auth path', () => {
            const url = getGoogleLoginUrl()
            expect(url).toContain('/auth/google')
        })
    })
})
