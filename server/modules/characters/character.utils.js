const nameToSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const formatCharacter = (char) => ({
    _id: char._id,
    name: char.name,
    slug: char.slug || nameToSlug(char.name),
    role: char.role,
    description: char.description ?? null,
    origin: char.origin ?? null,
    abilities: char.abilities ?? [],
    relationships: (char.relationships ?? []).map((rel) => ({
        ...rel,
        targetId: rel.targetId ?? null,
    })),
    image: char.image ?? [],
    voiceActor: char.voiceActor ?? null,
    movie: char.movie,
});

/**
 * Build MongoDB filter object from query parameters
 */
const buildCharacterFilter = (query) => {
    const filter = {};
    if (query.movieId) filter.movie = query.movieId;
    if (query.role) filter.role = query.role;
    if (query.search) filter.$text = { $search: query.search };
    return filter;
};

/**
 * Parse and validate pagination parameters
 */
const parsePagination = (page, limit) => {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return { page: parsedPage, limit: parsedLimit };
};

/**
 * Get populate configuration for character queries
 */
const getPopulateConfig = () => [
    { path: 'movie', select: 'title slug poster' },
    { path: 'relationships.targetId', select: 'name image role' },
];

module.exports = { nameToSlug, formatCharacter, buildCharacterFilter, parsePagination, getPopulateConfig };
