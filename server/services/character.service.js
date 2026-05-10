const Character = require('../modules/characters/character.model');
const { WikiError, NotFoundError } = require('../errors');
const { sortByCanonicalOrder } = require('../modules/characters/character.constants');
const { formatCharacter } = require('../modules/characters/character.utils');

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
        pagination: {
            total,
            totalPages: Math.ceil(total / parsedLimit),
            currentPage: parsedPage,
            limit: parsedLimit,
            hasNextPage: parsedPage < Math.ceil(total / parsedLimit),
            hasPrevPage: parsedPage > 1,
        }
    };
};

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
        throw new NotFoundError(`No character found with slug: ${slug}`);
    }

    return formatCharacter(character.toJSON ? character.toJSON() : character);
};

module.exports = { fetchAllCharacters, fetchCharacterBySlug };
