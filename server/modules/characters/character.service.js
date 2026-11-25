const Character = require('./character.model')
const { NotFoundError, ValidationError } = require('../../errors')
const { sortByCanonicalOrder } = require('./character.constants')
const {
  nameToSlug,
  formatCharacter,
  buildCharacterFilter,
  parsePagination,
  getPopulateConfig,
} = require('./character.utils')

/**
 * Fetch matching characters in canonical order with pagination.
 */
const fetchAllCharacters = async (query) => {
  const filter = buildCharacterFilter(query)
  const { page, limit } = parsePagination(query.page, query.limit)
  const populateConfig = getPopulateConfig()
  const skip = (page - 1) * limit

  const [allCharacters, total] = await Promise.all([
    Character.find(filter).populate(populateConfig).lean(),
    Character.countDocuments(filter),
  ])

  const sorted = sortByCanonicalOrder(allCharacters).slice(skip, skip + limit)

  return {
    characters: sorted.map(formatCharacter),
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  }
}

/**
 * Fetch by slug with regex fallback for flexible matching
 */
const fetchCharacterBySlug = async (slug) => {
  const populateConfig = getPopulateConfig()

  let character = await Character.findOne({ slug }).populate(populateConfig)

  if (!character) {
    // Escape special regex characters except hyphens
    const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const namePattern = escapedSlug.replace(/-/g, '[\\s\\-]')
    character = await Character.findOne({
      name: { $regex: new RegExp(`^${namePattern}$`, 'i') },
    }).populate(populateConfig)
  }

  if (!character) {
    throw new NotFoundError(`No character found with slug: ${slug}`)
  }

  return formatCharacter(character.toJSON ? character.toJSON() : character)
}

const fetchCharacterRoles = async () => {
  // Get distinct role values directly from the database
  const roles = await Character.distinct('role')
  // Ensure we return an array (fallback to empty if undefined)
  return roles || []
}

module.exports = { fetchAllCharacters, fetchCharacterBySlug, fetchCharacterRoles }
