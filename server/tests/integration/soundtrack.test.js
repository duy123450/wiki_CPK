const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
process.env.JWT_ACCESS_LIFETIME = '15m';
process.env.JWT_REFRESH_LIFETIME = '30d';

const Movie = require('../../modules/wiki/models/movie.model');
const Soundtrack = require('../../modules/soundtrack/sound-track.model');

let app;

beforeAll(async () => {
    app = require('../../server');
});

const BASE = '/api/v1/wiki/soundtrack';

const seedMovie = async () => Movie.create({
    title: 'Chou Kaguya Hime', synopsis: 'A tale.', slug: 'chou-kaguya-hime',
});

const seedTrack = async (movieId, ov = {}) => Soundtrack.create({
    trackNumber: 1, title: 'Opening', vocal: 'Singer',
    youtubeId: 'abc123', startTime: 0, endTime: 240,
    movie: movieId, ...ov,
});

describe('Soundtrack API', () => {
    let movie;
    beforeEach(async () => { movie = await seedMovie(); });

    describe('GET / (all tracks)', () => {
        it('returns tracks sorted by trackNumber', async () => {
            await seedTrack(movie._id, { trackNumber: 2, title: 'Ending', slug: 'e' });
            await seedTrack(movie._id, { trackNumber: 1, title: 'Opening', slug: 'o' });
            const res = await request(app).get(`${BASE}?movieId=${movie._id}`);
            expect(res.status).toBe(200);
            expect(res.body.tracks).toHaveLength(2);
            expect(res.body.tracks[0].trackNumber).toBe(1);
            expect(res.body.tracks[1].trackNumber).toBe(2);
        });

        it('returns 400 without movieId', async () => {
            const res = await request(app).get(BASE);
            expect(res.status).toBe(400);
        });

        it('returns empty array for movie with no tracks', async () => {
            const res = await request(app).get(`${BASE}?movieId=${movie._id}`);
            expect(res.status).toBe(200);
            expect(res.body.tracks).toEqual([]);
        });
    });

    describe('GET /next (playback navigation)', () => {
        it('sequential: returns the next track', async () => {
            const t1 = await seedTrack(movie._id, { trackNumber: 1, title: 'Track 1' });
            await seedTrack(movie._id, { trackNumber: 2, title: 'Track 2' });

            const res = await request(app).get(
                `${BASE}/next?currentTrackId=${t1._id}&mode=sequential&movieId=${movie._id}`
            );
            expect(res.status).toBe(200);
            expect(res.body.mode).toBe('sequential');
            expect(res.body.track.trackNumber).toBe(2);
        });

        it('sequential: wraps around to first track', async () => {
            await seedTrack(movie._id, { trackNumber: 1, title: 'Track 1' });
            const t2 = await seedTrack(movie._id, { trackNumber: 2, title: 'Track 2' });

            const res = await request(app).get(
                `${BASE}/next?currentTrackId=${t2._id}&mode=sequential&movieId=${movie._id}`
            );
            expect(res.status).toBe(200);
            expect(res.body.track.trackNumber).toBe(1);
            expect(res.body.wrapped).toBe(true);
        });

        it('shuffle: returns a different track', async () => {
            const t1 = await seedTrack(movie._id, { trackNumber: 1, title: 'Track 1' });
            await seedTrack(movie._id, { trackNumber: 2, title: 'Track 2' });
            await seedTrack(movie._id, { trackNumber: 3, title: 'Track 3' });

            const res = await request(app).get(
                `${BASE}/next?currentTrackId=${t1._id}&mode=shuffle&movieId=${movie._id}`
            );
            expect(res.status).toBe(200);
            expect(res.body.mode).toBe('shuffle');
            expect(res.body.track).toBeDefined();
            // Should not return the same track (with >1 track available)
            expect(res.body.track._id.toString()).not.toBe(t1._id.toString());
        });

        it('infinite: returns same track with restart flag', async () => {
            const t1 = await seedTrack(movie._id, { trackNumber: 1 });

            const res = await request(app).get(
                `${BASE}/next?currentTrackId=${t1._id}&mode=infinite&movieId=${movie._id}`
            );
            expect(res.status).toBe(200);
            expect(res.body.mode).toBe('infinite');
            expect(res.body.track._id.toString()).toBe(t1._id.toString());
            expect(res.body.restart).toBe(true);
        });

        it('returns 400 for invalid mode', async () => {
            const t1 = await seedTrack(movie._id);
            await seedTrack(movie._id, { trackNumber: 2, title: 'Track 2' });
            const res = await request(app).get(
                `${BASE}/next?currentTrackId=${t1._id}&mode=invalid&movieId=${movie._id}`
            );
            expect(res.status).toBe(400);
        });

        it('returns 400 when params are missing', async () => {
            const res = await request(app).get(`${BASE}/next`);
            expect(res.status).toBe(400);
        });

        it('returns 404 for non-existent track', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app).get(
                `${BASE}/next?currentTrackId=${fakeId}&mode=sequential&movieId=${movie._id}`
            );
            expect(res.status).toBe(404);
        });

        it('sequential with single track: restarts', async () => {
            const t1 = await seedTrack(movie._id, { trackNumber: 1 });
            const res = await request(app).get(
                `${BASE}/next?currentTrackId=${t1._id}&mode=sequential&movieId=${movie._id}`
            );
            expect(res.status).toBe(200);
            // With only 1 track, it should restart
            expect(res.body.restart).toBe(true);
        });
    });
});
