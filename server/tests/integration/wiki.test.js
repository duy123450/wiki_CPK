const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../setup');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
process.env.JWT_ACCESS_LIFETIME = '15m';
process.env.JWT_REFRESH_LIFETIME = '30d';

const Movie = require('../../modules/wiki/models/movie.model');
const Category = require('../../modules/wiki/models/category.model');
const WikiPage = require('../../modules/wiki/models/wiki-page.model');

let app;

beforeAll(async () => {
    await connect();
    app = require('../../server');
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await disconnect();
});

const BASE = '/api/v1/wiki';

// ─── Seed helpers ─────────────────────────────────────────────────────────────
const seedMovie = async (overrides = {}) => {
    return Movie.create({
        title: 'Chou Kaguya Hime',
        synopsis: 'A tale of the moon princess.',
        slug: 'chou-kaguya-hime',
        ...overrides,
    });
};

const seedCategory = async (overrides = {}) => {
    return Category.create({
        name: 'Characters',
        icon: 'user',
        order: 1,
        slug: 'characters',
        ...overrides,
    });
};

const seedWikiPage = async (categoryId, overrides = {}) => {
    return WikiPage.create({
        title: 'Princess Kaguya',
        slug: 'princess-kaguya',
        content: '# Princess Kaguya\nThe main protagonist.',
        category: categoryId,
        order: 1,
        ...overrides,
    });
};

describe('Wiki API Integration Tests', () => {
    // ── GET /movie-info ───────────────────────────────────────────────────────
    describe('GET /movie-info', () => {
        it('should return movie data when the movie exists', async () => {
            await seedMovie();

            const res = await request(app).get(`${BASE}/movie-info`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('movie');
            expect(res.body.movie.title).toBe('Chou Kaguya Hime');
            expect(res.body.movie.synopsis).toBe('A tale of the moon princess.');
        });

        it('should return 404 when no movie is seeded', async () => {
            const res = await request(app).get(`${BASE}/movie-info`);

            expect(res.status).toBe(404);
        });
    });

    // ── GET /sidebar ──────────────────────────────────────────────────────────
    describe('GET /sidebar', () => {
        it('should return categories with their pages', async () => {
            const category = await seedCategory();
            await seedWikiPage(category._id);
            await seedWikiPage(category._id, {
                title: 'Tsukuyomi',
                slug: 'tsukuyomi',
                content: 'The magical realm.',
                order: 2,
            });

            const res = await request(app).get(`${BASE}/sidebar`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('categories');
            expect(res.body.categories).toHaveLength(1);
            expect(res.body.categories[0].name).toBe('Characters');
            expect(res.body.categories[0].pages).toHaveLength(2);
            expect(res.body.categories[0].pages[0]).toHaveProperty('title');
            expect(res.body.categories[0].pages[0]).toHaveProperty('slug');
        });

        it('should return an empty array when no categories exist', async () => {
            const res = await request(app).get(`${BASE}/sidebar`);

            expect(res.status).toBe(200);
            expect(res.body.categories).toEqual([]);
        });

        it('should sort categories by order', async () => {
            await seedCategory({ name: 'Music', slug: 'music', order: 2 });
            await seedCategory({ name: 'Story', slug: 'story', order: 0 });

            const res = await request(app).get(`${BASE}/sidebar`);

            expect(res.status).toBe(200);
            expect(res.body.categories[0].name).toBe('Story');
            expect(res.body.categories[1].name).toBe('Music');
        });

        it('should include category icon and slug', async () => {
            await seedCategory({ icon: 'music', slug: 'soundtrack' });

            const res = await request(app).get(`${BASE}/sidebar`);

            expect(res.body.categories[0].icon).toBe('music');
            expect(res.body.categories[0].slug).toBe('soundtrack');
        });
    });

    // ── GET /page/:slug ───────────────────────────────────────────────────────
    describe('GET /page/:slug', () => {
        it('should return a page by slug with populated category', async () => {
            const category = await seedCategory();
            await seedWikiPage(category._id);

            const res = await request(app).get(`${BASE}/page/princess-kaguya`);

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Princess Kaguya');
            expect(res.body.content).toContain('# Princess Kaguya');
            expect(res.body.category).toHaveProperty('name', 'Characters');
        });

        it('should return 404 for a non-existent slug', async () => {
            const res = await request(app).get(`${BASE}/page/does-not-exist`);

            expect(res.status).toBe(404);
        });

        it('should include page order and slug', async () => {
            const category = await seedCategory();
            await seedWikiPage(category._id, { order: 5 });

            const res = await request(app).get(`${BASE}/page/princess-kaguya`);

            expect(res.status).toBe(200);
            expect(res.body.slug).toBe('princess-kaguya');
            expect(res.body.order).toBe(5);
        });
    });
});
