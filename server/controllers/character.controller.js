const Character = require('../models/character.model');
const asyncWrapper = require('../middleware/async');
const { createCustomError } = require('../errors/custom-error');

// ─── Canonical display order ──────────────────────────────────────────────────
const CHARACTER_ORDER = [
    "Sakayori Iroha",
    "Kaguya",
    "Runami Yachiyo",
    "Ayatsumugi Roka",
    "Isayama Mami",
    "Sakayori Asahi",
    "Komazawa Rai",
    "Komazawa Noi",
    "inuDoge",
    "Fushi",
];

const sortByCanonicalOrder = (characters) => {
    const indexMap = new Map(
        CHARACTER_ORDER.map((name, i) => [name.toLowerCase(), i])
    );
    return [...characters].sort((a, b) => {
        const ai = indexMap.get(a.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
        const bi = indexMap.get(b.name.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        // fallback: alphabetical for any characters not in the list
        return a.name.localeCompare(b.name);
    });
};

// ─── Helper: name → slug ──────────────────────────────────────────────────────
const nameToSlug = (name) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

// ─── Helper: format a character document ─────────────────────────────────────
const formatCharacter = (char) => ({
    _id: char._id,
    name: char.name,
    slug: nameToSlug(char.name),
    role: char.role,
    description: char.description ?? null,
    origin: char.origin ?? null,
    abilities: char.abilities ?? [],
    metadata: char.metadata ?? null,
    relationships: (char.relationships ?? []).map((rel) => ({
        ...rel,
        targetId: rel.targetId ?? null,
    })),
    image: char.image ?? [],
    voiceActor: char.voiceActor ?? null,
    movie: char.movie,
    createdAt: char.createdAt,
    updatedAt: char.updatedAt,
});

// ─── GET /api/v1/wiki/characters ──────────────────────────────────────────────
const getAllCharacters = asyncWrapper(async (req, res) => {
    const {
        movieId,
        role,
        search,
        page = 1,
        limit = 20,
    } = req.query;

    const filter = {};

    if (movieId) filter.movie = movieId;

    if (role) {
        const validRoles = ['Protagonist', 'Supporting', 'Antagonist', 'Cameo'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                msg: `Invalid role. Must be one of: ${validRoles.join(', ')}.`,
            });
        }
        filter.role = role;
    }

    if (search) filter.$text = { $search: search };

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    // Fetch all matching docs first so canonical order can be applied before paging
    const [allCharacters, total] = await Promise.all([
        Character.find(filter)
            .populate('movie', 'title slug')
            .populate({ path: 'relationships.targetId', select: 'name image role' })
            .lean(),
        Character.countDocuments(filter),
    ]);

    const sorted = sortByCanonicalOrder(allCharacters);
    const skip = (parsedPage - 1) * parsedLimit;
    const characters = sorted.slice(skip, skip + parsedLimit);
    const totalPages = Math.ceil(total / parsedLimit);

    res.status(200).json({
        characters: characters.map(formatCharacter),
        pagination: {
            total,
            totalPages,
            currentPage: parsedPage,
            limit: parsedLimit,
            hasNextPage: parsedPage < totalPages,
            hasPrevPage: parsedPage > 1,
        },
    });
});

// ─── GET /api/v1/wiki/characters/:slug ────────────────────────────────────────
const getCharacterBySlug = asyncWrapper(async (req, res) => {
    const { slug } = req.params;

    let character = await Character.findOne({ slug })
        .populate('movie', 'title slug poster')
        .populate({ path: 'relationships.targetId', select: 'name image role' });

    if (!character) {
        const namePattern = slug.replace(/-/g, '[\\s\\-]');
        character = await Character.findOne({
            name: { $regex: new RegExp(`^${namePattern}$`, 'i') },
        })
            .populate('movie', 'title slug poster')
            .populate({ path: 'relationships.targetId', select: 'name image role' });
    }

    if (!character) {
        throw createCustomError(`No character found with slug: ${slug}`, 404);
    }

    res.status(200).json({
        character: formatCharacter(character.toJSON ? character.toJSON() : character),
    });
});

module.exports = { getAllCharacters, getCharacterBySlug };