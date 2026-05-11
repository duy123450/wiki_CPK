const mongoose = require('mongoose');

const Soundtrack = require('../../../modules/soundtrack/sound-track.model');
const Movie = require('../../../modules/wiki/models/movie.model');

let movieId;

beforeEach(async () => {
    const movie = await Movie.create({
        title: 'Test Movie', synopsis: 'Test synopsis', slug: 'test-movie',
    });
    movieId = movie._id;
});

const validTrack = () => ({
    trackNumber: 1,
    title: 'Opening Theme',
    vocal: 'Singer A',
    youtubeId: 'dQw4w9WgXcQ',
    startTime: 0,
    endTime: 240,
    movie: movieId,
});

describe('Soundtrack Model', () => {
    describe('Validations', () => {
        it('should create a valid soundtrack', async () => {
            const track = await Soundtrack.create(validTrack());
            expect(track._id).toBeDefined();
            expect(track.title).toBe('Opening Theme');
            expect(track.trackType).toBe('Insert Song'); // default
            expect(track.producer).toBe('Unknown');       // default
        });

        it('should require title', async () => {
            const data = validTrack();
            delete data.title;
            await expect(Soundtrack.create(data)).rejects.toThrow(/title/i);
        });

        it('should require vocal', async () => {
            const data = validTrack();
            delete data.vocal;
            await expect(Soundtrack.create(data)).rejects.toThrow(/vocal/i);
        });

        it('should require youtubeId', async () => {
            const data = validTrack();
            delete data.youtubeId;
            await expect(Soundtrack.create(data)).rejects.toThrow(/youtube/i);
        });

        it('should require startTime', async () => {
            const data = validTrack();
            delete data.startTime;
            await expect(Soundtrack.create(data)).rejects.toThrow(/start/i);
        });

        it('should require endTime', async () => {
            const data = validTrack();
            delete data.endTime;
            await expect(Soundtrack.create(data)).rejects.toThrow(/end/i);
        });

        it('should require movie reference', async () => {
            const data = validTrack();
            delete data.movie;
            await expect(Soundtrack.create(data)).rejects.toThrow();
        });

        it('should reject endTime <= startTime', async () => {
            await expect(
                Soundtrack.create({ ...validTrack(), startTime: 100, endTime: 50 })
            ).rejects.toThrow(/greater than start/i);
        });

        it('should reject endTime equal to startTime', async () => {
            await expect(
                Soundtrack.create({ ...validTrack(), startTime: 100, endTime: 100 })
            ).rejects.toThrow(/greater than start/i);
        });

        it('should reject negative startTime', async () => {
            await expect(
                Soundtrack.create({ ...validTrack(), startTime: -1 })
            ).rejects.toThrow();
        });

        it('should only allow valid trackTypes', async () => {
            const track = await Soundtrack.create({
                ...validTrack(), trackType: 'Opening'
            });
            expect(track.trackType).toBe('Opening');

            await expect(
                Soundtrack.create({ ...validTrack(), trackNumber: 2, trackType: 'InvalidType' })
            ).rejects.toThrow();
        });

        it('should default trackNumber to 0', async () => {
            const data = validTrack();
            delete data.trackNumber;
            const track = await Soundtrack.create(data);
            expect(track.trackNumber).toBe(0);
        });

        it('should default lyrics to empty strings', async () => {
            const track = await Soundtrack.create(validTrack());
            expect(track.lyrics.original).toBe('');
            expect(track.lyrics.romaji).toBe('');
            expect(track.lyrics.translation).toBe('');
            expect(track.lyrics.synced).toEqual([]);
        });
    });

    describe('embedUrl Virtual', () => {
        it('should generate correct YouTube embed URL', async () => {
            const track = await Soundtrack.create(validTrack());
            // Need to enable virtuals
            const json = track.toJSON({ virtuals: true });

            expect(json.embedUrl).toBe(
                'https://www.youtube.com/embed/dQw4w9WgXcQ?start=0&end=240&autoplay=1'
            );
        });

        it('should update embedUrl when youtubeId changes', async () => {
            const track = await Soundtrack.create(validTrack());
            track.youtubeId = 'newVideoId';
            track.startTime = 10;
            track.endTime = 300;
            await track.save();

            const json = track.toJSON({ virtuals: true });
            expect(json.embedUrl).toBe(
                'https://www.youtube.com/embed/newVideoId?start=10&end=300&autoplay=1'
            );
        });
    });

    describe('Indexes', () => {
        it('should have compound index on movie + trackNumber', async () => {
            const indexes = Soundtrack.schema.indexes();
            const movieTrackIndex = indexes.find(
                ([fields]) => fields.movie && fields.trackNumber
            );
            expect(movieTrackIndex).toBeDefined();
        });

        it('should have index on trackType', async () => {
            const indexes = Soundtrack.schema.indexes();
            const typeIndex = indexes.find(([fields]) => fields.trackType);
            expect(typeIndex).toBeDefined();
        });
    });
});
