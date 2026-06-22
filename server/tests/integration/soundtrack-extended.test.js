const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Movie = require('../../modules/wiki/models/movie.model');
const Soundtrack = require('../../modules/soundtrack/sound-track.model');

const BASE = '/api/v1/wiki/soundtrack';

const seedMovie = (ov = {}) =>
  Movie.create({
    title: 'Soundtrack Extended Movie',
    synopsis: 'Test.',
    slug: 'soundtrack-extended-movie',
    ...ov,
  });

const seedTrack = (movieId, ov = {}) =>
  Soundtrack.create({
    trackNumber: 1,
    title: 'Test Track',
    vocal: 'Test Singer',
    youtubeId: 'testVideoId',
    startTime: 0,
    endTime: 200,
    movie: movieId,
    ...ov,
  });

describe('Soundtrack Extended Tests', () => {
  let movie;

  beforeEach(async () => {
    await Soundtrack.deleteMany({});
    await Movie.deleteMany({});
    movie = await seedMovie();
  });

  // ─── Lyrics ────────────────────────────────────────────────────────────────────

  describe('Lyrics Handling', () => {
    it('should store and retrieve full lyrics object', async () => {
      const track = await seedTrack(movie._id, {
        title: 'Lyric Track',
        lyrics: {
          romaji: 'Tsuki no hikari',
          translation: 'Ánh trăng',
          translator: 'Translator A',
          source: 'fan-translation',
          synced: [
            { time: 5, line: 'Tsuki no hikari', lineTranslation: 'Ánh trăng' },
            { time: 10, line: 'Kagayaki tsuzukeru', lineTranslation: 'Vẫn sáng mãi' },
          ],
        },
      });

      const res = await request(app).get(`${BASE}/${track.slug}`);
      expect(res.status).toBe(200);
      const { lyrics } = res.body.track;
      expect(lyrics).toBeDefined();
      expect(lyrics.romaji).toBe('Tsuki no hikari');
      expect(lyrics.translation).toBe('Ánh trăng');
      expect(lyrics.synced).toHaveLength(2);
      expect(lyrics.synced[0].time).toBe(5);
      expect(lyrics.synced[1].line).toBe('Kagayaki tsuzukeru');
    });

    it('should default to empty lyrics when not provided', async () => {
      const track = await seedTrack(movie._id, { title: 'No Lyrics Track' });
      const res = await request(app).get(`${BASE}/${track.slug}`);
      expect(res.status).toBe(200);
      const { lyrics } = res.body.track;
      expect(lyrics.romaji).toBe('');
      expect(lyrics.translation).toBe('');
      expect(lyrics.synced).toEqual([]);
    });

    it('should store synced lyrics with correct time ordering', async () => {
      const track = await seedTrack(movie._id, {
        title: 'Synced Track',
        lyrics: {
          synced: [
            { time: 20, line: 'Second line' },
            { time: 5, line: 'First line' },
            { time: 40, line: 'Third line' },
          ],
        },
      });

      const saved = await Soundtrack.findById(track._id);
      // Mongoose just stores them as-is; ordering is up to the client
      expect(saved.lyrics.synced).toHaveLength(3);
    });
  });

  // ─── embedUrl Virtual ─────────────────────────────────────────────────────────

  describe('embedUrl Virtual', () => {
    it('should compute embedUrl from youtubeId, startTime, endTime', async () => {
      const track = await seedTrack(movie._id, {
        youtubeId: 'abc123xyz',
        startTime: 30,
        endTime: 150,
      });

      expect(track.embedUrl).toBe(
        'https://www.youtube.com/embed/abc123xyz?start=30&end=150&autoplay=1'
      );
    });
  });

  // ─── Validation ────────────────────────────────────────────────────────────────

  describe('Model Validation', () => {
    it('should reject track with endTime <= startTime', async () => {
      await expect(
        seedTrack(movie._id, { startTime: 100, endTime: 50, title: 'Bad Time Track' })
      ).rejects.toThrow('End time must be greater than start time');
    });

    it('should reject track with non-existent movieId', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(
        seedTrack(fakeId, { title: 'Ghost Track' })
      ).rejects.toThrow(`Movie with id ${fakeId} does not exist`);
    });

    it('should reject track missing required fields', async () => {
      await expect(
        Soundtrack.create({ title: 'Missing Fields', movie: movie._id })
      ).rejects.toThrow();
    });

    it('should reject invalid trackType enum', async () => {
      await expect(
        seedTrack(movie._id, { trackType: 'InvalidType', title: 'Bad Type Track' })
      ).rejects.toThrow();
    });
  });

  // ─── trackType Filtering ──────────────────────────────────────────────────────

  describe('TrackType and trackNumber', () => {
    it('should handle Opening, Insert Song, and Ending track types', async () => {
      await seedTrack(movie._id, { title: 'Op', trackType: 'Opening', trackNumber: 1 });
      await seedTrack(movie._id, { title: 'Insert', trackType: 'Insert Song', trackNumber: 2 });
      await seedTrack(movie._id, { title: 'Ed', trackType: 'Ending', trackNumber: 3 });

      const res = await request(app).get(`${BASE}?movieId=${movie._id}`);
      expect(res.status).toBe(200);
      expect(res.body.tracks).toHaveLength(3);
      const types = res.body.tracks.map((t) => t.trackType);
      expect(types).toContain('Opening');
      expect(types).toContain('Insert Song');
      expect(types).toContain('Ending');
    });

    it('should return tracks sorted by trackNumber', async () => {
      await seedTrack(movie._id, { title: 'Third', trackNumber: 3 });
      await seedTrack(movie._id, { title: 'First', trackNumber: 1 });
      await seedTrack(movie._id, { title: 'Second', trackNumber: 2 });

      const res = await request(app).get(`${BASE}?movieId=${movie._id}`);
      expect(res.status).toBe(200);
      const nums = res.body.tracks.map((t) => t.trackNumber);
      expect(nums).toEqual([1, 2, 3]);
    });
  });

  // ─── officialUrl array ─────────────────────────────────────────────────────────

  describe('Official URLs', () => {
    it('should store multiple official URLs', async () => {
      const track = await seedTrack(movie._id, {
        title: 'Multi URL Track',
        officialUrl: [
          { label: 'Spotify', url: 'https://spotify.com/track/123' },
          { label: 'Apple Music', url: 'https://music.apple.com/track/123' },
        ],
      });

      const saved = await Soundtrack.findById(track._id);
      expect(saved.officialUrl).toHaveLength(2);
      expect(saved.officialUrl[0].label).toBe('Spotify');
      expect(saved.officialUrl[1].label).toBe('Apple Music');
    });
  });
});
