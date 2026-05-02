const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../../setup');

const Category = require('../../../models/category.model');

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDatabase(); });
afterAll(async () => { await disconnect(); });

describe('Category Model', () => {
    describe('Validations', () => {
        it('should create a valid category', async () => {
            const cat = await Category.create({ name: 'Characters' });
            expect(cat._id).toBeDefined();
            expect(cat.name).toBe('Characters');
            expect(cat.icon).toBe('file-text'); // default
            expect(cat.order).toBe(0);          // default
        });

        it('should require name', async () => {
            await expect(Category.create({})).rejects.toThrow(/name/i);
        });

        it('should enforce unique name', async () => {
            await Category.create({ name: 'Music' });
            await expect(Category.create({ name: 'Music' })).rejects.toThrow();
        });

        it('should trim name', async () => {
            const cat = await Category.create({ name: '  Soundtrack  ' });
            expect(cat.name).toBe('Soundtrack');
        });
    });

    describe('Auto-slug Generation (pre-validate)', () => {
        it('should auto-generate slug from name', async () => {
            const cat = await Category.create({ name: 'Characters' });
            expect(cat.slug).toBe('characters');
        });

        it('should handle multi-word names', async () => {
            const cat = await Category.create({ name: 'Voice Actors' });
            expect(cat.slug).toBe('voice-actors');
        });

        it('should strip special characters', async () => {
            const cat = await Category.create({ name: 'Music & Sounds!' });
            expect(cat.slug).toBe('music-sounds');
        });

        it('should NOT overwrite an existing slug', async () => {
            const cat = await Category.create({ name: 'Test', slug: 'my-slug' });
            expect(cat.slug).toBe('my-slug');
        });

        it('should lowercase the slug', async () => {
            const cat = await Category.create({ name: 'GALLERY' });
            expect(cat.slug).toBe('gallery');
        });
    });

    describe('Timestamps', () => {
        it('should auto-generate createdAt and updatedAt', async () => {
            const cat = await Category.create({ name: 'Test Category' });
            expect(cat.createdAt).toBeInstanceOf(Date);
            expect(cat.updatedAt).toBeInstanceOf(Date);
        });
    });
});
