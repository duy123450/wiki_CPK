const request = require('supertest');
const mongoose = require('mongoose');

const Movie = require('../../modules/wiki/models/movie.model');
const Character = require('../../modules/characters/character.model');

let app;

beforeAll(async () => {
    app = require('../../server');
});


const BASE = '/api/v1/wiki/characters';

const seedMovie = async () => Movie.create({
    title: 'Chou Kaguya Hime', synopsis: 'A tale.', slug: 'chou-kaguya-hime',
});

const seedChar = async (movieId, ov = {}) => Character.create({
    name: 'Kaguya', slug: 'kaguya', role: 'Protagonist',
    description: { summary: 'Moon princess' }, movie: movieId, ...ov,
});

describe('Character API', () => {
    let movie;
    beforeEach(async () => { movie = await seedMovie(); });

    describe('GET /', () => {
        it('returns characters with pagination', async () => {
            await seedChar(movie._id);
            await seedChar(movie._id, { name: 'Sakayori Iroha', slug: 'sakayori-iroha' });
            const res = await request(app).get(BASE);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('characters');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.characters.length).toBeGreaterThanOrEqual(2);
            expect(res.body.pagination).toHaveProperty('total');
            expect(res.body.pagination).toHaveProperty('totalPages');
        });

        it('returns empty when no characters', async () => {
            const res = await request(app).get(BASE);
            expect(res.status).toBe(200);
            expect(res.body.characters).toEqual([]);
            expect(res.body.pagination.total).toBe(0);
        });

        it('filters by role', async () => {
            await seedChar(movie._id, { name: 'Hero', slug: 'hero', role: 'Protagonist' });
            await seedChar(movie._id, { name: 'Villain', slug: 'villain', role: 'Antagonist' });
            const res = await request(app).get(`${BASE}?role=Antagonist`);
            expect(res.status).toBe(200);
            expect(res.body.characters).toHaveLength(1);
            expect(res.body.characters[0].role).toBe('Antagonist');
        });

        it('respects pagination limit', async () => {
            await seedChar(movie._id, { name: 'A', slug: 'a' });
            await seedChar(movie._id, { name: 'B', slug: 'b' });
            await seedChar(movie._id, { name: 'C', slug: 'c' });
            const res = await request(app).get(`${BASE}?page=1&limit=2`);
            expect(res.status).toBe(200);
            expect(res.body.characters).toHaveLength(2);
            expect(res.body.pagination.total).toBe(3);
            expect(res.body.pagination.hasNextPage).toBe(true);
        });

        it('sorts by canonical order', async () => {
            await seedChar(movie._id, { name: 'Fushi', slug: 'fushi' });
            await seedChar(movie._id, { name: 'Sakayori Iroha', slug: 'si' });
            const res = await request(app).get(BASE);
            const names = res.body.characters.map(c => c.name);
            expect(names.indexOf('Sakayori Iroha')).toBeLessThan(names.indexOf('Fushi'));
        });
    });

    describe('GET /:slug', () => {
        it('returns a character by slug', async () => {
            await seedChar(movie._id);
            const res = await request(app).get(`${BASE}/kaguya`);
            expect(res.status).toBe(200);
            expect(res.body.character.name).toBe('Kaguya');
            expect(res.body.character.slug).toBe('kaguya');
        });

        it('returns 404 for non-existent slug', async () => {
            const res = await request(app).get(`${BASE}/nonexistent`);
            expect(res.status).toBe(404);
        });

        it('includes all character fields', async () => {
            await seedChar(movie._id, {
                voiceActor: 'Actor',
                abilities: [{ skillName: 'Light', type: 'Active', effect: ['Heal'] }],
            });
            const res = await request(app).get(`${BASE}/kaguya`);
            const c = res.body.character;
            expect(c).toHaveProperty('_id');
            expect(c).toHaveProperty('name');
            expect(c).toHaveProperty('slug');
            expect(c).toHaveProperty('role');
            expect(c).toHaveProperty('voiceActor', 'Actor');
        });
    });
});
