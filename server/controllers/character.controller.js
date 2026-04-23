const Character = require('../models/character.model');
const asyncWrapper = require('../middleware/async');
const { createCustomError } = require('../errors/custom-error');

// ─── Helper: name → slug (mirrors WikiPage pre-validate hook) ────────────────
const nameToSlug = (name) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

// ─── Helper: format a character document into a clean response ────────────────
const formatCharacter = (char) => ({
    _id: char._id,
    name: char.name,
    slug: nameToSlug(char.name),
    role: char.role,
    description: char.description ?? null,
    origin: char.origin ?? null,
    abilities: char.abilities ?? [],
    metadata: char.metadata ?? null,
    // Explicitly spread each rel so the populated targetId object is preserved
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
// Optional query params: movieId, role, search, page, limit, sort, order
const getAllCharacters = asyncWrapper(async (req, res) => {
    const {
        movieId,
        role,
        search,
        page = 1,
        limit = 20,
        sort = 'name',
        order = 'asc',
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
    const skip = (parsedPage - 1) * parsedLimit;

    const allowedSortFields = ['name', 'role', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'name';
    const sortOrder = order === 'desc' ? -1 : 1;

    const [characters, total] = await Promise.all([
        Character.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(parsedLimit)
            .populate('movie', 'title slug')
            .populate({
                path: 'relationships.targetId',
                select: 'name image role'
            })
            .lean(),
        Character.countDocuments(filter),
    ]);

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

// ─── GET /api/v1/wiki/characters/:slug ───────────────────────────────────────
// Tries to match the stored slug field first (set by mongoose-slug-updater),
// then falls back to a name-based regex for legacy / manually seeded docs.
const getCharacterBySlug = asyncWrapper(async (req, res) => {
    const { slug } = req.params;

    // 1. Match the stored slug field directly
    let character = await Character.findOne({ slug })
        .populate('movie', 'title slug poster')
        .populate({
            path: 'relationships.targetId',
            select: 'name image role'
        });

    // 2. Fallback: reverse slug → flexible name regex
    //    Handles names like "Kaguya" stored with slug "kaguya", or names with
    //    hyphens/spaces where the sidebar WikiPage slug may differ slightly.
    if (!character) {
        const namePattern = slug.replace(/-/g, '[\\s\\-]');
        character = await Character.findOne({
            name: { $regex: new RegExp(`^${namePattern}$`, 'i') },
        })
            .populate('movie', 'title slug poster')
            .populate({
                path: 'relationships.targetId',
                select: 'name image role'
            });
    }

    if (!character) {
        throw createCustomError(`No character found with slug: ${slug}`, 404);
    }

    res.status(200).json({ character: formatCharacter(character.toJSON ? character.toJSON() : character) });
});

module.exports = { getAllCharacters, getCharacterBySlug };