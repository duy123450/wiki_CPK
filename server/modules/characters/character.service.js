const Character = require('./character.model');
const { NotFoundError, ValidationError } = require('../../errors');
const { sortByCanonicalOrder } = require('./character.constants');
const {
    nameToSlug,
    formatCharacter,
    buildCharacterFilter,
    parsePagination,
    getPopulateConfig,
} = require('./character.utils');

/**
 * Fetch characters with filtering and canonical sorting
 */
const fetchAllCharacters = async (query) => {
    const filter = buildCharacterFilter(query);
    const { page, limit } = parsePagination(query.page, query.limit);
    const populateConfig = getPopulateConfig();

    const [allCharacters, total] = await Promise.all([
        Character.find(filter)
            .populate(populateConfig)
            .lean(),
        Character.countDocuments(filter),
    ]);

    const sorted = sortByCanonicalOrder(allCharacters);
    const skip = (page - 1) * limit;
    const paginated = sorted.slice(skip, skip + limit);

    return {
        characters: paginated.map(formatCharacter),
        pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
        }
    };
};

/**
 * Fetch by slug with regex fallback for flexible matching
 */
const fetchCharacterBySlug = async (slug) => {
    const populateConfig = getPopulateConfig();

    let character = await Character.findOne({ slug })
        .populate(populateConfig);

    if (!character) {
        const namePattern = slug.replace(/-/g, '[\\s\\-]');
        character = await Character.findOne({
            name: { $regex: new RegExp(`^${namePattern}$`, 'i') },
        }).populate(populateConfig);
    }

    if (!character) {
        throw new NotFoundError(`No character found with slug: ${slug}`);
    }

    return formatCharacter(character.toJSON ? character.toJSON() : character);
};

module.exports = { fetchAllCharacters, fetchCharacterBySlug };
