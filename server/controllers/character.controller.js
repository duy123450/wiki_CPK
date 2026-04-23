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
    relationships: char.relationships ?? [],
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
// :slug is the character name converted to kebab-case
// e.g. "Kaguya" → "kaguya"
const getCharacterBySlug = asyncWrapper(async (req, res) => {
    const { slug } = req.params;

    // Reverse slug back to a name pattern for regex matching
    const namePattern = slug.replace(/-/g, ' ');

    const character = await Character.findOne({
        name: { $regex: new RegExp(`^${namePattern}$`, 'i') },
    })
        .populate('movie', 'title slug poster')
        .populate('relationships.targetId', 'name image role')
        .lean();

    if (!character) {
        throw createCustomError(`No character found with slug: ${slug}`, 404);
    }

    res.status(200).json({ character: formatCharacter(character) });
});

module.exports = { getAllCharacters, getCharacterBySlug };