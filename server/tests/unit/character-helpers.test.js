/**
 * Unit tests for character service helper functions.
 *
 * Tests pure logic: sortByCanonicalOrder, nameToSlug, formatCharacter
 * These helpers are defined in ../utils/characterTestHelpers.js
 */

const {
  sortByCanonicalOrder,
  nameToSlug,
  formatCharacter,
} = require('../utils/characterTestHelpers')

describe('Character Helpers', () => {
  // ── sortByCanonicalOrder ──────────────────────────────────────────────────
  describe('sortByCanonicalOrder()', () => {
    it('should sort characters by the canonical order', () => {
      const input = [
        { name: 'Fushi' },
        { name: 'Kaguya' },
        { name: 'Sakayori Iroha' },
      ]
      const sorted = sortByCanonicalOrder(input)
      expect(sorted.map((c) => c.name)).toEqual([
        'Sakayori Iroha',
        'Kaguya',
        'Fushi',
      ])
    })

    it('should put unknown characters after known ones', () => {
      const input = [
        { name: 'Unknown Hero' },
        { name: 'Kaguya' },
        { name: 'Another Unknown' },
      ]
      const sorted = sortByCanonicalOrder(input)
      expect(sorted[0].name).toBe('Kaguya')
      // Unknowns sorted alphabetically after known
      expect(sorted[1].name).toBe('Another Unknown')
      expect(sorted[2].name).toBe('Unknown Hero')
    })

    it('should be case-insensitive', () => {
      const input = [{ name: 'KAGUYA' }, { name: 'sakayori iroha' }]
      const sorted = sortByCanonicalOrder(input)
      expect(sorted[0].name).toBe('sakayori iroha')
      expect(sorted[1].name).toBe('KAGUYA')
    })

    it('should not mutate the original array', () => {
      const input = [{ name: 'Fushi' }, { name: 'Kaguya' }]
      const original = [...input]
      sortByCanonicalOrder(input)
      expect(input).toEqual(original)
    })

    it('should handle an empty array', () => {
      expect(sortByCanonicalOrder([])).toEqual([])
    })
  })

  // ── nameToSlug ────────────────────────────────────────────────────────────
  describe('nameToSlug()', () => {
    it('should convert a name to lowercase slug', () => {
      expect(nameToSlug('Sakayori Iroha')).toBe('sakayori-iroha')
    })

    it('should replace multiple spaces with a single hyphen', () => {
      expect(nameToSlug('Komazawa   Rai')).toBe('komazawa-rai')
    })

    it('should strip special characters', () => {
      expect(nameToSlug('Hello! @World#')).toBe('hello-world')
    })

    it('should remove leading and trailing hyphens', () => {
      expect(nameToSlug('--test--')).toBe('test')
    })

    it('should handle already-slugified input', () => {
      expect(nameToSlug('kaguya')).toBe('kaguya')
    })
  })

  // ── formatCharacter ───────────────────────────────────────────────────────
  describe('formatCharacter()', () => {
    it('should map all fields correctly', () => {
      const input = {
        _id: '123',
        name: 'Kaguya',
        slug: 'kaguya',
        role: 'Protagonist',
        description: { summary: 'A princess' },
        origin: { location: 'Moon' },
        abilities: [{ skillName: 'Light', type: 'Active', effect: ['Heal'] }],
        relationships: [
          { targetId: '456', relationType: 'friend', description: 'close' },
        ],
        image: [{ url: 'http://img.png', public_id: 'img1' }],
        voiceActor: 'Actor Name',
        movie: 'movie123',
      }

      const result = formatCharacter(input)

      expect(result._id).toBe('123')
      expect(result.name).toBe('Kaguya')
      expect(result.slug).toBe('kaguya')
      expect(result.role).toBe('Protagonist')
      expect(result.description).toEqual({ summary: 'A princess' })
      expect(result.origin).toEqual({ location: 'Moon' })
      expect(result.abilities).toHaveLength(1)
      expect(result.relationships).toHaveLength(1)
      expect(result.relationships[0].targetId).toBe('456')
      expect(result.image).toHaveLength(1)
      expect(result.voiceActor).toBe('Actor Name')
      expect(result.movie).toBe('movie123')
    })

    it('should generate slug from name if slug is missing', () => {
      const input = {
        _id: '1',
        name: 'Sakayori Iroha',
        role: 'Protagonist',
        movie: 'm1',
      }
      const result = formatCharacter(input)
      expect(result.slug).toBe('sakayori-iroha')
    })

    it('should default missing fields to null or empty arrays', () => {
      const input = { _id: '1', name: 'Test', role: 'Supporting', movie: 'm1' }
      const result = formatCharacter(input)

      expect(result.description).toBeNull()
      expect(result.origin).toBeNull()
      expect(result.abilities).toEqual([])
      expect(result.relationships).toEqual([])
      expect(result.image).toEqual([])
      expect(result.voiceActor).toBeNull()
    })

    it('should set targetId to null when missing from a relationship', () => {
      const input = {
        _id: '1',
        name: 'Test',
        role: 'Supporting',
        movie: 'm1',
        relationships: [{ relationType: 'rival', description: 'enemy' }],
      }
      const result = formatCharacter(input)
      expect(result.relationships[0].targetId).toBeNull()
    })
  })
})
