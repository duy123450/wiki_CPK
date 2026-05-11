const mongoose = require('mongoose');

const Movie = require('../../../modules/wiki/models/movie.model');

const validMovie = {
    title: 'Chou Kaguya Hime',
    synopsis: 'A tale of the moon princess and a heart\'s desire.',
    slug: 'chou-kaguya-hime',
};

describe('Movie Model', () => {
    describe('Validations', () => {
        it('should create a valid movie', async () => {
            const movie = await Movie.create(validMovie);
            expect(movie._id).toBeDefined();
            expect(movie.title).toBe('Chou Kaguya Hime');
            expect(movie.rating).toBe(0); // default
        });

        it('should require title', async () => {
            await expect(
                Movie.create({ synopsis: 'Some story', slug: 'test' })
            ).rejects.toThrow(/title/i);
        });

        it('should require synopsis', async () => {
            await expect(
                Movie.create({ title: 'Test', slug: 'test' })
            ).rejects.toThrow(/synopsis/i);
        });

        it('should enforce unique title', async () => {
            await Movie.create(validMovie);
            await expect(
                Movie.create({ ...validMovie, slug: 'other' })
            ).rejects.toThrow();
        });

        it('should trim title', async () => {
            const movie = await Movie.create({
                ...validMovie, title: '  Trimmed Title  ', slug: 'trimmed',
            });
            expect(movie.title).toBe('Trimmed Title');
        });

        it('should clamp rating to 0-10 range (min)', async () => {
            await expect(
                Movie.create({ ...validMovie, title: 'M2', slug: 'm2', rating: -1 })
            ).rejects.toThrow();
        });

        it('should clamp rating to 0-10 range (max)', async () => {
            await expect(
                Movie.create({ ...validMovie, title: 'M3', slug: 'm3', rating: 11 })
            ).rejects.toThrow();
        });

        it('should accept valid rating', async () => {
            const movie = await Movie.create({
                ...validMovie, title: 'M4', slug: 'm4', rating: 8.5,
            });
            expect(movie.rating).toBe(8.5);
        });
    });

    describe('Virtuals', () => {
        it('should have characters virtual', () => {
            const virtuals = Movie.schema.virtuals;
            expect(virtuals).toHaveProperty('characters');
        });

        it('should have soundtracks virtual', () => {
            const virtuals = Movie.schema.virtuals;
            expect(virtuals).toHaveProperty('soundtracks');
        });
    });

    describe('Timestamps', () => {
        it('should auto-generate createdAt and updatedAt', async () => {
            const movie = await Movie.create(validMovie);
            expect(movie.createdAt).toBeInstanceOf(Date);
            expect(movie.updatedAt).toBeInstanceOf(Date);
        });
    });
});
