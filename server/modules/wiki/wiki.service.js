const Category = require('./models/category.model')
const Movie = require('./models/movie.model')
const WikiPage = require('./models/wiki-page.model')
const Soundtrack = require('../soundtrack/sound-track.model')
const { WikiError, ValidationError } = require('../../errors')
const asyncWrapper = require('../../middleware/async')

/**
 * Logic for the Hero section: Fetches the primary movie information.
 */
const fetchMovieData = async (title = 'Chou Kaguya Hime') => {
  const movie = await Movie.findOne({ title })
  if (!movie) {
    throw new WikiError('Movie information not found', 404)
  }
  return movie
}

/**
 * Aggregates all categories and their associated pages for the sidebar.
 * For the 'soundtrack' category, real track documents are used as pages.
 */
const fetchSidebarData = async () => {
  const categories = await Category.find({}).sort('order')

  const categoriesWithPages = await Promise.all(
    categories.map(async (category) => {
      let pages

      if (category.slug === 'soundtrack') {
        // Return actual tracks as sidebar entries, excluding tracks 16 to 27
        const tracks = await Soundtrack.find({
          $or: [{ trackNumber: { $lt: 16 } }, { trackNumber: { $gt: 27 } }]
        })
          .select('title slug trackNumber')
          .sort({ trackNumber: 1 })

        pages = tracks.map((t) => ({
          title: t.title,
          slug: t.slug,
        }))
      } else {
        const wikiPages = await WikiPage.find({ category: category._id })
          .select('title slug order')
          .sort({ order: 1 })

        pages = wikiPages.map((p) => ({
          title: p.title,
          slug: p.slug,
        }))
      }

      return {
        _id: category._id,
        name: category.name,
        icon: category.icon,
        slug: category.slug,
        pages,
      }
    })
  )

  return categoriesWithPages
}

/**
 * Retrieves a specific wiki page by its slug and populates its category details.
 */
const fetchPageBySlug = async (slug) => {
  if (!slug) {
    throw new ValidationError('Slug is required to fetch a page', 400)
  }

  const page = await WikiPage.findOne({ slug }).populate('category')

  if (!page) {
    throw new WikiError(`Wiki page not found: ${slug}`, 404)
  }

  return page
}

module.exports = {
  fetchMovieData,
  fetchSidebarData,
  fetchPageBySlug,
}
