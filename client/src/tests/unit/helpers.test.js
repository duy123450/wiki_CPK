/**
 * Unit tests for pure helper functions used across the client.
 *
 * These functions are duplicated from their source components for isolated testing
 * since they aren't exported. This mirrors the server-side helper testing approach.
 */
import { describe, it, expect } from 'vitest'

// ─── nameToSlug (from CharactersPage / CharacterPage) ────────────────────────
const nameToSlug = (name) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

describe('nameToSlug', () => {
    it('converts a simple name to lowercase slug', () => {
        expect(nameToSlug('Princess Kaguya')).toBe('princess-kaguya')
    })

    it('removes leading and trailing hyphens', () => {
        expect(nameToSlug('--Kaguya--')).toBe('kaguya')
    })

    it('replaces multiple special characters with a single hyphen', () => {
        expect(nameToSlug('Noi   Mikado!!!')).toBe('noi-mikado')
    })

    it('handles single word', () => {
        expect(nameToSlug('Roka')).toBe('roka')
    })

    it('handles empty string', () => {
        expect(nameToSlug('')).toBe('')
    })

    it('strips non-ASCII characters', () => {
        expect(nameToSlug('超かぐや姫')).toBe('')
    })

    it('handles mixed case and numbers', () => {
        expect(nameToSlug('Character 001')).toBe('character-001')
    })
})

// ─── fmtTime (from Playlist) ─────────────────────────────────────────────────
const fmtTime = (s) => {
    s = Math.max(0, Math.floor(s))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

describe('fmtTime', () => {
    it('formats 0 seconds', () => {
        expect(fmtTime(0)).toBe('0:00')
    })

    it('formats 59 seconds', () => {
        expect(fmtTime(59)).toBe('0:59')
    })

    it('formats exactly 1 minute', () => {
        expect(fmtTime(60)).toBe('1:00')
    })

    it('formats 3 minutes 45 seconds', () => {
        expect(fmtTime(225)).toBe('3:45')
    })

    it('floors fractional seconds', () => {
        expect(fmtTime(61.9)).toBe('1:01')
    })

    it('clamps negative values to 0', () => {
        expect(fmtTime(-5)).toBe('0:00')
    })

    it('handles large values', () => {
        expect(fmtTime(3661)).toBe('61:01')
    })
})

// ─── formatRuntime (from MovieOverviewPage) ──────────────────────────────────
function formatRuntime(minutes) {
    if (!minutes) return null
    const mins = parseInt(minutes, 10)
    if (isNaN(mins)) return minutes
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    if (hours === 0) return `${remainingMins}m`
    if (remainingMins === 0) return `${hours}h`
    return `${hours}h ${remainingMins}m`
}

describe('formatRuntime', () => {
    it('returns null for falsy input', () => {
        expect(formatRuntime(null)).toBeNull()
        expect(formatRuntime(0)).toBeNull()
        expect(formatRuntime('')).toBeNull()
    })

    it('formats minutes-only (< 60)', () => {
        expect(formatRuntime(45)).toBe('45m')
        expect(formatRuntime('30')).toBe('30m')
    })

    it('formats exact hours', () => {
        expect(formatRuntime(120)).toBe('2h')
    })

    it('formats hours and minutes', () => {
        expect(formatRuntime(95)).toBe('1h 35m')
    })

    it('returns original string for non-numeric input', () => {
        expect(formatRuntime('N/A')).toBe('N/A')
    })
})

// ─── getEffects / getAppearance (from CharacterPage) ─────────────────────────
const getEffects = (ability) => ability.effect ?? ability.effects ?? []
const getAppearance = (appearance) => {
    if (!appearance) return null
    return {
        realWorld: appearance.realWorld ?? appearance.real_world ?? null,
        tsukuyomi: appearance.tsukuyomi ?? appearance.tsukuyomi_avatar ?? null,
    }
}

describe('getEffects', () => {
    it('returns "effect" array when present', () => {
        expect(getEffects({ effect: ['dmg', 'stun'] })).toEqual(['dmg', 'stun'])
    })

    it('falls back to "effects" when "effect" is undefined', () => {
        expect(getEffects({ effects: ['heal'] })).toEqual(['heal'])
    })

    it('returns empty array when neither field exists', () => {
        expect(getEffects({})).toEqual([])
    })

    it('prefers "effect" over "effects"', () => {
        expect(getEffects({ effect: ['a'], effects: ['b'] })).toEqual(['a'])
    })
})

describe('getAppearance', () => {
    it('returns null for falsy input', () => {
        expect(getAppearance(null)).toBeNull()
        expect(getAppearance(undefined)).toBeNull()
    })

    it('maps realWorld and tsukuyomi fields', () => {
        const result = getAppearance({ realWorld: 'casual', tsukuyomi: 'armor' })
        expect(result).toEqual({ realWorld: 'casual', tsukuyomi: 'armor' })
    })

    it('maps snake_case fallback fields', () => {
        const result = getAppearance({ real_world: 'school uniform', tsukuyomi_avatar: 'moon knight' })
        expect(result).toEqual({ realWorld: 'school uniform', tsukuyomi: 'moon knight' })
    })

    it('prefers camelCase over snake_case', () => {
        const result = getAppearance({
            realWorld: 'camel',
            real_world: 'snake',
            tsukuyomi: 'camelT',
            tsukuyomi_avatar: 'snakeT',
        })
        expect(result).toEqual({ realWorld: 'camel', tsukuyomi: 'camelT' })
    })

    it('returns null for missing fields', () => {
        const result = getAppearance({})
        expect(result).toEqual({ realWorld: null, tsukuyomi: null })
    })
})

// ─── getCookie / setCookie (from Sidebar) ────────────────────────────────────
function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split('; ') : []
    const target = cookies.find((entry) => entry.startsWith(`${name}=`))
    return target ? decodeURIComponent(target.split('=').slice(1).join('=')) : null
}

function setCookie(name, value, maxAgeSeconds = 60 * 60 * 24 * 30) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`
}

describe('getCookie / setCookie', () => {
    afterEach(() => {
        // Clear cookies
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.trim().split('=')[0] + '=; max-age=0'
        })
    })

    it('returns null when no cookie exists', () => {
        expect(getCookie('nonexistent')).toBeNull()
    })

    it('sets and gets a cookie', () => {
        setCookie('testKey', 'testValue')
        expect(getCookie('testKey')).toBe('testValue')
    })

    it('handles special characters via encoding', () => {
        setCookie('key', 'hello world!')
        expect(getCookie('key')).toBe('hello world!')
    })

    it('returns null for empty cookie string', () => {
        // jsdom starts with empty cookies
        document.cookie = ''
        expect(getCookie('anything')).toBeNull()
    })
})
