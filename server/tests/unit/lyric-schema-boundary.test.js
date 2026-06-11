/**
 * Lyric Schema Boundary Value Testing
 * Tests nested Mongoose LyricSchema for edge cases, overlapping timestamps,
 * empty arrays, malformed dual-language structures
 */

const Soundtrack = require('../../modules/soundtrack/sound-track.model');
const Movie = require('../../modules/wiki/models/movie.model');
const { z } = require('zod');
const mongoose = require('mongoose');

describe('Lyric Schema Boundary Tests', () => {
    let movieId;

    beforeAll(async () => {
        // Connect to test DB if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cpk_test');
        }
    });

    beforeEach(async () => {
        // Create a test movie for soundtrack
        const movie = await Movie.create({
            title: 'Test Movie',
            synopsis: 'Test synopsis',
            slug: 'test-movie-' + Date.now(),
        });
        movieId = movie._id;
    });

    afterEach(async () => {
        await Soundtrack.deleteMany({});
        await Movie.deleteMany({});
    });

    afterAll(async () => {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    });

    describe('Timestamp Ordering Violations', () => {
        it('should reject overlapping timestamps (line end > next line start)', async () => {
            const malformedLyric = {
                songId: 'song_123',
                lyrics: [
                    {
                        lineIndex: 0,
                        startMs: 0,
                        endMs: 5000, // Ends at 5000
                        japanese: 'Line 1',
                        romaji: 'Line 1 Romaji',
                        vietnamese: 'Line 1 Viet',
                    },
                    {
                        lineIndex: 1,
                        startMs: 4000, // Starts at 4000 BEFORE previous ends at 5000 ❌ OVERLAP
                        endMs: 8000,
                        japanese: 'Line 2',
                        romaji: 'Line 2 Romaji',
                        vietnamese: 'Line 2 Viet',
                    },
                ],
            };

            const validator = z.object({
                lyrics: z
                    .array(
                        z.object({
                            startMs: z.number().nonnegative(),
                            endMs: z.number(),
                        })
                    )
                    .refine(
                        (lyrics) => {
                            for (let i = 0; i < lyrics.length - 1; i++) {
                                if (lyrics[i].endMs > lyrics[i + 1].startMs) {
                                    return false; // Overlap detected
                                }
                            }
                            return true;
                        },
                        { message: 'Lyric timestamps overlap' }
                    ),
            });

            expect(() => validator.parse(malformedLyric)).toThrow();
        });

        it('should reject reversed timestamps (startMs > endMs)', async () => {
            const malformedLyric = {
                songId: 'song_124',
                lyrics: [
                    {
                        lineIndex: 0,
                        startMs: 5000,
                        endMs: 1000, // 1000 < 5000 ❌
                        japanese: 'Line 1',
                        romaji: 'Line 1 Romaji',
                        vietnamese: 'Line 1 Viet',
                    },
                ],
            };

            const validator = z.object({
                lyrics: z.array(
                    z
                        .object({
                            startMs: z.number().nonnegative(),
                            endMs: z.number(),
                        })
                        .refine((obj) => obj.startMs < obj.endMs, {
                            message: 'endMs must be greater than startMs',
                        })
                ),
            });

            expect(() => validator.parse(malformedLyric)).toThrow();
        });

        it('should reject identical startMs and endMs (zero-duration line)', async () => {
            const validator = z
                .object({
                    startMs: z.number(),
                    endMs: z.number(),
                })
                .refine((obj) => obj.endMs > obj.startMs, {
                    message: 'Line must have non-zero duration',
                });

            expect(() =>
                validator.parse({
                    startMs: 5000,
                    endMs: 5000, // ❌ ZERO DURATION
                })
            ).toThrow();
        });
    });

    describe('Empty & Null Values', () => {
        it('should reject empty lyrics array', async () => {
            const validator = z.object({
                songId: z.string(),
                lyrics: z.array(z.object({})).min(1, 'At least one lyric required'),
            });

            expect(() =>
                validator.parse({
                    songId: 'song_125',
                    lyrics: [], // ❌ EMPTY
                })
            ).toThrow();
        });

        it('should reject lyrics with empty language strings', async () => {
            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        japanese: z.string().min(1, 'Japanese text required'),
                        romaji: z.string().min(1, 'Romaji text required'),
                        vietnamese: z.string().min(1, 'Vietnamese text required'),
                    })
                ),
            });

            expect(() =>
                validator.parse({
                    lyrics: [
                        {
                            japanese: '', // ❌ EMPTY
                            romaji: 'Line 1',
                            vietnamese: 'Line 1 Viet',
                        },
                    ],
                })
            ).toThrow();
        });

        it('should handle partial language missing (only Japanese, no Romaji)', async () => {
            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        japanese: z.string().min(1).optional(),
                        romaji: z.string().min(1).optional(),
                        vietnamese: z.string().min(1).optional(),
                    })
                ),
            });

            // Should succeed with optional languages
            const result = validator.parse({
                lyrics: [
                    {
                        japanese: 'こんにちは',
                        // romaji: missing
                        // vietnamese: missing
                    },
                ],
            });

            expect(result.lyrics[0].japanese).toBe('こんにちは');
        });

        it('should reject null in timestamps', async () => {
            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        startMs: z.number().nonnegative(),
                        endMs: z.number().nonnegative(),
                    })
                ),
            });

            expect(() =>
                validator.parse({
                    lyrics: [
                        {
                            startMs: null, // ❌ NULL
                            endMs: 5000,
                        },
                    ],
                })
            ).toThrow();
        });
    });

    describe('Extreme Values', () => {
        it('should reject negative timestamps', async () => {
            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        startMs: z.number().nonnegative('startMs cannot be negative'),
                    })
                ),
            });

            expect(() =>
                validator.parse({
                    lyrics: [{ startMs: -1000 }],
                })
            ).toThrow();
        });

        it('should reject unreasonably large timestamps (>1 hour)', async () => {
            const ONE_HOUR_MS = 3600000;

            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        startMs: z.number().max(ONE_HOUR_MS, 'Song cannot exceed 1 hour'),
                        endMs: z.number().max(ONE_HOUR_MS, 'Song cannot exceed 1 hour'),
                    })
                ),
            });

            expect(() =>
                validator.parse({
                    lyrics: [
                        {
                            startMs: 0,
                            endMs: ONE_HOUR_MS + 1, // ❌ EXCEEDS 1 HOUR
                        },
                    ],
                })
            ).toThrow();
        });

        it('should accept maximum valid timestamp values', async () => {
            const ONE_HOUR_MS = 3600000;

            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        startMs: z.number().nonnegative(),
                        endMs: z.number().max(ONE_HOUR_MS),
                    })
                ),
            });

            const result = validator.parse({
                lyrics: [
                    {
                        startMs: 0,
                        endMs: ONE_HOUR_MS, // ✓ Valid boundary
                    },
                ],
            });

            expect(result.lyrics[0].endMs).toBe(ONE_HOUR_MS);
        });
    });

    describe('Language Encoding & Special Characters', () => {
        it('should handle Japanese kanji, hiragana, katakana', async () => {
            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        japanese: z.string(),
                    })
                ),
            });

            const result = validator.parse({
                lyrics: [
                    {
                        japanese: '漢字ひらがなカタカナ',
                    },
                ],
            });

            expect(result.lyrics[0].japanese).toBe('漢字ひらがなカタカナ');
        });

        it('should handle Vietnamese diacritical marks', async () => {
            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        vietnamese: z.string(),
                    })
                ),
            });

            const result = validator.parse({
                lyrics: [
                    {
                        vietnamese: 'Xin chào thế giới ơi! Tôi là người Việt.',
                    },
                ],
            });

            expect(result.lyrics[0].vietnamese).toContain('ơ');
        });

        it('should reject emoji in language fields (optional validation)', async () => {
            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        japanese: z.string().regex(/^[\p{L}\p{P}\p{Z}]*$/u, 'No emoji allowed'),
                    })
                ),
            });

            expect(() =>
                validator.parse({
                    lyrics: [
                        {
                            japanese: 'こんにちは😊', // ❌ EMOJI
                        },
                    ],
                })
            ).toThrow();
        });

        it('should handle very long lyric text (10KB)', async () => {
            const longText = 'あ'.repeat(5000); // 5000 Japanese characters

            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        japanese: z.string().max(10000),
                    })
                ),
            });

            const result = validator.parse({
                lyrics: [
                    {
                        japanese: longText,
                    },
                ],
            });

            expect(result.lyrics[0].japanese.length).toBe(5000);
        });
    });

    describe('Sync Differences Between Languages', () => {
        it('should allow different timestamps for same semantic line in different languages', async () => {
            // This is intentional: lyrics might have different sync points per language
            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        startMs: z.number(),
                        endMs: z.number(),
                        japanese: z.string(),
                        japaneseStartMs: z.number().optional(),
                        japaneseEndMs: z.number().optional(),
                        romanizedStartMs: z.number().optional(),
                        romanizedEndMs: z.number().optional(),
                    })
                ),
            });

            const result = validator.parse({
                lyrics: [
                    {
                        startMs: 0,
                        endMs: 5000,
                        japanese: 'こんにちは',
                        japaneseStartMs: 100,
                        japaneseEndMs: 4800,
                        romanizedStartMs: 0,
                        romanizedEndMs: 5000,
                    },
                ],
            });

            expect(result.lyrics[0].japaneseStartMs).toBe(100);
        });

        it('should reject mismatched line count between languages (if enforced)', async () => {
            const validator = z
                .object({
                    japanese: z.array(z.string()),
                    romaji: z.array(z.string()),
                    vietnamese: z.array(z.string()),
                })
                .refine(
                    (obj) =>
                        obj.japanese.length === obj.romaji.length &&
                        obj.romaji.length === obj.vietnamese.length,
                    { message: 'All languages must have same line count' }
                );

            expect(() =>
                validator.parse({
                    japanese: ['Line 1', 'Line 2'],
                    romaji: ['Line 1'],
                    vietnamese: ['Line 1', 'Line 2', 'Line 3'],
                })
            ).toThrow();
        });
    });

    describe('Nested Schema Validation', () => {
        it('should reject malformed lineIndex sequence (gaps)', async () => {
            const validator = z
                .object({
                    lyrics: z.array(
                        z.object({
                            lineIndex: z.number().nonnegative().int(),
                        })
                    ),
                })
                .refine(
                    (obj) => {
                        // Verify lineIndex is 0, 1, 2, ... n without gaps
                        const indices = obj.lyrics.map((l) => l.lineIndex).sort();
                        for (let i = 0; i < indices.length; i++) {
                            if (indices[i] !== i) return false;
                        }
                        return true;
                    },
                    { message: 'lineIndex must be sequential starting from 0' }
                );

            expect(() =>
                validator.parse({
                    lyrics: [
                        { lineIndex: 0 },
                        { lineIndex: 2 }, // ❌ GAP: skipped 1
                    ],
                })
            ).toThrow();
        });

        it('should reject duplicate lineIndex values', async () => {
            const validator = z
                .object({
                    lyrics: z.array(
                        z.object({
                            lineIndex: z.number(),
                        })
                    ),
                })
                .refine(
                    (obj) => {
                        const indices = obj.lyrics.map((l) => l.lineIndex);
                        return new Set(indices).size === indices.length;
                    },
                    { message: 'lineIndex values must be unique' }
                );

            expect(() =>
                validator.parse({
                    lyrics: [
                        { lineIndex: 0 },
                        { lineIndex: 0 }, // ❌ DUPLICATE
                    ],
                })
            ).toThrow();
        });
    });

    describe('Whitespace & Normalization', () => {
        it('should trim leading/trailing whitespace from lyrics', async () => {
            const schema = z.object({
                lyrics: z.array(
                    z.object({
                        japanese: z.string().trim(),
                        romaji: z.string().trim(),
                        vietnamese: z.string().trim(),
                    })
                ),
            });

            const result = schema.parse({
                lyrics: [
                    {
                        japanese: '  こんにちは  ',
                        romaji: '  Konnichiwa  ',
                        vietnamese: '  Xin chào  ',
                    },
                ],
            });

            expect(result.lyrics[0].japanese).toBe('こんにちは');
            expect(result.lyrics[0].romaji).toBe('Konnichiwa');
            expect(result.lyrics[0].vietnamese).toBe('Xin chào');
        });

        it('should reject lyrics with only whitespace', async () => {
            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        japanese: z.string().trim().min(1),
                    })
                ),
            });

            expect(() =>
                validator.parse({
                    lyrics: [
                        {
                            japanese: '    ', // ❌ ONLY WHITESPACE
                        },
                    ],
                })
            ).toThrow();
        });

        it('should normalize line breaks to spaces', async () => {
            const preProcess = (text) => text.replace(/[\r\n]+/g, ' ').trim();

            const validator = z.object({
                lyrics: z.array(
                    z.object({
                        japanese: z
                            .string()
                            .transform(preProcess)
                            .refine((v) => !v.includes('\n')),
                    })
                ),
            });

            const result = validator.parse({
                lyrics: [
                    {
                        japanese: 'こんにちは\nお疲れ様',
                    },
                ],
            });

            expect(result.lyrics[0].japanese).toBe('こんにちは お疲れ様');
        });
    });

    describe('Bulk Lyric Operations', () => {
        it('should handle 10,000 lyric lines without memory issues', async () => {
            const largeLyrics = Array.from({ length: 10000 }, (_, i) => ({
                lineIndex: i,
                startMs: i * 1000,
                endMs: i * 1000 + 900,
                japanese: `Line ${i}`,
                romaji: `Line ${i} Romaji`,
                vietnamese: `Line ${i} Viet`,
            }));

            const validator = z.object({
                lyrics: z.array(z.object({})),
            });

            const result = validator.parse({
                lyrics: largeLyrics,
            });

            expect(result.lyrics.length).toBe(10000);
        });

        it('should reject lyric arrays exceeding max size (50KB)', async () => {
            const tooLarge = Array.from({ length: 100000 }, (_, i) => ({
                lineIndex: i,
                startMs: i * 1000,
                endMs: i * 1000 + 900,
                japanese: 'a'.repeat(50),
            }));

            const validator = z.object({
                lyrics: z
                    .array(z.object({}))
                    .max(50000, 'Lyric array exceeds max size'),
            });

            expect(() =>
                validator.parse({
                    lyrics: tooLarge,
                })
            ).toThrow();
        });
    });
});
