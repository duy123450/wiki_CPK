const Character = require('../models/character.model');
const { createCustomError } = require('../errors/custom-error');

// ─── Canonical display order ──────────────────────────────────────────────────
const CHARACTER_ORDER = [
    "Sakayori Iroha", "Kaguya", "Runami Yachiyo", "Ayatsumugi Roka",
    "Isayama Mami", "Sakayori Asahi", "Komazawa Rai", "Komazawa Noi",
    "inuDoge", "Fushi",
];

const sortByCanonicalOrder = (characters) => {
    const indexMap = new Map(
        CHARACTER_ORDER.map((name, i) => [name.toLowerCase(), i])
    );
    return [...characters].sort((a, b) => {
        const ai = indexMap.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
        const bi = indexMap.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
    });
};

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
 * Fetch characters with filtering and canonical sorting
 */
const fetchAllCharacters = async (query) => {
    const { movieId, role, search, page = 1, limit = 20 } = query;
    const filter = {};

    if (movieId) filter.movie = movieId;
    if (role) filter.role = role;
    if (search) filter.$text = { $search: search };

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [allCharacters, total] = await Promise.all([
        Character.find(filter)
            .populate('movie', 'title slug')
            .populate({ path: 'relationships.targetId', select: 'name image role' })
            .lean(),
        Character.countDocuments(filter),
    ]);

    const sorted = sortByCanonicalOrder(allCharacters);
    const skip = (parsedPage - 1) * parsedLimit;
    const paginated = sorted.slice(skip, skip + parsedLimit);

    return {
        characters: paginated.map(formatCharacter),
        total,
        totalPages: Math.ceil(total / parsedLimit),
        parsedPage,
        parsedLimit
    };
};

/**
 * Fetch by slug with regex fallback for flexible matching
 */
const fetchCharacterBySlug = async (slug) => {
    let character = await Character.findOne({ slug })
        .populate('movie', 'title slug poster')
        .populate({ path: 'relationships.targetId', select: 'name image role' });

    if (!character) {
        const namePattern = slug.replace(/-/g, '[\\s\\-]');
        character = await Character.findOne({
            name: { $regex: new RegExp(`^${namePattern}$`, 'i') },
        }).populate('movie').populate('relationships.targetId');
    }

    if (!character) {
        throw createCustomError(`No character found with slug: ${slug}`, 404);
    }

    return formatCharacter(character.toJSON ? character.toJSON() : character);
};

module.exports = { fetchAllCharacters, fetchCharacterBySlug };