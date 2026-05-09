const mongoose = require('mongoose');
const { connect, clearDatabase, disconnect } = require('../../utils/dbHandler');

const WikiPage = require('../../../modules/wiki/models/wiki-page.model');
const Category = require('../../../modules/wiki/models/category.model');
const Movie = require('../../../modules/wiki/models/movie.model');

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDatabase(); });
afterAll(async () => { await disconnect(); });

let categoryId;

beforeEach(async () => {
    const cat = await Category.create({ name: 'Lore', icon: 'book', order: 0 });
    categoryId = cat._id;
});

describe('WikiPage Model', () => {
    describe('Validations', () => {
        it('should create a valid wiki page', async () => {
            const page = await WikiPage.create({
                title: 'Princess Kaguya',
                content: '# Princess Kaguya\nThe main protagonist.',
                category: categoryId,
            });
            expect(page._id).toBeDefined();
            expect(page.title).toBe('Princess Kaguya');
            expect(page.order).toBe(0); // default
        });

        it('should require title', async () => {
            await expect(
                WikiPage.create({ content: 'Some text', category: categoryId })
            ).rejects.toThrow();
        });

        it('should require content', async () => {
            await expect(
                WikiPage.create({ title: 'Test', category: categoryId })
            ).rejects.toThrow();
        });

        it('should require category', async () => {
            await expect(
                WikiPage.create({ title: 'Test', content: 'Content' })
            ).rejects.toThrow(/category/i);
        });

        it('should enforce unique title', async () => {
            await WikiPage.create({
                title: 'Unique Page', content: 'Content', category: categoryId,
            });
            await expect(
                WikiPage.create({
                    title: 'Unique Page', content: 'Other', category: categoryId,
                })
            ).rejects.toThrow();
        });
    });

    describe('Auto-slug Generation (pre-validate)', () => {
        it('should auto-generate slug from title', async () => {
            const page = await WikiPage.create({
                title: 'Princess Kaguya',
                content: 'Content here.',
                category: categoryId,
            });
            expect(page.slug).toBe('princess-kaguya');
        });

        it('should convert spaces to hyphens', async () => {
            const page = await WikiPage.create({
                title: 'The Moon Kingdom',
                content: 'Content.',
                category: categoryId,
            });
            expect(page.slug).toBe('the-moon-kingdom');
        });

        it('should strip special characters', async () => {
            const page = await WikiPage.create({
                title: "Kaguya's Journey!",
                content: 'Content.',
                category: categoryId,
            });
            expect(page.slug).toBe('kaguya-s-journey');
        });

        it('should lowercase the slug', async () => {
            const page = await WikiPage.create({
                title: 'UPPER CASE Title',
                content: 'Content.',
                category: categoryId,
            });
            expect(page.slug).toBe('upper-case-title');
        });

        it('should NOT overwrite an existing slug', async () => {
            const page = await WikiPage.create({
                title: 'Some Title',
                slug: 'custom-slug',
                content: 'Content.',
                category: categoryId,
            });
            expect(page.slug).toBe('custom-slug');
        });

        it('should remove leading and trailing hyphens', async () => {
            const page = await WikiPage.create({
                title: '---Dash Test---',
                content: 'Content.',
                category: categoryId,
            });
            expect(page.slug).toBe('dash-test');
        });
    });

    describe('Indexes', () => {
        it('should have text index on title and content', async () => {
            const indexes = WikiPage.schema.indexes();
            const textIndex = indexes.find(([fields]) =>
                fields.title === 'text' || fields.content === 'text'
            );
            expect(textIndex).toBeDefined();
        });

        it('should have index on category', async () => {
            const indexes = WikiPage.schema.indexes();
            const catIndex = indexes.find(([fields]) => fields.category);
            expect(catIndex).toBeDefined();
        });
    });
});
