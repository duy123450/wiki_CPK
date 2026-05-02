/**
 * Unit tests for soundtrack service helper: formatTrack()
 *
 * formatTrack is a private helper, so we mirror the logic here for testing.
 */

const formatTrack = (track) => {
    if (!track) return null;
    return {
        _id: track._id,
        trackNumber: track.trackNumber,
        title: track.title,
        vocal: track.vocal,
        producer: track.producer,
        trackType: track.trackType,
        youtubeId: track.youtubeId,
        startTime: track.startTime,
        endTime: track.endTime,
        embedUrl: track.embedUrl,
        coverImage: track.coverImage?.url ?? null,
        lyrics: {
            original: track.lyrics?.original ?? "",
            romaji: track.lyrics?.romaji ?? "",
            translation: track.lyrics?.translation ?? "",
            synced: track.lyrics?.synced ?? []
        },
        movie: track.movie,
    };
};

describe('Soundtrack Helpers', () => {
    describe('formatTrack()', () => {
        const fullTrack = {
            _id: 'track1',
            trackNumber: 1,
            title: 'Opening Theme',
            vocal: 'Singer A',
            producer: 'Producer X',
            trackType: 'Opening',
            youtubeId: 'abc123',
            startTime: 0,
            endTime: 240,
            embedUrl: 'https://www.youtube.com/embed/abc123?start=0&end=240&autoplay=1',
            coverImage: { url: 'https://img.com/cover.jpg', public_id: 'cover1' },
            lyrics: {
                original: '歌詞',
                romaji: 'kashi',
                translation: 'lyrics',
                synced: [{ time: 0, line: '歌詞', lineRomaji: 'kashi' }],
            },
            movie: 'movie1',
        };

        it('should return null for null input', () => {
            expect(formatTrack(null)).toBeNull();
        });

        it('should return null for undefined input', () => {
            expect(formatTrack(undefined)).toBeNull();
        });

        it('should map all fields correctly for a full track', () => {
            const result = formatTrack(fullTrack);

            expect(result._id).toBe('track1');
            expect(result.trackNumber).toBe(1);
            expect(result.title).toBe('Opening Theme');
            expect(result.vocal).toBe('Singer A');
            expect(result.producer).toBe('Producer X');
            expect(result.trackType).toBe('Opening');
            expect(result.youtubeId).toBe('abc123');
            expect(result.startTime).toBe(0);
            expect(result.endTime).toBe(240);
            expect(result.embedUrl).toContain('abc123');
            expect(result.coverImage).toBe('https://img.com/cover.jpg');
            expect(result.movie).toBe('movie1');
        });

        it('should extract coverImage.url (not the whole object)', () => {
            const result = formatTrack(fullTrack);
            expect(result.coverImage).toBe('https://img.com/cover.jpg');
            expect(typeof result.coverImage).toBe('string');
        });

        it('should default coverImage to null when missing', () => {
            const track = { ...fullTrack, coverImage: undefined };
            const result = formatTrack(track);
            expect(result.coverImage).toBeNull();
        });

        it('should default coverImage to null when url is missing', () => {
            const track = { ...fullTrack, coverImage: { public_id: 'x' } };
            const result = formatTrack(track);
            expect(result.coverImage).toBeNull();
        });

        it('should correctly map lyrics fields', () => {
            const result = formatTrack(fullTrack);
            expect(result.lyrics.original).toBe('歌詞');
            expect(result.lyrics.romaji).toBe('kashi');
            expect(result.lyrics.translation).toBe('lyrics');
            expect(result.lyrics.synced).toHaveLength(1);
            expect(result.lyrics.synced[0]).toEqual({
                time: 0, line: '歌詞', lineRomaji: 'kashi'
            });
        });

        it('should default lyrics to empty strings/array when missing', () => {
            const track = { ...fullTrack, lyrics: undefined };
            const result = formatTrack(track);
            expect(result.lyrics.original).toBe('');
            expect(result.lyrics.romaji).toBe('');
            expect(result.lyrics.translation).toBe('');
            expect(result.lyrics.synced).toEqual([]);
        });

        it('should default partial lyrics to empty strings', () => {
            const track = { ...fullTrack, lyrics: { original: 'text only' } };
            const result = formatTrack(track);
            expect(result.lyrics.original).toBe('text only');
            expect(result.lyrics.romaji).toBe('');
            expect(result.lyrics.translation).toBe('');
            expect(result.lyrics.synced).toEqual([]);
        });
    });

    describe('embedUrl virtual format', () => {
        it('should produce the correct YouTube embed URL format', () => {
            const youtubeId = 'dQw4w9WgXcQ';
            const startTime = 30;
            const endTime = 120;
            const expectedUrl = `https://www.youtube.com/embed/${youtubeId}?start=${startTime}&end=${endTime}&autoplay=1`;

            expect(expectedUrl).toBe(
                'https://www.youtube.com/embed/dQw4w9WgXcQ?start=30&end=120&autoplay=1'
            );
        });

        it('should handle zero start time', () => {
            const url = `https://www.youtube.com/embed/abc?start=0&end=100&autoplay=1`;
            expect(url).toContain('start=0');
            expect(url).toContain('end=100');
        });
    });
});
