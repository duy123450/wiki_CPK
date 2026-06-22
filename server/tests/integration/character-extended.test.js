const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Movie = require('../../modules/wiki/models/movie.model');
const Character = require('../../modules/characters/character.model');

const BASE = '/api/v1/wiki/characters';

const seedMovie = (ov = {}) =>
  Movie.create({
    title: 'Extended Test Movie',
    synopsis: 'Test synopsis.',
    slug: 'extended-test-movie',
    ...ov,
  });

const seedChar = (movieId, ov = {}) =>
  Character.create({
    name: 'Kaguya',
    role: 'Protagonist',
    description: { summary: 'Moon princess' },
    movie: movieId,
    ...ov,
  });

describe('Character Extended Tests', () => {
  let movie;

  beforeEach(async () => {
    await Character.deleteMany({});
    await Movie.deleteMany({});
    movie = await seedMovie();
  });

  // ─── Canonical Sort ───────────────────────────────────────────────────────────

  describe('Canonical Sort Order', () => {
    it('should return Sakayori Iroha before Kaguya in canonical order', async () => {
      await seedChar(movie._id, { name: 'Fushi', slug: 'fushi-ext' });
      await seedChar(movie._id, { name: 'Sakayori Iroha', slug: 'sakayori-iroha-ext' });
      await seedChar(movie._id, { name: 'Kaguya', slug: 'kaguya-ext' });

      const res = await request(app).get(BASE);
      expect(res.status).toBe(200);
      const names = res.body.characters.map((c) => c.name);
      expect(names.indexOf('Sakayori Iroha')).toBeLessThan(names.indexOf('Kaguya'));
      expect(names.indexOf('Kaguya')).toBeLessThan(names.indexOf('Fushi'));
    });

    it('should put unknown characters at the end alphabetically', async () => {
      await seedChar(movie._id, { name: 'Zara Unknown', slug: 'zara-unknown' });
      await seedChar(movie._id, { name: 'Alpha Unknown', slug: 'alpha-unknown' });
      await seedChar(movie._id, { name: 'Kaguya', slug: 'kaguya-sort-ext' });

      const res = await request(app).get(BASE);
      expect(res.status).toBe(200);
      const names = res.body.characters.map((c) => c.name);
      // Kaguya (canonical position 1) should come first
      expect(names[0]).toBe('Kaguya');
      // Unknown ones come after, in alphabetical order
      const unknownNames = names.slice(1);
      expect(unknownNames.indexOf('Alpha Unknown')).toBeLessThan(unknownNames.indexOf('Zara Unknown'));
    });
  });

  // ─── Search / Filtering ───────────────────────────────────────────────────────

  describe('Search and Filtering', () => {
    it('should search characters by name (case-insensitive)', async () => {
      await seedChar(movie._id, { name: 'Sakayori Iroha', slug: 'sakayori-search' });
      await seedChar(movie._id, { name: 'Kaguya Hime', slug: 'kaguya-search' });

      const res = await request(app).get(`${BASE}?search=kaguya`);
      expect(res.status).toBe(200);
      expect(res.body.characters.every((c) => c.name.toLowerCase().includes('kaguya'))).toBe(true);
    });

    it('should filter by movieId', async () => {
      const movie2 = await Movie.create({ title: 'Another Movie', synopsis: 'Synopsis', slug: 'another-movie' });
      await seedChar(movie._id, { name: 'Movie1 Char', slug: 'movie1-char' });
      await seedChar(movie2._id, { name: 'Movie2 Char', slug: 'movie2-char' });

      const res = await request(app).get(`${BASE}?movieId=${movie._id}`);
      expect(res.status).toBe(200);
      expect(res.body.characters).toHaveLength(1);
      expect(res.body.characters[0].name).toBe('Movie1 Char');
    });

    it('should return empty for non-matching search', async () => {
      await seedChar(movie._id, { name: 'Kaguya', slug: 'kaguya-nosearch' });
      const res = await request(app).get(`${BASE}?search=zzznomatch`);
      expect(res.status).toBe(200);
      expect(res.body.characters).toHaveLength(0);
    });
  });

  // ─── Relationships ────────────────────────────────────────────────────────────

  describe('Character Relationships', () => {
    it('should create a character with a self-referential relationship', async () => {
      const char1 = await seedChar(movie._id, { name: 'Char One', slug: 'char-one' });
      const char2 = await Character.create({
        name: 'Char Two',
        slug: 'char-two',
        role: 'Supporting',
        movie: movie._id,
        relationships: [
          {
            targetId: char1._id,
            relationType: 'Ally',
            description: 'Best friends',
          },
        ],
      });

      const res = await request(app).get(`${BASE}/char-two`);
      expect(res.status).toBe(200);
      const rels = res.body.character.relationships;
      expect(rels).toHaveLength(1);
      expect(rels[0].relationType).toBe('Ally');
      expect(rels[0].description).toBe('Best friends');
    });
  });

  // ─── Slug Fallback ────────────────────────────────────────────────────────────

  describe('Slug Fallback Matching', () => {
    it('should find character using the auto-generated slug from name', async () => {
      // mongoose-slug-updater generates the slug from the name field,
      // so explicitly setting a slug may be overridden.
      const char = await seedChar(movie._id, { name: 'Runami Yachiyo' });
      // The plugin will generate 'runami-yachiyo' from 'Runami Yachiyo'
      const generatedSlug = char.slug;

      const res = await request(app).get(`${BASE}/${generatedSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.character.name).toBe('Runami Yachiyo');
    });
  });

  // ─── Model-Level Validation ───────────────────────────────────────────────────

  describe('Model Validation', () => {
    it('should reject invalid role enum', async () => {
      await expect(
        Character.create({
          name: 'Invalid Role Char',
          role: 'Villain', // Not in enum
          movie: movie._id,
        })
      ).rejects.toThrow();
    });

    it('should reject character with non-existent movieId', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(
        Character.create({
          name: 'Ghost Char',
          role: 'Supporting',
          movie: fakeId,
        })
      ).rejects.toThrow(`Movie with id ${fakeId} does not exist`);
    });
  });
});
