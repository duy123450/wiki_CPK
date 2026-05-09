const Category = require('./models/category.model');
const Movie = require('./models/movie.model');
const WikiPage = require('./models/wiki-page.model');
const { createCustomError } = require('../../errors/custom-error');

/**
 * Logic for the Hero section: Fetches the primary movie information.
 *
 */
const fetchMovieData = async (title = "Chou Kaguya Hime") => {
    const movie = await Movie.findOne({ title });
    if (!movie) {
        throw createCustomError("Movie information not found", 404);
    }
    return movie;
};

/**
 * Aggregates all categories and their associated pages for the sidebar.
 * This replaces the nested mapping logic previously in the controller.
 *
 */
const fetchSidebarData = async () => {
    const categories = await Category.find({}).sort('order');

    const categoriesWithPages = await Promise.all(
        categories.map(async (category) => {
            const pages = await WikiPage.find({ category: category._id })
                .select('title slug order')
                .sort({ order: 1 });

            return {
                _id: category._id,
                name: category.name,
                icon: category.icon,
                slug: category.slug,
                pages: pages.map(p => ({
                    title: p.title,
                    slug: p.slug
                }))
            };
        })
    );

    return categoriesWithPages;
};

/**
 * Retrieves a specific wiki page by its slug and populates its category details.
 *
 */
const fetchPageBySlug = async (slug) => {
    if (!slug) {
        throw createCustomError("Slug is required to fetch a page", 400);
    }

    const page = await WikiPage.findOne({ slug }).populate('category');

    if (!page) {
        throw createCustomError(`Wiki page not found: ${slug}`, 404);
    }

    return page;
};

module.exports = {
    fetchMovieData,
    fetchSidebarData,
    fetchPageBySlug
};