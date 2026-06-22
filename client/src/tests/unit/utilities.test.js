/**
 * Unit tests for client-side utility modules.
 * These tests import directly from the source files to ensure
 * the exported API is correct and stable.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// ─── api-validator.js ─────────────────────────────────────────────────────────
import { validateData, withValidation } from '../../utils/api-validator';

describe('validateData', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().int().positive(),
  });

  it('returns parsed data when valid', () => {
    const result = validateData(schema, { name: 'Kaguya', age: 17 });
    expect(result).toEqual({ name: 'Kaguya', age: 17 });
  });

  it('throws a descriptive error when validation fails', () => {
    expect(() =>
      validateData(schema, { name: 123, age: -1 }, 'Character')
    ).toThrow(/Invalid Character/);
  });

  it('throws with field-level error messages', () => {
    expect(() =>
      validateData(schema, { name: 'OK', age: 'not a number' }, 'Payload')
    ).toThrow(/age/);
  });

  it('uses default label "Data" when none is provided', () => {
    expect(() => validateData(schema, {})).toThrow(/Invalid Data/);
  });
});

describe('withValidation', () => {
  const schema = z.object({ id: z.string() });

  it('returns validated data from a resolved async function', async () => {
    const fn = vi.fn().mockResolvedValue({ id: 'abc-123' });
    const validated = withValidation(schema, fn, 'Response');
    const result = await validated('someArg');
    expect(result).toEqual({ id: 'abc-123' });
    expect(fn).toHaveBeenCalledWith('someArg');
  });

  it('throws when the async function resolves with invalid data', async () => {
    const fn = vi.fn().mockResolvedValue({ id: 42 }); // id should be string
    const validated = withValidation(schema, fn, 'Response');
    await expect(validated()).rejects.toThrow(/Invalid Response/);
  });

  it('propagates rejection from the async function', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Network error'));
    const validated = withValidation(schema, fn, 'Response');
    await expect(validated()).rejects.toThrow('Network error');
  });
});

// ─── slugify.js ───────────────────────────────────────────────────────────────
import { nameToSlug } from '../../utils/slugify';

describe('nameToSlug', () => {
  it('lowercases and hyphenates a normal name', () => {
    expect(nameToSlug('Princess Kaguya')).toBe('princess-kaguya');
  });

  it('collapses multiple spaces/specials into one hyphen', () => {
    expect(nameToSlug('Noi   Mikado!!!')).toBe('noi-mikado');
  });

  it('strips leading and trailing hyphens', () => {
    expect(nameToSlug('--Kaguya--')).toBe('kaguya');
  });

  it('handles numeric characters', () => {
    expect(nameToSlug('Character 001')).toBe('character-001');
  });

  it('strips non-ASCII characters', () => {
    expect(nameToSlug('超かぐや姫')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(nameToSlug('')).toBe('');
  });
});

// ─── dateUtils.js ─────────────────────────────────────────────────────────────
import { formatVNDate } from '../../utils/dateUtils';

describe('formatVNDate', () => {
  it('returns "—" for null', () => {
    expect(formatVNDate(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(formatVNDate(undefined)).toBe('—');
  });

  it('returns "—" for empty string', () => {
    expect(formatVNDate('')).toBe('—');
  });

  it('formats a valid ISO date string as Vietnamese locale', () => {
    const result = formatVNDate('2024-01-15');
    // Result is locale-dependent but should contain the year 2024
    expect(result).toContain('2024');
  });

  it('formats a Date object correctly', () => {
    const date = new Date('2023-06-01');
    const result = formatVNDate(date);
    expect(result).toContain('2023');
  });
});

// ─── characterUtils.js ────────────────────────────────────────────────────────
import { getAppearance, getEffects } from '../../utils/characterUtils';

describe('getAppearance', () => {
  it('returns null for null input', () => {
    expect(getAppearance(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(getAppearance(undefined)).toBeNull();
  });

  it('maps camelCase fields', () => {
    expect(getAppearance({ realWorld: 'casual', tsukuyomi: 'armor' }))
      .toEqual({ realWorld: 'casual', tsukuyomi: 'armor' });
  });

  it('maps snake_case fallback fields', () => {
    expect(getAppearance({ real_world: 'school', tsukuyomi_avatar: 'knight' }))
      .toEqual({ realWorld: 'school', tsukuyomi: 'knight' });
  });

  it('prefers camelCase over snake_case', () => {
    expect(getAppearance({ realWorld: 'camel', real_world: 'snake', tsukuyomi: 'ct', tsukuyomi_avatar: 'st' }))
      .toEqual({ realWorld: 'camel', tsukuyomi: 'ct' });
  });

  it('returns null fields for empty object', () => {
    expect(getAppearance({})).toEqual({ realWorld: null, tsukuyomi: null });
  });
});

describe('getEffects', () => {
  it('returns the "effect" array when present', () => {
    expect(getEffects({ effect: ['dmg', 'stun'] })).toEqual(['dmg', 'stun']);
  });

  it('falls back to "effects" when "effect" is absent', () => {
    expect(getEffects({ effects: ['heal'] })).toEqual(['heal']);
  });

  it('returns empty array when neither field exists', () => {
    expect(getEffects({})).toEqual([]);
  });

  it('prefers "effect" over "effects"', () => {
    expect(getEffects({ effect: ['a'], effects: ['b'] })).toEqual(['a']);
  });
});

// ─── uiUtils.js ───────────────────────────────────────────────────────────────
import { generateParticles, generateStars } from '../../utils/uiUtils';

describe('generateParticles', () => {
  it('returns the correct number of items', () => {
    expect(generateParticles(10)).toHaveLength(10);
    expect(generateParticles(0)).toHaveLength(0);
  });

  it('each particle has required shape', () => {
    const particles = generateParticles(3);
    particles.forEach((p, i) => {
      expect(p).toHaveProperty('id', i);
      expect(p).toHaveProperty('left');
      expect(p).toHaveProperty('top');
      expect(p).toHaveProperty('size');
      expect(p).toHaveProperty('delay');
      expect(p).toHaveProperty('dur');
    });
  });

  it('left and top values are percentage strings', () => {
    const [p] = generateParticles(1);
    expect(p.left).toMatch(/%$/);
    expect(p.top).toMatch(/%$/);
  });

  it('size is within valid range (0.8–3.3)', () => {
    // Run many times to catch randomness
    for (let i = 0; i < 50; i++) {
      const [p] = generateParticles(1);
      expect(p.size).toBeGreaterThanOrEqual(0.8);
      expect(p.size).toBeLessThanOrEqual(3.3);
    }
  });
});

describe('generateStars', () => {
  it('returns the correct number of items', () => {
    expect(generateStars(5)).toHaveLength(5);
    expect(generateStars(0)).toHaveLength(0);
  });

  it('each star has required shape', () => {
    const stars = generateStars(2);
    stars.forEach((s, i) => {
      expect(s).toHaveProperty('id', i);
      expect(s).toHaveProperty('left');
      expect(s).toHaveProperty('top');
      expect(s).toHaveProperty('size');
      expect(s).toHaveProperty('delay');
      expect(s).toHaveProperty('dur');
    });
  });

  it('size is within valid range (0.5–3.0)', () => {
    for (let i = 0; i < 50; i++) {
      const [s] = generateStars(1);
      expect(s.size).toBeGreaterThanOrEqual(0.5);
      expect(s.size).toBeLessThanOrEqual(3.0);
    }
  });
});

// ─── youtubeUtils.js ──────────────────────────────────────────────────────────
import { getYoutubeId } from '../../utils/youtubeUtils';

describe('getYoutubeId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(getYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from short youtu.be URL', () => {
    expect(getYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from embed URL', () => {
    expect(getYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from URL with extra query params', () => {
    expect(getYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for null input', () => {
    expect(getYoutubeId(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getYoutubeId('')).toBeNull();
  });

  it('returns null for a non-YouTube URL', () => {
    expect(getYoutubeId('https://vimeo.com/12345')).toBeNull();
  });

  it('returns null if video ID is not 11 characters', () => {
    expect(getYoutubeId('https://www.youtube.com/watch?v=short')).toBeNull();
  });
});
